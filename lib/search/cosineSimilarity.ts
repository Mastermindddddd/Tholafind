/**
 * Not used for confidence scoring in this MVP — see lib/search/confidence.ts
 * and the README for why Phase 3 uses provider ranking instead (keeps a
 * single synchronous search fast: one embedding call for the query photo,
 * not one per candidate). Reserved for a future re-ranking pass, or a
 * "find visually similar past searches" feature, once search work moves to
 * a background job (Phase 7's alert-checking job is a natural place to
 * introduce that infrastructure).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must be the same length to compare.');
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}