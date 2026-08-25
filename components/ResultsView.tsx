'use client';

import { useMemo, useState } from 'react';
import ResultCard from '@/components/ResultCard';
import RefineSearchPanel from '@/components/RefineSearchPanel';
import { FindResult, SourceKind } from '@/lib/types';
import { Users, SlidersHorizontal } from 'lucide-react';

type FilterKey = 'all' | SourceKind;

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All sources' },
  { key: 'retail', label: 'Retail' },
  { key: 'resale', label: 'Resale' },
  { key: 'vintage', label: 'Vintage' },
];

interface ResultsViewProps {
  searchId: string;
  reference: string;
  photoUrls: string[];
  status: string;
  imageCount: number;
  results: FindResult[];
}

export default function ResultsView({
  searchId,
  reference,
  photoUrls,
  status,
  imageCount,
  results,
}: ResultsViewProps) {
  const [active, setActive] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (active === 'all') return results;
    return results.filter((r) => r.sourceKind === active);
  }, [active, results]);

  const guessCount = results.filter((r) => r.confidence === 'guess').length;
  const sourceCount = new Set(results.map((r) => r.source)).size;

  // A weak-or-failed search gets the more targeted, higher-leverage prompt
  // (improve the input — add an angle or a hint) rather than the crowd-assist
  // banner below, which is for the milder case: a mostly-good search with a
  // few uncertain items mixed in.
  const needsRefine = status === 'low_confidence' || status === 'failed';

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 gap-2">
            {photoUrls.map((url, i) => (
              <div
                key={url}
                className={`relative overflow-hidden rounded-md border border-line shadow-card ${
                  i === 0 ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-24 w-16 sm:h-28 sm:w-20'
                }`}
              >
                {/* Plain img tag: these are user- or demo-supplied external URLs
                    (Vercel Blob or an Unsplash demo image), not locally optimizable assets. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={i === 0 ? 'Your uploaded photo' : `Additional angle ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">
              Hunt log &middot; #{reference}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {results.length > 0
                ? `${results.length} leads found across ${sourceCount} sources`
                : status === 'pending' || status === 'searching'
                  ? 'Searching now\u2026'
                  : 'No leads found this time'}
            </h1>
            <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
              {results.length > 0
                ? 'Sorted by how closely each result matches your photo. Save anything worth tracking, and escalate the uncertain ones to the community below.'
                : status === 'pending' || status === 'searching'
                  ? 'Sorted by how closely each result matches your photo, as soon as they come in.'
                  : 'None of the connected sources turned up a match \u2014 try a clearer photo, or hand this one to the community.'}
            </p>
          </div>
        </div>

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

      {needsRefine && (
        <section className="mx-auto mt-8 max-w-7xl px-5 sm:px-8">
          <RefineSearchPanel
            searchId={searchId}
            imageCount={imageCount}
            variant={status === 'failed' ? 'failed' : 'low_confidence'}
          />
        </section>
      )}

      {!needsRefine && guessCount > 0 && (
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
    </>
  );
}