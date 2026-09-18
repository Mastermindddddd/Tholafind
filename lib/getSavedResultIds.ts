import 'server-only';
import type { Types } from 'mongoose';
import { Collection, CollectionItem } from '@/lib/models';

/**
 * Returns the subset of item IDs already saved by this user, across any of
 * their collections. `itemType` distinguishes SearchResult saves (from a
 * user's own hunt) from DiscoveryItem saves (from /browse) — same _id
 * space collision risk otherwise, since both are ObjectIds.
 */
export async function getSavedResultIds(
  userId: Types.ObjectId | null | undefined,
  itemIds: Types.ObjectId[],
  itemType: 'SearchResult' | 'DiscoveryItem' = 'SearchResult'
): Promise<Set<string>> {
  if (!userId || itemIds.length === 0) return new Set();

  const userCollectionIds = (await Collection.find({ userId }).select('_id')).map((c) => c._id);
  const savedItems = await CollectionItem.find({
    collectionId: { $in: userCollectionIds },
    itemType,
    itemId: { $in: itemIds },
  }).select('itemId');

  return new Set(savedItems.map((item) => String(item.itemId)));
}