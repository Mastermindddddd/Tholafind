import 'server-only';
import { connectToDatabase } from '@/lib/db';
import { Search, SearchResult } from '@/lib/models';
import { RawCandidate } from './types';
import { confidenceForCandidate, scoreForRank } from './confidence';
import { deriveSearchQuery } from './deriveSearchQuery';
import { generateEmbedding } from './embeddings';
import { searchGoogleLens } from './providers/serpapiLens';
import { searchEbay } from './providers/ebay';
import { searchEtsy } from './providers/etsy';

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
 * Runs a full multi-source search for an existing Search document and
 * writes the resulting SearchResult documents. Called synchronously from
 * the upload route (see README — Phase 3 — for the tradeoffs of that choice
 * versus a background job).
 *
 * Never throws for individual provider failures — a search with 2 of 3
 * providers working still returns useful results. It only throws if the
 * Search document itself can't be found or saved.
 */
export async function runSearch(searchId: string): Promise<void> {
  await connectToDatabase();

  const search = await Search.findById(searchId);
  if (!search) {
    throw new Error(`Search ${searchId} not found.`);
  }

  search.status = 'searching';
  await search.save();

  const imageUrl = search.images[0];

  // Query embedding: stored for future use (see cosineSimilarity.ts) —
  // failure here is non-fatal, the rest of the search continues without it.
  try {
    const embedding = await generateEmbedding(imageUrl);
    search.embedding = embedding;
  } catch (err) {
    console.error(`[runSearch] embedding failed for ${searchId} (non-fatal):`, err);
  }

  // Retail / visual search.
  let lensResults: RawCandidate[] = [];
  try {
    lensResults = await searchGoogleLens(imageUrl);
  } catch (err) {
    console.error(`[runSearch] SerpApi Lens failed for ${searchId}:`, err);
  }

  // Text query for the marketplace providers, preferring the user's hint.
  const query = deriveSearchQuery(search.hint, lensResults[0]?.title);

  let ebayResults: RawCandidate[] = [];
  let etsyResults: RawCandidate[] = [];

  if (query) {
    const [ebaySettled, etsySettled] = await Promise.allSettled([
      searchEbay(query),
      searchEtsy(query),
    ]);

    if (ebaySettled.status === 'fulfilled') {
      ebayResults = ebaySettled.value;
    } else {
      console.error(`[runSearch] eBay failed for ${searchId}:`, ebaySettled.reason);
    }

    if (etsySettled.status === 'fulfilled') {
      etsyResults = etsySettled.value;
    } else {
      console.error(`[runSearch] Etsy failed for ${searchId}:`, etsySettled.reason);
    }
  } else {
    console.warn(`[runSearch] no query available for ${searchId} — skipping eBay/Etsy.`);
  }

  const resultDocs = [
    ...lensResults.map((c, i) => toResultDoc(search._id, c, i)),
    ...ebayResults.map((c, i) => toResultDoc(search._id, c, i)),
    ...etsyResults.map((c, i) => toResultDoc(search._id, c, i)),
  ];

  if (resultDocs.length > 0) {
    await SearchResult.insertMany(resultDocs);
  }

  const hasConfidentResult = resultDocs.some((d) => d.confidence !== 'guess');
  search.status =
    resultDocs.length === 0 ? 'failed' : hasConfidentResult ? 'complete' : 'low_confidence';
  await search.save();
}