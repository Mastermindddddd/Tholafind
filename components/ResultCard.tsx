'use client';

import { useState } from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import { FindResult } from '@/lib/types';
import StampBadge from './StampBadge';

const sourceLabel: Record<FindResult['sourceKind'], string> = {
  retail: 'Retail',
  resale: 'Resale',
  vintage: 'Vintage',
};

export default function ResultCard({ item }: { item: FindResult }) {
  const [saved, setSaved] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block animate-riseIn overflow-hidden rounded-[6px] border border-line/70 bg-card shadow-card transition-shadow duration-300 hover:shadow-cardHover"
    >
      <div className="stitch-border opacity-70" />
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${item.aspect}` }}>
        {/* Plain img, not next/image: result thumbnails come from whichever
            retailer/eBay/Etsy/Google-thumbnail domain each search result
            happens to be hosted on — an unbounded, unpredictable set that
            can't be pre-allowlisted via next.config.mjs remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5">
          <StampBadge confidence={item.confidence} />
        </div>
        <button
          onClick={(e) => {
            // Without this, clicking the heart would also trigger the
            // parent <a>'s navigation to the external listing.
            e.preventDefault();
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from collection' : 'Save to collection'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-colors ${
            saved ? 'bg-brick text-paper' : 'bg-ink/40 text-paper hover:bg-ink/60'
          }`}
        >
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
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