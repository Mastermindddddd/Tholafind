import 'server-only';
import { Types } from 'mongoose';
import { DiscoveryItem, type DiscoveryItemDoc, SearchResult, type SearchResultDoc } from '@/lib/models';
import { rankFeed } from './rankFeed';
import { getUserInterests } from './getUserInterests';

interface GetCuratedResultsOptions {
  sourceKind?: 'retail' | 'resale' | 'vintage';
  limit?: number;
  excludeId?: string;
  /** When given and the user has history, the feed is tailored to them. */
  userId?: Types.ObjectId | string | null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

/**
 * Powers the public /browse feed from daily-ingested DiscoveryItem docs —
 * not from user searches.
 *
 *   1. Active only (stale items are retired by the ingest job's 14-day cutoff).
 *   2. A wide pool (up to 1,500 of the newest items), not just the latest few
 *      hundred, so the daily reshuffle has real variety to draw from.
 *   3. Ranked by rankFeed.ts: a per-day shuffle (new order every day, same
 *      for everyone), real popularity from saves, freshness, and, for users
 *      with history, a personal-interest score. See that file for the weights.
 *   4. A diversity cap per category that adapts to how many categories exist.
 *
 * Returns whether the feed was actually personalised so the page can say so.
 */
export async function getBrowseFeed(
  options: GetCuratedResultsOptions = {}
): Promise<{ items: (DiscoveryItemDoc & { _id: Types.ObjectId })[]; personalized: boolean }> {
  const { sourceKind, limit = 60, excludeId, userId } = options;

  const query: Record<string, unknown> = { active: true };
  if (sourceKind) query.sourceKind = sourceKind;
  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const poolSize = Math.min(1500, Math.max(400, limit * 10));

  const [pool, interests] = await Promise.all([
    DiscoveryItem.find(query)
      .sort({ fetchedAt: -1 })
      .limit(poolSize)
      .select('title category sourceKind source price image url saveCount fetchedAt')
      .lean(),
    userId
      ? getUserInterests(userId).catch((err) => {
          // Personalisation is a bonus: never let it break the page.
          console.error('[browse] getUserInterests failed (non-fatal):', err);
          return null;
        })
      : Promise.resolve(null),
  ]);

  const items = rankFeed(pool, { limit, dayKey: todayKey(), interests }) as unknown as (DiscoveryItemDoc & {
    _id: Types.ObjectId;
  })[];

  return { items, personalized: !!interests && interests.strength > 0 };
}

/** Kept for existing callers: the same feed without the personalisation flag. */
export async function getCuratedResults(
  options: GetCuratedResultsOptions = {}
): Promise<(DiscoveryItemDoc & { _id: Types.ObjectId })[]> {
  return (await getBrowseFeed(options)).items;
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