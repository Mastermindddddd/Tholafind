'use client';

import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard from '@/components/ResultCard';
import { mockResults } from '@/lib/mockData';
import { SourceKind } from '@/lib/types';
import { Users, SlidersHorizontal } from 'lucide-react';

type FilterKey = 'all' | SourceKind;

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All sources' },
  { key: 'retail', label: 'Retail' },
  { key: 'resale', label: 'Resale' },
  { key: 'vintage', label: 'Vintage' },
];

export default function ResultsPage() {
  const [active, setActive] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (active === 'all') return mockResults;
    return mockResults.filter((r) => r.sourceKind === active);
  }, [active]);

  const guessCount = mockResults.filter((r) => r.confidence === 'guess').length;

  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Hunt log &middot; #TF-2291</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          12 leads found across 9 sources
        </h1>
        <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
          Sorted by how closely each result matches your photo. Save anything worth tracking, and
          escalate the uncertain ones to the community below.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={14} className="mr-1 text-inkSoft" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-colors ${
                active === f.key
                  ? 'border-pine bg-pine text-paper'
                  : 'border-line bg-card text-inkSoft hover:border-inkSoft'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {guessCount > 0 && (
        <section className="mx-auto mt-8 max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-brass bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-brassLight">
                <Users size={15} />
              </span>
              <div>
                <p className="font-display text-[1.02rem] font-semibold text-ink">
                  {guessCount} of these are only a best guess.
                </p>
                <p className="mt-1 text-[0.85rem] text-inkSoft">
                  Hand the photo to the community with the details they&rsquo;d actually ask for &mdash;
                  tag close-ups, fabric, era &mdash; and let a person take a look.
                </p>
              </div>
            </div>
            <button className="shrink-0 rounded-full bg-brick px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brick/85">
              Ask the finders
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="masonry">
          {filtered.map((item) => (
            <ResultCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
