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
    <div className="min-h-screen bg-paper paper-texture flex flex-col">
      <Navbar />

      {/* Account Header */}
      <section className="w-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:py-12">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brick sm:text-[0.68rem]">
            Account
          </p>

          <h1 className="mt-2 break-words font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl md:text-4xl lg:text-[2.6rem]">
            {user.email}
          </h1>
        </div>
      </section>

      {/* Account Plan */}
      <main className="w-full flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6 sm:pb-12 md:px-8 md:pb-16">
          <div className="w-full rounded-md border border-line bg-card p-4 shadow-card sm:p-6 md:p-7 lg:p-8">

            {/* Plan Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-inkSoft sm:text-[0.65rem]">
                  Current plan
                </p>

                <p className="mt-1 break-words font-display text-lg font-semibold text-ink sm:text-xl md:text-2xl">
                  {isPlus ? 'Tholafind Plus' : 'Free'}
                </p>
              </div>

              {isPlus && (
                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-brass sm:text-[0.62rem]">
                  <CheckCircle2
                    size={13}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  Active
                </span>
              )}
            </div>

            {/* Plus Plan */}
            {isPlus ? (
              <div className="mt-5">
                <p className="max-w-2xl text-sm leading-6 text-inkSoft sm:text-[0.88rem]">
                  Unlimited collections, unlimited community requests,
                  unlimited watched hunts. Manage or cancel your subscription
                  anytime &mdash; no phone call, no retention maze.
                </p>

                <div className="mt-5 w-full sm:w-auto">
                  <ManageBillingButton />
                </div>
              </div>
            ) : (
              /* Free Plan */
              <div className="mt-5">
                <ul className="space-y-2 text-sm leading-6 text-inkSoft sm:text-[0.85rem]">
                  <li className="flex items-start gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-inkSoft"
                      aria-hidden="true"
                    />
                    <span>
                      3 collections, 2 community requests a month, 1 watched
                      hunt on Free
                    </span>
                  </li>

                  <li className="flex items-start gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-inkSoft"
                      aria-hidden="true"
                    />
                    <span>
                      Search itself is always unlimited, on every plan
                    </span>
                  </li>
                </ul>

                <div className="mt-5 w-full sm:w-auto">
                  <UpgradeButton />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}