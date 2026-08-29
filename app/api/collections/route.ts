import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { Collection, CollectionItem, SearchResult } from '@/lib/models';

export const dynamic = 'force-dynamic';

const FREE_TIER_COLLECTION_LIMIT = 3;

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Not signed in.' }, { status: 401 });
  }

  const collections = await Collection.find({ userId: user._id }).sort({ isDefault: -1, createdAt: 1 }).lean();

  // Item count + a representative cover image per collection. Small N of
  // collections per user expected at MVP scale, so a query per collection
  // (rather than an aggregation pipeline) keeps this simple and readable.
  const withDetails = await Promise.all(
    collections.map(async (c) => {
      const itemCount = await CollectionItem.countDocuments({ collectionId: c._id });
      const firstItem = await CollectionItem.findOne({ collectionId: c._id }).sort({ createdAt: -1 });
      const cover = firstItem
        ? (await SearchResult.findById(firstItem.searchResultId).select('image').lean())?.image
        : null;

      return {
        id: String(c._id),
        name: c.name,
        isDefault: c.isDefault,
        itemCount,
        cover,
        updatedAt: c.updatedAt,
      };
    })
  );

  return NextResponse.json({ ok: true, collections: withDetails });
}

export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Not signed in.' }, { status: 401 });
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

  // Reads User.tier directly rather than a live Stripe check — there's no
  // billing system as of earlier phases, but Phase 8 wires it up, and the
  // field already defaults every account to 'free', so this is a real
  // enforcement of the limit already promised on the landing page.
  if (user.tier === 'free') {
    const existingCount = await Collection.countDocuments({ userId: user._id });
    if (existingCount >= FREE_TIER_COLLECTION_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          message: `Free accounts get ${FREE_TIER_COLLECTION_LIMIT} collections \u2014 upgrade to Plus for unlimited.`,
          limitReached: true,
        },
        { status: 403 }
      );
    }
  }

  try {
    const collection = await Collection.create({ userId: user._id, name, isDefault: false });
    return NextResponse.json({ ok: true, id: String(collection._id), name: collection.name });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { ok: false, message: 'You already have a collection with that name.' },
        { status: 409 }
      );
    }
    throw err;
  }
}