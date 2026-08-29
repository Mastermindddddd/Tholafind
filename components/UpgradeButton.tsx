'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { ArrowUpRight, Loader2 } from 'lucide-react';

type Phase = 'loading-paddle' | 'ready' | 'checkout-open' | 'confirming' | 'error';

/**
 * Unlike Stripe's redirect-based checkout, Paddle Checkout is a client-side
 * overlay: this component loads Paddle.js directly and opens it in place,
 * rather than a server route returning a URL to navigate to. See README
 * (Phase 8) for why — the short version is Paddle's checkout can create
 * the customer implicitly from just an email, so there's no server
 * round-trip needed before opening it.
 */
export default function UpgradeButton({ label = 'Upgrade to Plus' }: { label?: string }) {
  const [phase, setPhase] = useState<Phase>('loading-paddle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | undefined>(undefined);
  // Overlay checkouts don't redirect anywhere on success — this tracks
  // whether the person actually completed payment before the overlay
  // closed, so closing it early (e.g. clicking away) isn't mistaken for
  // a successful upgrade.
  const completedRef = useRef(false);
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

    if (!clientToken) {
      setErrorMessage('Billing isn\u2019t configured yet.');
      setPhase('error');
      return;
    }

    initializePaddle({
      environment,
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          completedRef.current = true;
        }
        if (event.name === 'checkout.closed') {
          if (completedRef.current) {
            setPhase('confirming');
            // The webhook (app/api/webhooks/paddle/route.ts) is what
            // actually grants Plus access — this is just giving it a
            // moment to arrive before refreshing the page to reflect it.
            // Not a guarantee; if it's still not synced after this,
            // reloading /account a few seconds later will show it.
            setTimeout(() => {
              router.refresh();
              setPhase('ready');
              completedRef.current = false;
            }, 3000);
          } else {
            setPhase('ready');
          }
        }
      },
    }).then((paddleInstance) => {
      paddleRef.current = paddleInstance;
      setPhase((p) => (p === 'loading-paddle' ? 'ready' : p));
    });
  }, [router]);

  const upgrade = () => {
    if (!isSignedIn || !user) {
      router.push('/sign-in');
      return;
    }

    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
    if (!priceId || !paddleRef.current) {
      setErrorMessage('Billing isn\u2019t configured yet.');
      setPhase('error');
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;

    setPhase('checkout-open');
    paddleRef.current.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      // The only identity Paddle echoes back on every subsequent webhook —
      // see lib/syncSubscriptionStatus.ts for how this resolves back to a
      // User document.
      customData: { authId: user.id },
    });
  };

  const busy = phase === 'loading-paddle' || phase === 'checkout-open' || phase === 'confirming';

  return (
    <div>
      <button
        onClick={upgrade}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full bg-brass px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-brassLight disabled:opacity-60"
      >
        {phase === 'confirming' ? (
          <>
            <Loader2 size={13} className="animate-spin" /> Confirming&hellip;
          </>
        ) : phase === 'checkout-open' ? (
          'Opening checkout\u2026'
        ) : (
          <>
            {label} <ArrowUpRight size={13} />
          </>
        )}
      </button>
      {phase === 'error' && errorMessage && <p className="mt-1.5 text-[0.78rem] text-brick">{errorMessage}</p>}
    </div>
  );
}