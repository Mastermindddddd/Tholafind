import { Confidence, SourceKind } from '@/lib/types';

/**
 * Confidence is derived from each provider's own result ranking, not a
 * uniform cosine-similarity score. See README (Phase 3) for the reasoning:
 * Google Lens does real server-side visual matching, so its ranking is a
 * genuine visual-similarity signal — but eBay and Etsy results come from a
 * TEXT query, not the photo itself, so it would be dishonest to call any of
 * those an "exact" visual match no matter how high they rank.
 */
export function confidenceForCandidate(sourceKind: SourceKind, rank: number): Confidence {
  if (sourceKind === 'retail') {
    if (rank <= 1) return 'exact';
    if (rank <= 4) return 'close';
    return 'guess';
  }
  // resale (eBay) and vintage (Etsy): text-matched, capped below 'exact'.
  if (rank === 0) return 'close';
  return 'guess';
}

/** A rank-derived stand-in for SearchResult.similarityScore (0–1). */
export function scoreForRank(rank: number): number {
  return Math.max(0.15, Number((1 - rank * 0.15).toFixed(2)));
}