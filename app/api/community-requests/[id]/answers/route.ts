import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { CommunityRequest } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in to answer.' }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ ok: false, message: 'Invalid request ID.' }, { status: 400 });
  }

  let body: { url?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { ok: false, message: 'Add a link to what you found (starting with http:// or https://).' },
      { status: 400 }
    );
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : undefined;

  await connectToDatabase();

  const communityRequest = await CommunityRequest.findById(params.id);
  if (!communityRequest) {
    return NextResponse.json({ ok: false, message: 'Request not found.' }, { status: 404 });
  }

  if (String(communityRequest.requestedBy) === String(user._id)) {
    return NextResponse.json(
      { ok: false, message: 'You can\u2019t answer your own request.' },
      { status: 400 }
    );
  }

  communityRequest.answers.push({ userId: user._id, url, note });
  await communityRequest.save();

  return NextResponse.json({ ok: true });
}