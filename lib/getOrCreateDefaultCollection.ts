import 'server-only';
import { Types } from 'mongoose';
import { Collection, type CollectionDoc } from '@/lib/models';

/**
 * Every new account gets a default collection created alongside it (see
 * getOrCreateUser.ts). This is the fallback for accounts that existed
 * before that was added — finds the existing default, or creates one on
 * the spot if it's somehow still missing, rather than assuming it exists.
 */
export async function getOrCreateDefaultCollection(
  userId: Types.ObjectId
): Promise<CollectionDoc & { _id: Types.ObjectId }> {
  const existing = await Collection.findOne({ userId, isDefault: true });
  if (existing) return existing as CollectionDoc & { _id: Types.ObjectId };

  const created = await Collection.create({
    userId,
    name: 'Saved finds',
    isDefault: true,
  });
  return created as CollectionDoc & { _id: Types.ObjectId };
}