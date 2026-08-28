import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { Alert } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
  }

  await connectToDatabase();
  await Alert.updateMany({ userId: user._id }, { $set: { seenAt: new Date() } });

  return NextResponse.json({ ok: true });
}