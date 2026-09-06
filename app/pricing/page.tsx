import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UpgradeButton from '@/components/UpgradeButton';
import { ShieldCheck, Check } from 'lucide-react';

export const metadata = {
  title: 'Pricing — Tholafind',
  description:
    'Tholafind is free to search, always. Plus removes the limits on collections, community requests, and watched hunts for $5/month.',
};

const freeFeatures = [
  'Unlimited photo searches',
  'Retail, resale & vintage results',
  '3 collections',
  '2 community requests / month',
  'Watch 1 hunt for updates',
];

const plusFeatures = [
  'Everything in Free',
  'Unlimited collections',
  'Unlimited community requests',
  'Watch unlimited hunts for updates',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-4xl px-5 pt-14 text-center sm:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-paperDim px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-inkSoft">
          <ShieldCheck size={13} /> No surprise paywalls
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          You see a real result before we ever ask for a card.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-inkSoft">
          Every hunt starts free, and free means a real search across retail, resale, and vintage
          &mdash; not a locked screen after your first upload. Search itself is unlimited on every
          plan. Plus removes the limits that exist on Free: how many collections you can keep, how
          many times a month you can ask the community for help, and how many hunts you can watch
          for updates at once.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-card p-7 shadow-card">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-inkSoft">Free</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              $0<span className="text-base font-normal text-inkSoft">/mo</span>
            </p>
            <p className="mt-2 text-[0.85rem] text-inkSoft">
              Everything you need to search, save, and track down what you&rsquo;re looking for.
            </p>
            <ul className="mt-6 space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[0.88rem] text-ink">
                  <Check size={16} className="mt-0.5 shrink-0 text-inkSoft" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-brass bg-card p-7 shadow-cardHover">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-brick">Plus</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              $5<span className="text-base font-normal text-inkSoft">/mo</span>
            </p>
            <p className="mt-2 text-[0.85rem] text-inkSoft">
              For hunts that go long &mdash; more folders, more help, more things watched at once.
            </p>
            <ul className="mt-6 space-y-3">
              {plusFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[0.88rem] text-ink">
                  <Check size={16} className="mt-0.5 shrink-0 text-brass" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <UpgradeButton label="Get Plus" />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[0.82rem] text-inkSoft">
          Cancel anytime from your{' '}
          <a href="/account" className="text-brick underline">
            account page
          </a>
          . Billing is handled by Paddle.com, our payment provider &mdash; see our{' '}
          <a href="/refund-policy" className="text-brick underline">
            Refund Policy
          </a>{' '}
          for details.
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-20 sm:px-8">
        <h2 className="text-center font-display text-xl font-semibold text-ink">
          A couple of things worth knowing
        </h2>
        <div className="mt-6 space-y-5 text-[0.88rem] leading-relaxed text-inkSoft">
          <div>
            <p className="font-display text-[1rem] font-semibold text-ink">
              Is search really unlimited on Free?
            </p>
            <p className="mt-1">
              Yes. We apply a generous daily fair-use limit purely to prevent automated abuse
              &mdash; it&rsquo;s not tied to your plan, and it&rsquo;s high enough that no real
              person searching normally will ever notice it.
            </p>
          </div>
          <div>
            <p className="font-display text-[1rem] font-semibold text-ink">
              What happens to my collections if I downgrade?
            </p>
            <p className="mt-1">
              Nothing gets deleted. If you have more than 3 collections when you cancel Plus,
              they&rsquo;re all still there &mdash; you just won&rsquo;t be able to create a new
              one until you&rsquo;re back under the limit.
            </p>
          </div>
          <div>
            <p className="font-display text-[1rem] font-semibold text-ink">
              Who processes my payment?
            </p>
            <p className="mt-1">
              Paddle.com Market Limited handles all billing as our Merchant of Record &mdash; they
              process your card details directly, and Tholafind never sees or stores your full
              payment information.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}