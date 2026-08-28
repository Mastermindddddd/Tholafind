import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { Alert, Search, SearchResult } from '@/lib/models';

export const dynamic = 'force-dynamic';

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
    if (!existing.active) {
      existing.active = true;
      await existing.save();
    }
    return NextResponse.json({ ok: true, id: String(existing._id) });
  }

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