import { Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-line/70 bg-paperDim">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-brassLight">
              <Compass size={14} />
            </span>
            <span className="font-display text-base font-semibold text-ink">Tholafind</span>
          </div>
          <p className="max-w-md text-[0.8rem] text-inkSoft">
            Built for the hunt &mdash; the thing you can&rsquo;t name, the piece from a photo,
            the one that&rsquo;s been out of stock for months. We keep looking after the first search stops.
          </p>
        </div>
        <span className="sr-only">Awin</span>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-inkSoft">
          <span>&copy; {new Date().getFullYear()} Tholafind</span>
          <span>No card required to start a hunt</span>
        </div>
      </div>
    </footer>
  );
}
