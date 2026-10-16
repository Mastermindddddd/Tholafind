import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConnectExtensionButton from '@/components/ConnectExtensionButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Connect the Tholafind extension',
  robots: { index: false },
};

export default async function ConnectExtensionPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent('/extension/connect')}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper paper-texture">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
          Browser extension
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Connect your account
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.9rem] text-inkSoft">
          This lets the Tholafind extension start hunts for you. It can only start hunts and
          see their results &mdash; it can&rsquo;t read anything else in your account. You can
          disconnect any time from the extension.
        </p>
        <div className="mt-8">
          <ConnectExtensionButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}