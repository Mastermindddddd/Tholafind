import 'server-only';
import type { Types } from 'mongoose';
import { Collection, CollectionItem } from '@/lib/models';

/** Returns the subset of resultIds already saved by this user, across any
 * of their collections. Returns an empty set for anonymous visitors —
 * callers don't need a separate signed-in check. */
export async function getSavedResultIds(
  userId: Types.ObjectId | null | undefined,
  resultIds: Types.ObjectId[]
): Promise<Set<string>> {
  if (!userId || resultIds.length === 0) return new Set();

  const userCollectionIds = (await Collection.find({ userId }).select('_id')).map((c) => c._id);
  const savedItems = await CollectionItem.find({
    collectionId: { $in: userCollectionIds },
    searchResultId: { $in: resultIds },
  }).select('searchResultId');

  return new Set(savedItems.map((item) => String(item.searchResultId)));
}