import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { Collection, CollectionItem } from '@/lib/models';

export const dynamic = 'force-dynamic';

async function loadOwnedCollection(id: string, userId: Types.ObjectId) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Collection.findOne({ _id: id, userId });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Not signed in.' }, { status: 401 });
  }

  const collection = await loadOwnedCollection(params.id, user._id);
  if (!collection) {
    return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
  }

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name) {
    return NextResponse.json({ ok: false, message: 'Give the collection a name.' }, { status: 400 });
  }

  collection.name = name;
  try {
    await collection.save();
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { ok: false, message: 'You already have a collection with that name.' },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true, id: String(collection._id), name: collection.name });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Not signed in.' }, { status: 401 });
  }

  const collection = await loadOwnedCollection(params.id, user._id);
  if (!collection) {
    return NextResponse.json({ ok: false, message: 'Collection not found.' }, { status: 404 });
  }

  if (collection.isDefault) {
    return NextResponse.json(
      { ok: false, message: 'Your default collection can\u2019t be deleted.' },
      { status: 400 }
    );
  }

  // Cascade: a collection's saved items have no meaning without it.
  await CollectionItem.deleteMany({ collectionId: collection._id });
  await collection.deleteOne();

  return NextResponse.json({ ok: true });
}