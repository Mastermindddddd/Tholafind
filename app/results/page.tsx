import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Compass } from 'lucide-react';

export default function ResultsIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper paper-texture">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine text-brassLight">
          <Compass size={20} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">No hunt selected yet</h1>
        <p className="mx-auto mt-2 max-w-sm text-[0.9rem] text-inkSoft">
          Every hunt has its own page once you start it. Drop a photo on the home page to begin one.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-pine px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep"
        >
          Start a hunt
        </Link>
      </div>
      <Footer />
    </div>
  );
}