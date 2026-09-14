import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import { connectToDatabase } from '@/lib/db';
import { getCuratedResults } from '@/lib/browse/getCuratedResults';
import { toFindResult } from '@/lib/browse/toFindResult';
import { getSavedResultIds } from '@/lib/getSavedResultIds';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import type { SourceKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

const categoryCopy: Record<
  SourceKind,
  { label: string; eyebrow: string; title: string; body: string; description: string }
> = {
  retail: {
    label: 'Retail',
    eyebrow: 'New, on the shelf',
    title: 'Still in stock, somewhere.',
    body: 'Real items people photographed and found still being sold new \u2014 sorted by how confidently each one was matched to the original photo.',
    description:
      'Browse real retail matches found on Tholafind \u2014 items people photographed and tracked down to where they\u2019re still sold new.',
  },
  resale: {
    label: 'Resale',
    eyebrow: 'Someone else\u2019s, now yours',
    title: 'Secondhand, spotted.',
    body: 'Finds from eBay and other resale marketplaces \u2014 the exact jacket, the exact chair, found secondhand instead of starting from scratch.',
    description:
      'Browse real resale finds on Tholafind \u2014 secondhand items people tracked down on eBay and similar marketplaces.',
  },
  vintage: {
    label: 'Vintage',
    eyebrow: 'Aged well',
    title: 'Old things, correctly identified.',
    body: 'Vintage and handmade finds from Etsy \u2014 the kind of item that takes a specific eye (or a specific search) to actually place.',
    description:
      'Browse real vintage finds on Tholafind \u2014 items people identified and tracked down on Etsy and similar vintage marketplaces.',
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
    results.map((r) => r._id)
  );
  const findResults = results.map((r) => toFindResult(r, savedResultIds));

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
          {copy.eyebrow}
        </p>
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
          <p className="py-16 text-center text-[0.9rem] text-inkSoft">
            No {copy.label.toLowerCase()} finds logged yet &mdash; check back soon.
          </p>
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