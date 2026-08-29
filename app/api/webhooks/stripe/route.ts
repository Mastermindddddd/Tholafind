import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { syncSubscriptionStatus } from '@/lib/syncSubscriptionStatus';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * As of the API version pinned in lib/stripe.ts, `current_period_end` lives
 * on each subscription item, not the top-level Subscription object (a
 * subscription can have multiple items with different billing periods).
 * Every subscription this app creates has exactly one item (one Price,
 * quantity 1), so reading the first item's period end is correct here —
 * this would need revisiting if Tholafind ever sells multi-item plans.
 */
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | undefined {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : undefined;
}

/**
 * The single source of truth for who actually has Plus access. The
 * checkout route creates a Subscription row eagerly (status: 'incomplete')
 * so there's somewhere to reuse a Stripe customer across attempts, but
 * `User.tier` is only ever flipped to 'plus' here, from a verified Stripe
 * event — never optimistically in the checkout route itself. A person
 * could close the tab right after paying and this webhook is still what
 * grants access, not the redirect back to /account.
 */
export async function POST(request: Request) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ ok: false, message: 'STRIPE_WEBHOOK_SECRET not set.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ ok: false, message: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err);
    return NextResponse.json({ ok: false, message: 'Invalid signature.' }, { status: 400 });
  }

  await connectToDatabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (customerId && subscriptionId) {
          // The session itself doesn't carry the subscription's actual
          // status/period end — fetch the real object rather than assume
          // "completed checkout" always means "active" (edge cases like
          // requiring 3D Secure confirmation can leave it briefly
          // incomplete even after the redirect).
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionStatus(customerId, {
            stripeSubscriptionId: subscriptionId,
            status: stripeSubscription.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
            currentPeriodEnd: getCurrentPeriodEnd(stripeSubscription),
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof stripeSubscription.customer === 'string'
            ? stripeSubscription.customer
            : stripeSubscription.customer.id;

        await syncSubscriptionStatus(customerId, {
          stripeSubscriptionId: stripeSubscription.id,
          status:
            event.type === 'customer.subscription.deleted'
              ? 'canceled'
              : (stripeSubscription.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'),
          currentPeriodEnd: getCurrentPeriodEnd(stripeSubscription),
        });
        break;
      }

      default:
        // Other event types aren't relevant to tier syncing — ignored, not an error.
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] failed processing ${event.type}:`, err);
    // Still 200 — a processing error on our end shouldn't make Stripe
    // retry indefinitely for an event we may already have partially
    // applied. Logged for manual follow-up instead.
  }

  return NextResponse.json({ ok: true });
}