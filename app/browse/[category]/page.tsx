import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import { connectToDatabase } from '@/lib/db';
import { getCuratedResults } from '@/lib/browse/getCuratedResults';
import { toFindResultFromDiscoveryItem } from '@/lib/browse/toFindResult';
import { getSavedResultIds } from '@/lib/getSavedResultIds';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import type { SourceKind } from '@/lib/types';

// Content only changes once a day via the discovery cron, which calls
// revalidatePath on each category itself right after ingesting.
export const revalidate = 86400;

interface CategoryCopy {
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  description: string;
}

const categoryCopy: Record<SourceKind, CategoryCopy> = {
  retail: {
    label: 'Retail',
    eyebrow: 'New, on the shelf',
    title: 'Still in stock, somewhere.',
    body: 'Real items currently sold new, pulled fresh every day and sorted by how confidently each one was matched.',
    description:
      'Browse real retail finds on Tholafind \u2014 items currently sold new, refreshed daily.',
  },
  resale: {
    label: 'Resale',
    eyebrow: 'Someone else\u2019s, now yours',
    title: 'Secondhand, spotted.',
    body: 'Finds from eBay and other resale marketplaces \u2014 refreshed daily.',
    description:
      'Browse real resale finds on Tholafind \u2014 secondhand items from eBay and similar marketplaces, refreshed daily.',
  },
  vintage: {
    label: 'Vintage',
    eyebrow: 'Aged well',
    title: 'Old things, correctly identified.',
    body: 'Vintage and handmade finds from Etsy \u2014 refreshed daily.',
    description:
      'Browse real vintage finds on Tholafind \u2014 items from Etsy and similar vintage marketplaces, refreshed daily.',
  },
};

const categories = [
  { href: '/browse', label: 'Everything' },
  { href: '/browse/retail', label: 'Retail' },
  { href: '/browse/resale', label: 'Resale' },
  { href: '/browse/vintage', label: 'Vintage' },
];

function isValidCategory(value: string): value is SourceKind {
  return value === 'retail' || value === 'resale' || value === 'vintage';
}

interface PageProps {
  params: { category: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!isValidCategory(params.category)) return {};
  const copy = categoryCopy[params.category];
  return {
    title: `${copy.label} finds — Tholafind`,
    description: copy.description,
  };
}

export default async function BrowseCategoryPage({ params }: PageProps) {
  const { category } = params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const copy = categoryCopy[category];

  await connectToDatabase();
  const results = await getCuratedResults({ sourceKind: category, limit: 60 });

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
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-brick/40" />
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
            {copy.eyebrow}
          </p>
        </div>

        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">{copy.body}</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-colors ${
                c.href === `/browse/${category}`
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
          <div className="rounded-md border border-dashed border-line bg-paperDim/50 py-16 text-center">
            <p className="text-[0.9rem] text-inkSoft">
              No {copy.label.toLowerCase()} finds logged yet - check back soon.
            </p>
          </div>
        ) : (
          <div className="masonry">
            {findResults.map((item, i) => (
              <div
                key={item.id}
                className={`transition-transform hover:rotate-0 hover:z-10 ${
                  i % 3 === 0 ? 'rotate-[-0.4deg]' : i % 3 === 1 ? 'rotate-[0.4deg]' : ''
                }`}
              >
                <ResultCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}