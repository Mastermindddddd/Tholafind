import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { CommunityRequest, Search } from '@/lib/models';

export const dynamic = 'force-dynamic';

const FREE_TIER_MONTHLY_LIMIT = 2;

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Creates a community request for a search. Idempotent in the sense that
 * matters to the caller: if one already exists for this searchId (the
 * schema enforces at most one via a unique index), this returns the
 * existing request rather than erroring — "ask the finders" is a button
 * someone might click more than once, not a strict create-only action.
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to ask the community.' }, { status: 401 });
  }

  let body: { searchId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const searchId = typeof body.searchId === 'string' ? body.searchId : null;
  if (!searchId || !Types.ObjectId.isValid(searchId)) {
    return NextResponse.json({ ok: false, message: 'Missing or invalid searchId.' }, { status: 400 });
  }

  await connectToDatabase();

  const search = await Search.findById(searchId);
  if (!search) {
    return NextResponse.json({ ok: false, message: 'Search not found.' }, { status: 404 });
  }

  const existing = await CommunityRequest.findOne({ searchId });
  if (existing) {
    return NextResponse.json({ ok: true, id: String(existing._id), alreadyExisted: true });
  }

  // Tier enforcement reads User.tier directly rather than a Subscription
  // document — there's no billing system yet (that's Phase 8), but the
  // field already defaults every account to 'free', so this is an honest
  // enforcement of the limit already promised on the pricing page, not a
  // placeholder. Phase 8 wires this up via Paddle; upgrading a user's tier
  // is the only change this check needs.
  if (user.tier === 'free') {
    const countThisMonth = await CommunityRequest.countDocuments({
      requestedBy: user._id,
      createdAt: { $gte: startOfCurrentMonth() },
    });
    if (countThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          message: `Free accounts get ${FREE_TIER_MONTHLY_LIMIT} community requests a month \u2014 upgrade to Plus for unlimited.`,
          limitReached: true,
        },
        { status: 403 }
      );
    }
  }

  const created = await CommunityRequest.create({
    searchId,
    requestedBy: user._id,
    status: 'open',
  });

  return NextResponse.json({ ok: true, id: String(created._id), alreadyExisted: false });
}

/** The community feed — open requests for anyone to browse and help with. */
export async function GET(request: Request) {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  const openRequests = await CommunityRequest.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const searches = await Search.find({
    _id: { $in: openRequests.map((r) => r.searchId) },
  })
    .select('reference images hint')
    .lean();
  const searchById = new Map(searches.map((s) => [String(s._id), s]));

  const feed = openRequests
    .map((r) => {
      const search = searchById.get(String(r.searchId));
      if (!search) return null;
      return {
        id: String(r._id),
        reference: search.reference,
        photo: search.images[0],
        hint: search.hint ?? null,
        answerCount: r.answers.length,
        createdAt: r.createdAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return NextResponse.json({ ok: true, requests: feed });
}