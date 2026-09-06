import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Refund Policy — Tholafind',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Legal</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Refund Policy
        </h1>
        <p className="mt-2 text-[0.82rem] text-inkSoft">Last updated: 2026-09-06</p>

        <div className="mt-8 space-y-8 text-[0.92rem] leading-relaxed text-ink">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">1. Who handles billing</h2>
            <p className="mt-2">
              All payments for Tholafind Plus are processed by Paddle.com Market Limited, who acts
              as the Merchant of Record for every transaction. This means Paddle, not Tholafind,
              handles the actual charge to your card and the mechanics of issuing any refund.
              Refunds are still requested through us or through Paddle&rsquo;s own customer portal
              &mdash; either way, this policy explains what to expect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">2. Free plan</h2>
            <p className="mt-2">
              Tholafind&rsquo;s Free plan never charges you anything, so nothing in this policy
              applies until you choose to upgrade to Plus.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">3. Cancelling Plus</h2>
            <p className="mt-2">
              You can cancel your Plus subscription anytime from your account page or through
              Paddle&rsquo;s billing portal. Cancelling stops future billing, but doesn&rsquo;t
              refund the current billing period &mdash; your Plus access continues until the end of
              the period you&rsquo;ve already paid for, and your account then reverts to Free.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">4. Refund eligibility</h2>
            <p className="mt-2">
              If you&rsquo;re unhappy with Plus, contact us within 14 days of being charged and
              we&rsquo;ll review your request. We consider things like whether you&rsquo;ve had
              genuine use of the plan and the reason for the request, and we aim to be reasonable
              rather than rigid about it.
            </p>
            <p className="mt-2">
              Beyond that 14-day window, charges are generally non-refundable, except where required
              by the law of your country of residence &mdash; some jurisdictions guarantee refund
              rights that this policy doesn&rsquo;t override.
            </p>
            <p className="mt-2">
              Repeated refund requests on the same account, or requests that appear to be
              abusing this policy (for example, using Plus fully for a period and then requesting a
              refund every cycle), may be declined.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">5. How to request a refund</h2>
            <p className="mt-2">
              Email us at{' '}
              <a href="mailto:[SUPPORT EMAIL]" className="text-brick underline">
                [SUPPORT EMAIL]
              </a>{' '}
              with the email address on your account and the reason for your request, or use the
              link in your Paddle receipt email to go directly to Paddle&rsquo;s support. We
              typically respond within a few business days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">6. Purchases made on third-party sites</h2>
            <p className="mt-2">
              Tholafind helps you find items on other marketplaces and retailers &mdash; it
              doesn&rsquo;t sell those items itself. If you buy something from a listing you found
              through Tholafind, that purchase is between you and the seller on that site, and their
              own refund and return policy applies, not this one.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">7. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be posted here with
              an updated &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">8. Contact</h2>
            <p className="mt-2">
              Questions about billing or refunds? Reach us at{' '}
              <a href="mailto:[SUPPORT EMAIL]" className="text-brick underline">
                [SUPPORT EMAIL]
              </a>
              .
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
}