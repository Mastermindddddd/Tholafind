import { redirect } from 'next/navigation';
import { getOrCreateUser, needsOnboarding } from '@/lib/getOrCreateUser';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const user = await getOrCreateUser();

  // Middleware already requires sign-in for this route, but guard anyway —
  // and skip straight past onboarding if it's already done.
  if (!user) redirect('/sign-in');
  if (!needsOnboarding(user)) redirect('/collections');

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper paper-texture px-5 py-16">
      <div className="w-full max-w-lg rounded-md border border-line bg-card p-8 shadow-card">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-brick">
          One quick thing
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          What do you usually hunt for?
        </h1>
        <p className="mt-2 text-[0.9rem] text-inkSoft">
          Pick as many as fit — this just seeds better default filters on your results page.
          You can change it anytime.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
