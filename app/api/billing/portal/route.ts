import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/lib/models';
import { getPaddle } from '@/lib/paddle';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
  }

  await connectToDatabase();
  const subscription = await Subscription.findOne({ userId: user._id });
  if (!subscription?.paddleCustomerId || !subscription.paddleSubscriptionId) {
    return NextResponse.json(
      { ok: false, message: 'No billing account yet \u2014 upgrade to Plus first.' },
      { status: 404 }
    );
  }

  const paddle = getPaddle();
  const session = await paddle.customerPortalSessions.create(subscription.paddleCustomerId, [
    subscription.paddleSubscriptionId,
  ]);

  return NextResponse.json({ ok: true, url: session.urls.general.overview });
}