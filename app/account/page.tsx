import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UpgradeButton from '@/components/UpgradeButton';
import ManageBillingButton from '@/components/ManageBillingButton';
import { getOrCreateUser, needsOnboarding } from '@/lib/getOrCreateUser';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getOrCreateUser();
  if (!user) redirect('/sign-in');
  if (needsOnboarding(user)) redirect('/onboarding');

  const isPlus = user.tier === 'plus';

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-2xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {user.email}
        </h1>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <div className="rounded-md border border-line bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-inkSoft">
                Current plan
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                {isPlus ? 'Tholafind Plus' : 'Free'}
              </p>
            </div>
            {isPlus && (
              <span className="flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-brass">
                <CheckCircle2 size={13} /> Active
              </span>
            )}
          </div>

          {isPlus ? (
            <>
              <p className="mt-4 text-[0.88rem] text-inkSoft">
                Unlimited collections, unlimited community requests, unlimited watched hunts. Manage
                or cancel your subscription anytime &mdash; no phone call, no retention maze.
              </p>
              <div className="mt-5">
                <ManageBillingButton />
              </div>
            </>
          ) : (
            <>
              <ul className="mt-4 space-y-1.5 text-[0.85rem] text-inkSoft">
                <li>3 collections, 2 community requests a month, 1 watched hunt on Free</li>
                <li>Search itself is always unlimited, on every plan</li>
              </ul>
              <div className="mt-5">
                <UpgradeButton />
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}