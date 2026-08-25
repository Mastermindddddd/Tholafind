'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ScanLine, AlertCircle, Compass } from 'lucide-react';

interface RefineSearchPanelProps {
  searchId: string;
  imageCount: number;
  variant: 'low_confidence' | 'failed';
}

type Phase = 'idle' | 'rescanning' | 'error';

const MAX_IMAGES = 3;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const copy = {
  low_confidence: {
    title: "Nothing here is a confident match.",
    body: "A second angle, a close-up of a tag, or a quick detail can narrow things down a lot \u2014 add whichever you have.",
  },
  failed: {
    title: 'No leads found this time.',
    body: 'Try a clearer photo, a different angle, or add a detail like color or material \u2014 this hunt stays open, nothing is lost.',
  },
};

export default function RefineSearchPanel({ searchId, imageCount, variant }: RefineSearchPanelProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [hint, setHint] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const atImageLimit = imageCount >= MAX_IMAGES;

  const submitRefine = useCallback(
    async (file: File | null) => {
      if (!file && !hint.trim()) {
        setErrorMessage('Add a photo, a detail, or both.');
        setPhase('error');
        return;
      }
      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setErrorMessage('That file type isn\u2019t supported \u2014 try a JPEG, PNG, WEBP, or HEIC photo.');
          setPhase('error');
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          setErrorMessage('That photo is too large \u2014 try one under 8MB.');
          setPhase('error');
          return;
        }
      }

      setPhase('rescanning');

      const formData = new FormData();
      formData.append('searchId', searchId);
      if (file) formData.append('file', file);
      if (hint.trim()) formData.append('hint', hint.trim());

      try {
        const res = await fetch('/api/search/refine', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || 'That refine didn\u2019t go through.');
        }

        // The server component that owns this data needs to re-fetch —
        // refine already fully re-ran the search before responding.
        router.refresh();
        setPhase('idle');
        setHint('');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'That refine didn\u2019t go through \u2014 try again.');
        setPhase('error');
      }
    },
    [hint, router, searchId]
  );

  if (phase === 'rescanning') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-dashed border-brass bg-card p-5">
        <ScanLine size={16} className="animate-pulse text-brass" />
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.1em] text-inkSoft">
          Rescanning with your added detail&hellip;
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-brass bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-brassLight">
          <Compass size={15} />
        </span>
        <div className="flex-1">
          <p className="font-display text-[1.02rem] font-semibold text-ink">{copy[variant].title}</p>
          <p className="mt-1 text-[0.85rem] text-inkSoft">{copy[variant].body}</p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="refine-hint"
                className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-inkSoft"
              >
                Add a detail
              </label>
              <input
                id="refine-hint"
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value.slice(0, 280))}
                placeholder="Color, material, a brand guess&hellip;"
                className="mt-1.5 w-full rounded-sm border border-line bg-paper px-3 py-2 text-[0.85rem] text-ink placeholder:text-inkSoft/70 focus:border-pine"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={atImageLimit}
                title={atImageLimit ? `You've already added the maximum of ${MAX_IMAGES} photos.` : undefined}
                className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft transition-colors hover:border-pine hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={13} /> Add angle
              </button>
              <button
                onClick={() => submitRefine(null)}
                className="rounded-full bg-brick px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brick/85"
              >
                Rescan
              </button>
            </div>
          </div>

          {atImageLimit && (
            <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-inkSoft">
              Maximum of {MAX_IMAGES} photos reached &mdash; you can still add a detail above.
            </p>
          )}

          {phase === 'error' && errorMessage && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[0.82rem] text-brick">
              <AlertCircle size={13} /> {errorMessage}
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => submitRefine(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </div>
  );
}