import 'server-only';
import { connectToDatabase } from '@/lib/db';
import { Search, SearchResult } from '@/lib/models';
import type { CombinedSignals, ImageSignals, RawCandidate } from './types';
import { diagnoseMatch, scoreCandidate } from './confidence';
import { deriveSearchQueries } from './deriveSearchQuery';
import { generateCombinedEmbedding } from './embeddings';
import { analyzeImage, combineSignals, emptySignals, signalQuery } from './imageSignals';
import { searchGoogleLens } from './providers/serpapiLens';
import { searchEbay } from './providers/ebay';
import { searchEtsy } from './providers/etsy';
import { resolvePriceFromUrl } from './priceResolver';

function toResultDoc(
  searchId: unknown,
  candidate: RawCandidate,
  rank: number,
  signals: CombinedSignals,
  hint: string | null | undefined
) {
  const scored = scoreCandidate({ candidate, rank, signals, hint });
  return {
    searchId,
    title: candidate.title,
    image: candidate.image,
    price: candidate.price,
    url: candidate.url,
    source: candidate.source,
    sourceKind: candidate.sourceKind,
    similarityScore: scored.similarityScore,
    confidence: scored.confidence,
    matchScore: scored.matchScore,
    matchReasons: scored.reasons,
    metadata: candidate.metadata ?? {},
  };
}

/**
 * Dedupes by URL, keeping the first occurrence — same pattern
 * serpapiLens.ts already uses to merge results across multiple photos.
 * Needed here because two query variants against the same provider
 * will often return overlapping listings; without this, the same eBay item
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
 * parallel, tolerating individual variant failures. Order is preserved as
 * variant-major (all of the most specific query's results first, then the
 * broader query's additions), so the most specific matches keep the best
 * rank positions after dedupe — which matters, since rank drives the visual
 * part of the score (see confidence.ts).
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
// maxDuration (60s). Each resolve has its own 6s timeout (priceResolver.ts),
// run in parallel, so this bounds worst case to ~6s rather than 6s × N.
const MAX_PRICE_RESOLUTIONS = 10;

/**
 * Best-effort price backfill for results the providers returned with no
 * price at all. Never throws: an unresolved price just leaves the result as
 * it was (price: undefined → "See price on site" downstream).
 */
async function backfillMissingPrices(docs: ReturnType<typeof toResultDoc>[]): Promise<void> {
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

type SubdocLike = { toObject?: () => ImageSignals } & ImageSignals;

/**
 * Makes sure every photo on the search has a signals entry, and runs the
 * vision pass (tag text, brand, material, design cues) on any that haven't
 * been analyzed yet. Already-analyzed photos are skipped, so a refine only
 * pays for the NEW photo. Upload-time fields (quality, EXIF summary) are kept.
 */
async function ensureSignals(search: {
  images: string[];
  imageSignals?: unknown[];
  set: (path: string, value: unknown) => unknown;
}): Promise<ImageSignals[]> {
  const existing = new Map<string, ImageSignals>();
  for (const raw of (search.imageSignals ?? []) as SubdocLike[]) {
    const plain = typeof raw.toObject === 'function' ? raw.toObject() : raw;
    existing.set(plain.url, plain);
  }

  const list = search.images.map((url) => existing.get(url) ?? emptySignals(url));
  const todo = list.filter((s) => !s.analyzed);

  const settled = await Promise.allSettled(todo.map((s) => analyzeImage(s.url)));
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      Object.assign(todo[i], r.value, { analyzed: true });
    } else if (r.status === 'rejected') {
      console.error(`[runSearch] vision pass failed for ${todo[i].url} (non-fatal):`, r.reason);
    }
  });

  search.set('imageSignals', list);
  return list;
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

  // Embedding, Lens and the vision pass don't depend on each other, so they
  // run together — the vision call adds latency and the route has a 60s budget.
  const [embeddingRun, lensRun, signalsRun] = await Promise.allSettled([
    generateCombinedEmbedding(imageUrls),
    searchGoogleLens(imageUrls),
    ensureSignals(search),
  ]);

  if (embeddingRun.status === 'fulfilled') {
    search.embedding = embeddingRun.value;
  } else {
    console.error(`[runSearch] embedding failed for ${searchId} (non-fatal):`, embeddingRun.reason);
  }

  let lensResults: RawCandidate[] = [];
  if (lensRun.status === 'fulfilled') {
    lensResults = lensRun.value;
  } else {
    console.error(`[runSearch] SerpApi Lens failed for ${searchId}:`, lensRun.reason);
  }

  let signalsList: ImageSignals[];
  if (signalsRun.status === 'fulfilled') {
    signalsList = signalsRun.value;
  } else {
    console.error(`[runSearch] image signals failed for ${searchId} (non-fatal):`, signalsRun.reason);
    signalsList = imageUrls.map(emptySignals);
  }
  const combined = combineSignals(signalsList);

  // The "pivot": once we know what the item likely is (the user's hint, what
  // we read off the tag, or Lens's top title), fan that out into up to 2 query
  // variants against every text-based marketplace we're authorized to query.
  const queries = deriveSearchQueries(search.hint, lensResults[0]?.title, signalQuery(combined));

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

  const hint = search.hint;
  const resultDocs = [
    ...lensResults.map((c, i) => toResultDoc(search._id, c, i, combined, hint)),
    ...ebayResults.map((c, i) => toResultDoc(search._id, c, i, combined, hint)),
    ...etsyResults.map((c, i) => toResultDoc(search._id, c, i, combined, hint)),
  ];

  // Best-effort — mutates price in place on any doc that resolves.
  await backfillMissingPrices(resultDocs);

  if (resultDocs.length > 0) {
    await SearchResult.insertMany(resultDocs);
  }

  const bestScore = resultDocs.reduce((max, d) => Math.max(max, d.matchScore), 0);
  const diagnosis = diagnoseMatch({
    bestScore,
    signals: combined,
    imageCount: imageUrls.length,
    hint,
  });
  // Cleared (undefined) once a rerun finds a strong match.
  search.set('diagnosis', diagnosis ?? undefined);

  const hasConfidentResult = resultDocs.some((d) => d.confidence !== 'guess');
  search.status =
    resultDocs.length === 0 ? 'failed' : hasConfidentResult ? 'complete' : 'low_confidence';
  await search.save();
}