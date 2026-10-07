'use client';

import { ExternalLink } from 'lucide-react';
import { FindResult } from '@/lib/types';
import StampBadge from './StampBadge';
import SavePicker from './SavePicker';

const sourceLabel: Record<FindResult['sourceKind'], string> = {
  retail: 'Retail',
  resale: 'Resale',
  vintage: 'Vintage',
};

export default function ResultCard({ item }: { item: FindResult }) {
  // Confidence ("exact match" / "close match") only means something for a
  // SearchResult — it reflects how well something matched a user's own
  // photo. DiscoveryItem entries on /browse were never matched against
  // anything, so the stamp badge doesn't apply to them and is skipped.
  const showConfidenceBadge = item.itemType === 'SearchResult';

  // Older searches (before match scoring) have no matchScore; show no
  // percentage for them rather than inventing one.
  const hasScore = showConfidenceBadge && typeof item.matchScore === 'number';
  const reasons = item.matchReasons ?? [];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block animate-riseIn overflow-hidden rounded-[6px] border border-line/70 bg-card shadow-card transition-shadow duration-300 hover:shadow-cardHover"
    >
      <div className="stitch-border opacity-70" />
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${item.aspect}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {showConfidenceBadge && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <StampBadge confidence={item.confidence} />
            {hasScore && (
              <span
                title={reasons.join('\n')}
                className="rounded-full bg-ink/80 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-paper"
              >
                {item.matchScore}% match
              </span>
            )}
          </div>
        )}
        <SavePicker itemId={item.id} itemType={item.itemType} initiallySaved={item.saved} />
      </div>

      <div className="p-3.5">
        <p className="font-display text-[0.98rem] leading-snug text-ink">{item.title}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-paperDim px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft">
              {sourceLabel[item.sourceKind]}
            </span>
            <span className="text-[0.78rem] text-inkSoft">{item.source}</span>
          </div>
        </div>
        {hasScore && reasons.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {reasons.slice(0, 2).map((r) => (
              <li key={r} className="text-[0.72rem] italic leading-snug text-inkSoft">
                {r}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-line pt-2.5">
          <span className="font-display text-[1.05rem] font-semibold text-ink">{item.price}</span>
          <span className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-brick opacity-0 transition-opacity group-hover:opacity-100">
            View <ExternalLink size={11} />
          </span>
        </div>
      </div>
    </a>
  );
}