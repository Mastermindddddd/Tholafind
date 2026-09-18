import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { getOrCreateDefaultCollection } from '@/lib/getOrCreateDefaultCollection';
import { Collection, CollectionItem, SearchResult, DiscoveryItem } from '@/lib/models';

export const dynamic = 'force-dynamic';

type ItemType = 'SearchResult' | 'DiscoveryItem';

function parseItemType(value: unknown): ItemType | null {
  return value === 'SearchResult' || value === 'DiscoveryItem' ? value : null;
}

async function resolveTargetCollection(userId: Types.ObjectId, collectionId: unknown) {
  if (typeof collectionId === 'string' && collectionId.length > 0) {
    if (!Types.ObjectId.isValid(collectionId)) return null;
    return Collection.findOne({ _id: collectionId, userId });
  }
  return getOrCreateDefaultCollection(userId);
}

/** Confirms the referenced item actually exists before letting it be saved
 * — same check the old SearchResult-only version did, just dispatched by
 * itemType now. */
async function itemExists(itemType: ItemType, itemId: string): Promise<boolean> {
  if (itemType === 'SearchResult') {
    return (await SearchResult.exists({ _id: itemId })) !== null;
  }
  return (await DiscoveryItem.exists({ _id: itemId })) !== null;
}

/** Which of the signed-in user's collections currently contain this item. */
export async function GET(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to view saved finds.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const itemType = parseItemType(searchParams.get('itemType'));

  if (!itemId || !Types.ObjectId.isValid(itemId) || !itemType) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid itemId/itemType.' }, { status: 400 });
  }

  const userCollectionIds = (await Collection.find({ userId: user._id }).select('_id')).map(
    (c) => c._id
  );
  const items = await CollectionItem.find({
    collectionId: { $in: userCollectionIds },
    itemType,
    itemId,
  }).select('collectionId');

  return NextResponse.json({
    ok: true,
    collectionIds: items.map((i) => String(i.collectionId)),
  });
}

/** Save a result. Idempotent — saving something already saved is a no-op success. */
export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to save finds.' }, { status: 401 });
  }

  let body: { itemId?: unknown; itemType?: unknown; collectionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const itemId = typeof body.itemId === 'string' ? body.itemId : null;
  const itemType = parseItemType(body.itemType);
  if (!itemId || !Types.ObjectId.isValid(itemId) || !itemType) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid itemId/itemType.' }, { status: 400 });
  }

  if (!(await itemExists(itemType, itemId))) {
    return NextResponse.json({ ok: false, message: 'That item no longer exists.' }, { status: 404 });
  }

  const collection = await resolveTargetCollection(user._id, body.collectionId);
  if (!collection) {
    return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
  }

  let created = false;
  try {
    await CollectionItem.create({ collectionId: collection._id, itemType, itemId });
    created = true;
  } catch (err) {
    // Duplicate key = already saved to this collection — not an error from
    // the caller's perspective, the end state is exactly what they wanted.
    if (!(err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000)) {
      throw err;
    }
  }

  // Popularity signal for getCuratedResults' ranking — only meaningful for
  // DiscoveryItem, and only on an actual new save (not the idempotent
  // duplicate-key no-op above, which shouldn't double-count).
  if (created && itemType === 'DiscoveryItem') {
    await DiscoveryItem.updateOne({ _id: itemId }, { $inc: { saveCount: 1 } });
  }

  return NextResponse.json({ ok: true, collectionId: String(collection._id) });
}

/** Remove a saved result from a collection (un-heart). */
export async function DELETE(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to manage saved finds.' }, { status: 401 });
  }

  let body: { itemId?: unknown; itemType?: unknown; collectionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const itemId = typeof body.itemId === 'string' ? body.itemId : null;
  const itemType = parseItemType(body.itemType);
  if (!itemId || !Types.ObjectId.isValid(itemId) || !itemType) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid itemId/itemType.' }, { status: 400 });
  }

  let removedCount = 0;

  if (typeof body.collectionId === 'string' && Types.ObjectId.isValid(body.collectionId)) {
    // Remove from one specific collection.
    const collection = await Collection.findOne({ _id: body.collectionId, userId: user._id });
    if (!collection) {
      return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
    }
    const result = await CollectionItem.deleteOne({ collectionId: collection._id, itemType, itemId });
    removedCount = result.deletedCount ?? 0;
  } else {
    // No specific collection given (the common case — the heart icon
    // doesn't know which collection(s) hold this item): remove it from
    // every one of this user's collections.
    const userCollectionIds = (await Collection.find({ userId: user._id }).select('_id')).map(
      (c) => c._id
    );
    const result = await CollectionItem.deleteMany({
      collectionId: { $in: userCollectionIds },
      itemType,
      itemId,
    });
    removedCount = result.deletedCount ?? 0;
  }

  // Mirror the POST increment — only decrement for saves that actually
  // existed, and never below zero (defensive floor in case of any drift).
  if (removedCount > 0 && itemType === 'DiscoveryItem') {
    await DiscoveryItem.updateOne(
      { _id: itemId, saveCount: { $gt: 0 } },
      { $inc: { saveCount: -1 } }
    );
  }

  return NextResponse.json({ ok: true });
}