import 'server-only';
import { Types } from 'mongoose';
import { Search, SearchResult, Collection, CollectionItem, DiscoveryItem } from '@/lib/models';
import { tokenize, type Interests } from './rankFeed';

const MAX_SEARCHES = 20;
const MAX_SAVED = 100;
/** History size at which personalisation reaches full strength. */
const FULL_STRENGTH_AT = 15;

function bump(map: Record<string, number>, key: string, by: number) {
  map[key] = (map[key] ?? 0) + by;
}

function bumpTokens(map: Record<string, number>, text: string | null | undefined, by: number) {
  for (const t of tokenize(text)) bump(map, t, by);
}

interface SignalLean {
  brand?: string;
  itemType?: string;
  material?: string;
  color?: string;
}
interface SearchLean {
  _id: Types.ObjectId;
  hint?: string;
  imageSignals?: SignalLean[];
}
interface TitleLean {
  _id: Types.ObjectId;
  searchId?: Types.ObjectId;
  title: string;
  sourceKind?: string;
  category?: string;
}

/**
 * What this user seems to care about, from their own account only:
 *  - their recent hunts: hints they typed, brand/item type read from their
 *    photos, and the titles of the best matches those hunts found
 *  - items they saved to collections
 * Newer hunts count more than older ones. Returns null for users with no
 * history, which makes the feed fall back to the shared daily drop.
 */
export async function getUserInterests(userId: Types.ObjectId | string): Promise<Interests | null> {
  const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const keywords: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const sourceKinds: Record<string, number> = {};

  // --- recent hunts ---
  const searches = (await Search.find({ userId: uid })
    .sort({ createdAt: -1 })
    .limit(MAX_SEARCHES)
    .select('hint imageSignals')
    .lean()) as unknown as SearchLean[];

  const recencyWeight = new Map<string, number>();
  searches.forEach((s, i) => {
    const w = Math.pow(0.9, i);
    recencyWeight.set(String(s._id), w);
    bumpTokens(keywords, s.hint, 3 * w);
    for (const sig of s.imageSignals ?? []) {
      bumpTokens(keywords, sig.brand, 3 * w);
      bumpTokens(keywords, sig.itemType, 2 * w);
      bumpTokens(keywords, sig.material, 1 * w);
      bumpTokens(keywords, sig.color, 1 * w);
    }
  });

  if (searches.length > 0) {
    const topResults = (await SearchResult.find({
      searchId: { $in: searches.map((s) => s._id) },
      confidence: { $in: ['exact', 'close'] },
    })
      .sort({ matchScore: -1 })
      .limit(80)
      .select('title sourceKind searchId')
      .lean()) as unknown as TitleLean[];

    for (const r of topResults) {
      const w = recencyWeight.get(String(r.searchId)) ?? 0.5;
      bumpTokens(keywords, r.title, 1 * w);
      if (r.sourceKind) bump(sourceKinds, r.sourceKind, 0.5 * w);
    }
  }

  // --- saved items ---
  let savedCount = 0;
  const collectionIds = (await Collection.find({ userId: uid }).select('_id').lean()).map(
    (c) => c._id
  );
  if (collectionIds.length > 0) {
    const saved = (await CollectionItem.find({ collectionId: { $in: collectionIds } })
      .sort({ _id: -1 })
      .limit(MAX_SAVED)
      .select('itemType itemId')
      .lean()) as unknown as { itemType: string; itemId: Types.ObjectId }[];
    savedCount = saved.length;

    const discoveryIds = saved.filter((s) => s.itemType === 'DiscoveryItem').map((s) => s.itemId);
    const resultIds = saved.filter((s) => s.itemType === 'SearchResult').map((s) => s.itemId);

    const [discovery, results] = await Promise.all([
      discoveryIds.length
        ? (DiscoveryItem.find({ _id: { $in: discoveryIds } })
            .select('title category sourceKind')
            .lean() as unknown as Promise<TitleLean[]>)
        : Promise.resolve([] as TitleLean[]),
      resultIds.length
        ? (SearchResult.find({ _id: { $in: resultIds } })
            .select('title sourceKind')
            .lean() as unknown as Promise<TitleLean[]>)
        : Promise.resolve([] as TitleLean[]),
    ]);

    for (const d of discovery) {
      bumpTokens(keywords, d.title, 2);
      if (d.category) {
        bump(categories, d.category, 3);
        bumpTokens(keywords, d.category, 2);
      }
      if (d.sourceKind) bump(sourceKinds, d.sourceKind, 1);
    }
    for (const r of results) {
      bumpTokens(keywords, r.title, 2);
      if (r.sourceKind) bump(sourceKinds, r.sourceKind, 1);
    }
  }

  const signals = searches.length + savedCount * 2;
  if (signals === 0) return null;

  return {
    keywords,
    categories,
    sourceKinds,
    strength: Math.min(1, signals / FULL_STRENGTH_AT),
  };
}