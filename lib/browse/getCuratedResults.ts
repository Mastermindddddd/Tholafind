import 'server-only';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { DiscoveryItem, type DiscoveryItemDoc, SearchResult, type SearchResultDoc } from '@/lib/models';

interface GetCuratedResultsOptions {
  sourceKind?: 'retail' | 'resale' | 'vintage';
  limit?: number;
  excludeId?: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

/** Deterministic per-item, per-day rank — same order for every visitor
 * today, different order tomorrow. Cheaper than storing a shuffle. */
function dailyRank(id: string): number {
  const hash = crypto.createHash('sha1').update(`${todayKey()}:${id}`).digest('hex');
  return parseInt(hash.slice(0, 8), 16);
}

/**
 * Powers the public /browse feed from daily-ingested DiscoveryItem docs —
 * not from user searches. "Smart" here is three cheap decisions:
 *
 *   1. Active only — DiscoveryItem.price is schema-required, so this is
 *      really just the `active` filter (stale items retired by the
 *      ingest job's 14-day cutoff).
 *   2. A diversity cap of 3 per category, so one heavily-stocked category
 *      doesn't dominate.
 *   3. A date-seeded deterministic order instead of pure recency — every
 *      visitor sees the same "today's drop" sequence, with saveCount
 *      nudging popular items up within that.
 */
export async function getCuratedResults(
  options: GetCuratedResultsOptions = {}
): Promise<(DiscoveryItemDoc & { _id: Types.ObjectId })[]> {
  const { sourceKind, limit = 60, excludeId } = options;

  const query: Record<string, unknown> = { active: true };
  if (sourceKind) query.sourceKind = sourceKind;
  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const pool = await DiscoveryItem.find(query)
    .sort({ fetchedAt: -1 })
    .limit(limit * 6)
    .lean();

  const perCategoryCount = new Map<string, number>();
  const diverse = pool.filter((item) => {
    const count = perCategoryCount.get(item.category) ?? 0;
    if (count >= 3) return false;
    perCategoryCount.set(item.category, count + 1);
    return true;
  });

  diverse.sort((a, b) => {
    const popA = Math.min(a.saveCount ?? 0, 20) * 1_000_000;
    const popB = Math.min(b.saveCount ?? 0, 20) * 1_000_000;
    const rankA = dailyRank(String(a._id)) - popA;
    const rankB = dailyRank(String(b._id)) - popB;
    return rankA - rankB;
  });

  return diverse.slice(0, limit) as (DiscoveryItemDoc & { _id: Types.ObjectId })[];
}

interface GetCuratedSearchResultsOptions {
  sourceKind?: 'retail' | 'resale' | 'vintage';
  limit?: number;
  excludeId?: string;
}

/**
 * Original SearchResult-scoped curation logic, kept alongside the
 * DiscoveryItem-scoped getCuratedResults above specifically for the item
 * detail page's "related finds" rail (app/browse/item/[id]/page.tsx),
 * which intentionally stays within the matched-photo pool rather than
 * pulling from the general /browse discovery feed.
 */
export async function getCuratedSearchResults(
  options: GetCuratedSearchResultsOptions = {}
): Promise<(SearchResultDoc & { _id: Types.ObjectId })[]> {
  const { sourceKind, limit = 60, excludeId } = options;

  const query: Record<string, unknown> = {
    confidence: { $in: ['exact', 'close'] },
  };
  if (sourceKind) query.sourceKind = sourceKind;
  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

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