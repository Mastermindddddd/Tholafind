import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { Alert, Search, SearchResult } from '@/lib/models';

export const dynamic = 'force-dynamic';

// Alerts were originally free for everyone (Phase 7). Revisited after
// launch: search staying unlimited is the product's core differentiation,
// and collections/community-requests alone turned out to be a weak reason
// to upgrade — alert-watching is the sharper lever, since it's tied to
// ongoing re-engagement rather than a one-time action. See README.
const FREE_TIER_WATCH_LIMIT = 1;

/** Returns a 403 response if this would push the user over their watch
 * limit, or null if they're clear to proceed. Shared between the
 * reactivate-an-existing-alert and create-a-new-alert paths below, since
 * both result in a new active watch and both need the same check. */
async function watchLimitResponse(
  userId: Types.ObjectId,
  tier: 'free' | 'plus'
): Promise<ReturnType<typeof NextResponse.json> | null> {
  if (tier !== 'free') return null;

  const activeCount = await Alert.countDocuments({ userId, active: true });
  if (activeCount < FREE_TIER_WATCH_LIMIT) return null;

  return NextResponse.json(
    {
      ok: false,
      message: `Free accounts can watch ${FREE_TIER_WATCH_LIMIT} hunt at a time \u2014 upgrade to Plus for unlimited.`,
      limitReached: true,
    },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to turn on alerts.' }, { status: 401 });
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

  const search = await Search.findOne({ _id: searchId, userId: user._id });
  if (!search) {
    return NextResponse.json({ ok: false, message: 'Search not found.' }, { status: 404 });
  }

  const existing = await Alert.findOne({ userId: user._id, searchId });
  if (existing) {
    if (existing.active) {
      // Already watching — idempotent no-op, doesn't touch the limit.
      return NextResponse.json({ ok: true, id: String(existing._id) });
    }

    // Reactivating a previously-turned-off watch counts as creating a new
    // active one for limit purposes.
    const limitResponse = await watchLimitResponse(user._id, user.tier);
    if (limitResponse) return limitResponse;

    existing.active = true;
    await existing.save();
    return NextResponse.json({ ok: true, id: String(existing._id) });
  }

  const limitResponse = await watchLimitResponse(user._id, user.tier);
  if (limitResponse) return limitResponse;

  // Seed the baseline from what's already there right now — otherwise the
  // first cron check would treat every existing result as newly found,
  // which is misleading (the person already saw these on the results page).
  const currentResults = await SearchResult.find({ searchId }).select('_id').lean();

  const alert = await Alert.create({
    userId: user._id,
    searchId,
    kind: 'watch',
    active: true,
    lastSeenResultIds: currentResults.map((r) => r._id),
    lastCheckedAt: new Date(),
  });

  return NextResponse.json({ ok: true, id: String(alert._id) });
}

export async function DELETE(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
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

  // Deactivate rather than delete — keeps notification history intact in
  // case the person turns it back on later.
  await Alert.updateOne({ userId: user._id, searchId }, { $set: { active: false } });

  return NextResponse.json({ ok: true });
}