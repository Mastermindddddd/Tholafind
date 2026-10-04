import 'server-only';
import { connectToDatabase } from '@/lib/db';
import { Search, SearchResult } from '@/lib/models';
import { RawCandidate } from './types';
import { confidenceForCandidate, scoreForRank } from './confidence';
import { deriveSearchQueries } from './deriveSearchQuery';
import { generateCombinedEmbedding } from './embeddings';
import { searchGoogleLens } from './providers/serpapiLens';
import { searchEbay } from './providers/ebay';
import { searchEtsy } from './providers/etsy';
import { resolvePriceFromUrl } from './priceResolver';

function toResultDoc(searchId: unknown, candidate: RawCandidate, rank: number) {
  return {
    searchId,
    title: candidate.title,
    image: candidate.image,
    price: candidate.price,
    url: candidate.url,
    source: candidate.source,
    sourceKind: candidate.sourceKind,
    similarityScore: scoreForRank(rank),
    confidence: confidenceForCandidate(candidate.sourceKind, rank),
    metadata: candidate.metadata ?? {},
  };
}

/**
 * Dedupes by URL, keeping the first occurrence — same pattern
 * serpapiLens.ts already uses to merge results across multiple photos.
 * Needed here because two query variants against the same provider
 * (e.g. "Nike Air Vaporfly 3 Running Shoe" and "Nike Air Vaporfly") will
 * often return overlapping listings; without this, the same eBay item
 * could show up twice in one hunt's results, once per query.
 */
function dedupeByUrl(candidates: RawCandidate[]): RawCandidate[] {
  const seen = new Map<string, RawCandidate>();
  for (const c of candidates) {
    if (!seen.has(c.url)) seen.set(c.url, c);
  }
  return Array.from(seen.values());
}

/**
 * Runs one provider's search across every derived query variant in
 * parallel, tolerating individual variant failures — one variant failing
 * (say, a transient eBay error on the broader query) shouldn't throw away
 * results the other variant returned fine. Order is preserved as
 * variant-major (all of the most specific query's results first, then the
 * broader query's additions), so the most specific matches keep the best
 * rank positions after dedupe — which matters, since rank drives confidence
 * scoring downstream (see confidence.ts).
 */
async function runProviderAcrossQueries(
  label: string,
  searchId: string,
  queries: string[],
  provider: (query: string) => Promise<RawCandidate[]>
): Promise<RawCandidate[]> {
  const runs = await Promise.allSettled(queries.map((q) => provider(q)));

  const collected: RawCandidate[] = [];
  runs.forEach((run, i) => {
    if (run.status === 'fulfilled') {
      collected.push(...run.value);
    } else {
      console.error(`[runSearch] ${label} query "${queries[i]}" failed for ${searchId}:`, run.reason);
    }
  });

  return dedupeByUrl(collected);
}

// Caps how many priceless results get a live page-fetch per search, so one
// hunt with a lot of price-missing matches can't blow out the route's
// maxDuration (60s) — the eBay/Etsy/Lens calls above already used some of
// that budget. Each resolve has its own 6s timeout (priceResolver.ts), run
// in parallel, so this bounds worst case to ~6s rather than 6s × N.
const MAX_PRICE_RESOLUTIONS = 10;

/**
 * Best-effort price backfill for results the providers returned with no
 * price at all (see the price?: field on RawCandidate/toResultDoc) — fetches
 * each item's own page and extracts price from its structured data. Never
 * throws: an unresolved price just leaves the result exactly as it already
 * was (price: undefined → "See price on site" downstream in toFindResult).
 */
async function backfillMissingPrices(
  docs: ReturnType<typeof toResultDoc>[]
): Promise<void> {
  const missing = docs.filter((d) => !d.price).slice(0, MAX_PRICE_RESOLUTIONS);
  if (missing.length === 0) return;

  await Promise.all(
    missing.map(async (doc) => {
      try {
        const resolved = await resolvePriceFromUrl(doc.url);
        if (resolved) doc.price = resolved;
      } catch (err) {
        console.error(`[runSearch] price resolution failed for ${doc.url}:`, err);
      }
    })
  );
}

export async function runSearch(searchId: string): Promise<void> {
  await connectToDatabase();

  const search = await Search.findById(searchId);
  if (!search) {
    throw new Error(`Search ${searchId} not found.`);
  }

  search.status = 'searching';
  await search.save();
  await SearchResult.deleteMany({ searchId: search._id });

  const imageUrls = search.images;

  try {
    search.embedding = await generateCombinedEmbedding(imageUrls);
  } catch (err) {
    console.error(`[runSearch] embedding failed for ${searchId} (non-fatal):`, err);
  }

  let lensResults: RawCandidate[] = [];
  try {
    lensResults = await searchGoogleLens(imageUrls);
  } catch (err) {
    console.error(`[runSearch] SerpApi Lens failed for ${searchId}:`, err);
  }

  // The "pivot": once Lens has identified what the item likely is (or the
  // user has told us via a hint), fan that identification out into up to 2
  // query variants and run each against every text-based marketplace we're
  // actually authorized to query (eBay, Etsy) — see deriveSearchQuery.ts.
  const queries = deriveSearchQueries(search.hint, lensResults[0]?.title);

  let ebayResults: RawCandidate[] = [];
  let etsyResults: RawCandidate[] = [];

  if (queries.length > 0) {
    [ebayResults, etsyResults] = await Promise.all([
      runProviderAcrossQueries('eBay', searchId, queries, searchEbay),
      runProviderAcrossQueries('Etsy', searchId, queries, searchEtsy),
    ]);
  } else {
    console.warn(`[runSearch] no query available for ${searchId} — skipping eBay/Etsy.`);
  }

  const resultDocs = [
    ...lensResults.map((c, i) => toResultDoc(search._id, c, i)),
    ...ebayResults.map((c, i) => toResultDoc(search._id, c, i)),
    ...etsyResults.map((c, i) => toResultDoc(search._id, c, i)),
  ];

  // Best-effort — mutates price in place on any doc that resolves.
  await backfillMissingPrices(resultDocs);

  if (resultDocs.length > 0) {
    await SearchResult.insertMany(resultDocs);
  }

  const hasConfidentResult = resultDocs.some((d) => d.confidence !== 'guess');
  search.status =
    resultDocs.length === 0 ? 'failed' : hasConfidentResult ? 'complete' : 'low_confidence';
  await search.save();
}