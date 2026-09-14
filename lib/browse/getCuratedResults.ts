import 'server-only';
import { Types } from 'mongoose';
import { SearchResult, type SearchResultDoc } from '@/lib/models';

interface GetCuratedResultsOptions {
  sourceKind?: 'retail' | 'resale' | 'vintage';
  limit?: number;
  /** Excludes one specific result — used by the item detail page's
   * "similar finds" rail so an item never lists itself as related. */
  excludeId?: string;
}

/**
 * Powers the public /browse feed. "Smart" here means three real, cheap
 * decisions rather than a heavy ranking model:
 *
 *   1. Only exact/close confidence — a public discovery feed showing our
 *      own "best guess" tier would undercut the one thing that makes
 *      Tholafind's results trustworthy in the first place.
 *   2. A diversity cap of 2 results per underlying search — otherwise one
 *      unusually prolific search (e.g. a multi-image refine with many
 *      matches) could dominate a page that's supposed to feel like a
 *      cross-section of everything people are hunting for.
 *   3. A shuffle within that pool, so reloading the page doesn't always
 *      show the exact same reverse-chronological order.
 *
 * Deliberately does NOT expose which user ran the underlying search —
 * SearchResult documents never carried that information to begin with
 * (only searchId), so there's nothing to accidentally leak here.
 */
export async function getCuratedResults(
  options: GetCuratedResultsOptions = {}
): Promise<(SearchResultDoc & { _id: Types.ObjectId })[]> {
  const { sourceKind, limit = 60, excludeId } = options;

  const query: Record<string, unknown> = {
    confidence: { $in: ['exact', 'close'] },
  };
  if (sourceKind) query.sourceKind = sourceKind;
  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  // Pull a larger pool than needed so the diversity cap below has real
  // room to work rather than just truncating an already-small result set.
  const pool = await SearchResult.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 5)
    .lean();

  const perSearchCount = new Map<string, number>();
  const diverse = pool.filter((r) => {
    const key = String(r.searchId);
    const count = perSearchCount.get(key) ?? 0;
    if (count >= 2) return false;
    perSearchCount.set(key, count + 1);
    return true;
  });

  for (let i = diverse.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [diverse[i], diverse[j]] = [diverse[j], diverse[i]];
  }

  return diverse.slice(0, limit) as (SearchResultDoc & { _id: Types.ObjectId })[];
}