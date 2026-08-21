import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

const VALID_INTERESTS = ['fashion', 'furniture', 'vintage', 'homeware', 'other'];

export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Not signed in.' }, { status: 401 });
  }

  let body: { interests?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const interests = Array.isArray(body.interests) ? body.interests : [];
  const valid = interests.filter(
    (i): i is string => typeof i === 'string' && VALID_INTERESTS.includes(i)
  );

  if (valid.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Pick at least one interest.' },
      { status: 400 }
    );
  }

  await User.updateOne({ _id: user._id }, { $set: { interests: valid } });

  return NextResponse.json({ ok: true, interests: valid });
}
