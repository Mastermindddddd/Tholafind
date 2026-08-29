import { NextResponse } from 'next/server';
import { EventName } from '@paddle/paddle-node-sdk';
import { connectToDatabase } from '@/lib/db';
import { getPaddle } from '@/lib/paddle';
import { syncSubscriptionFromPaddle } from '@/lib/syncSubscriptionStatus';

export const dynamic = 'force-dynamic';

/**
 * The single source of truth for who actually has Plus access — User.tier
 * is only ever set to 'plus' here, from a verified Paddle event, never
 * optimistically on the client after Checkout.open() reports success.
 *
 * Unlike the Stripe version of this route, there's no pre-created
 * Subscription document to look up: Paddle's checkout is entirely
 * client-driven (see components/UpgradeButton.tsx), so this webhook is
 * genuinely the first time our backend learns the subscription exists at
 * all. User identity comes from `customData.authId`, attached when
 * Checkout.open() was called — see syncSubscriptionStatus.ts.
 */
export async function POST(request: Request) {
  const signingSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ ok: false, message: 'PADDLE_WEBHOOK_SECRET not set.' }, { status: 500 });
  }

  const signature = request.headers.get('paddle-signature');
  if (!signature) {
    return NextResponse.json({ ok: false, message: 'Missing paddle-signature header.' }, { status: 400 });
  }

  const rawBody = await request.text();
  const paddle = getPaddle();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, signingSecret, signature);
  } catch (err) {
    console.error('[paddle webhook] signature verification failed:', err);
    return NextResponse.json({ ok: false, message: 'Invalid signature.' }, { status: 400 });
  }

  await connectToDatabase();

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCanceled: {
        const subscription = event.data;
        const authId = subscription.customData?.authId;

        if (typeof authId !== 'string') {
          console.error(
            `[paddle webhook] subscription ${subscription.id} has no authId in customData \u2014 skipping.`
          );
          break;
        }

        await syncSubscriptionFromPaddle({
          authId,
          paddleCustomerId: subscription.customerId,
          paddleSubscriptionId: subscription.id,
          status:
            event.eventType === EventName.SubscriptionCanceled ? 'canceled' : subscription.status,
          currentPeriodEnd: subscription.nextBilledAt ? new Date(subscription.nextBilledAt) : undefined,
        });
        break;
      }

      default:
        // Other event types aren't relevant to tier syncing — ignored, not an error.
        break;
    }
  } catch (err) {
    console.error(`[paddle webhook] failed processing ${event.eventType}:`, err);
    // Still 200 — a processing error on our end shouldn't make Paddle
    // retry indefinitely for an event we may already have partially
    // applied. Logged for manual follow-up instead.
  }

  return NextResponse.json({ ok: true });
}