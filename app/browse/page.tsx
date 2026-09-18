import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import { connectToDatabase } from '@/lib/db';
import { getCuratedResults } from '@/lib/browse/getCuratedResults';
import { toFindResultFromDiscoveryItem } from '@/lib/browse/toFindResult';
import { getSavedResultIds } from '@/lib/getSavedResultIds';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { Compass } from 'lucide-react';

// Content only changes once a day via the discovery cron, which calls
// revalidatePath('/browse') itself right after ingesting — so this is a
// safety-net revalidation window, not the only thing keeping it fresh.
export const revalidate = 86400;

export const metadata = {
  title: 'Browse real finds - Tholafind',
  description:
    'Browse real items from across the web - retail, resale, and vintage finds, refreshed daily and sorted by how confidently they were matched.',
};

const categories = [
  { href: '/browse', label: 'Everything' },
  { href: '/browse/retail', label: 'Retail' },
  { href: '/browse/resale', label: 'Resale' },
  { href: '/browse/vintage', label: 'Vintage' },
];

export default async function BrowsePage() {
  await connectToDatabase();

  const results = await getCuratedResults({ limit: 60 });

  const user = await getOrCreateUser();
  const savedResultIds = await getSavedResultIds(
    user?._id,
    results.map((r) => r._id),
    'DiscoveryItem'
  );

  const findResults = results.map((r) => toFindResultFromDiscoveryItem(r, savedResultIds));

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
          The specimen log
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Real things, actually found.
        </h1>
        <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
          A fresh pull from across the web every day - not a demo, not a mockup. Tap the heart
          on anything to save it to your own collection.
        </p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-colors ${
                c.href === '/browse'
                  ? 'border-pine bg-pine text-paper'
                  : 'border-line bg-card text-inkSoft hover:border-inkSoft'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {findResults.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine text-brassLight">
              <Compass size={20} />
            </span>
            <p className="text-[0.9rem] text-inkSoft">
              Nothing to show yet - check back once today's finds are in.
            </p>
          </div>
        ) : (
          <div className="masonry">
            {findResults.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}