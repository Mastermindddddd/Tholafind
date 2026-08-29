import 'server-only';
import { Subscription, User } from '@/lib/models';

/** Paddle's exact status values (confirmed against the SDK's
 * SubscriptionStatus type). 'paused' grants no access — pausing billing
 * is a deliberate "stop charging me for now" action, not a payment hiccup,
 * so it should behave like free rather than get a grace period. 'past_due'
 * does get a grace period, same reasoning as the original Stripe version
 * of this logic: give Paddle's retry a chance before revoking access. */
const PLUS_GRANTING_STATUSES = ['active', 'trialing', 'past_due'];

interface SyncParams {
  /** Clerk's user ID, from the customData attached at Checkout.open() time
   * — the only identity Paddle echoes back on every subscription event,
   * since there's no pre-created Subscription row to look up by Paddle
   * customer ID the way the Stripe version of this worked. */
  authId: string;
  paddleCustomerId: string;
  paddleSubscriptionId: string;
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled';
  currentPeriodEnd?: Date;
}

export async function syncSubscriptionFromPaddle(params: SyncParams): Promise<void> {
  const user = await User.findOne({ authId: params.authId });
  if (!user) {
    console.error(`[paddle] No User found for authId ${params.authId} \u2014 cannot sync subscription.`);
    return;
  }

  await Subscription.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        paddleCustomerId: params.paddleCustomerId,
        paddleSubscriptionId: params.paddleSubscriptionId,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
    },
    { upsert: true }
  );

  const tier = PLUS_GRANTING_STATUSES.includes(params.status) ? 'plus' : 'free';
  await User.updateOne({ _id: user._id }, { $set: { tier } });
}