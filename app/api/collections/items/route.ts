import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { getOrCreateDefaultCollection } from '@/lib/getOrCreateDefaultCollection';
import { Collection, CollectionItem, SearchResult } from '@/lib/models';

export const dynamic = 'force-dynamic';

async function resolveTargetCollection(userId: Types.ObjectId, collectionId: unknown) {
  if (typeof collectionId === 'string' && collectionId.length > 0) {
    if (!Types.ObjectId.isValid(collectionId)) return null;
    return Collection.findOne({ _id: collectionId, userId });
  }
  return getOrCreateDefaultCollection(userId);
}

/** Which of the signed-in user's collections currently contain this item. */
export async function GET(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to view saved finds.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchResultId = searchParams.get('searchResultId');
  if (!searchResultId || !Types.ObjectId.isValid(searchResultId)) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid searchResultId.' }, { status: 400 });
  }

  const userCollectionIds = (await Collection.find({ userId: user._id }).select('_id')).map(
    (c) => c._id
  );
  const items = await CollectionItem.find({
    collectionId: { $in: userCollectionIds },
    searchResultId,
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

  let body: { searchResultId?: unknown; collectionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const searchResultId = typeof body.searchResultId === 'string' ? body.searchResultId : null;
  if (!searchResultId || !Types.ObjectId.isValid(searchResultId)) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid searchResultId.' }, { status: 400 });
  }

  const result = await SearchResult.findById(searchResultId);
  if (!result) {
    return NextResponse.json({ ok: false, message: 'That item no longer exists.' }, { status: 404 });
  }

  const collection = await resolveTargetCollection(user._id, body.collectionId);
  if (!collection) {
    return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
  }

  try {
    await CollectionItem.create({ collectionId: collection._id, searchResultId });
  } catch (err) {
    // Duplicate key = already saved to this collection — not an error from
    // the caller's perspective, the end state is exactly what they wanted.
    if (!(err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000)) {
      throw err;
    }
  }

  return NextResponse.json({ ok: true, collectionId: String(collection._id) });
}

/** Remove a saved result from a collection (un-heart). */
export async function DELETE(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to manage saved finds.' }, { status: 401 });
  }

  let body: { searchResultId?: unknown; collectionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const searchResultId = typeof body.searchResultId === 'string' ? body.searchResultId : null;
  if (!searchResultId || !Types.ObjectId.isValid(searchResultId)) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid searchResultId.' }, { status: 400 });
  }

  if (typeof body.collectionId === 'string' && Types.ObjectId.isValid(body.collectionId)) {
    // Remove from one specific collection.
    const collection = await Collection.findOne({ _id: body.collectionId, userId: user._id });
    if (!collection) {
      return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
    }
    await CollectionItem.deleteOne({ collectionId: collection._id, searchResultId });
  } else {
    // No specific collection given (the common case — the heart icon
    // doesn't know which collection(s) hold this item): remove it from
    // every one of this user's collections.
    const userCollectionIds = (await Collection.find({ userId: user._id }).select('_id')).map(
      (c) => c._id
    );
    await CollectionItem.deleteMany({
      collectionId: { $in: userCollectionIds },
      searchResultId,
    });
  }

  return NextResponse.json({ ok: true });
}