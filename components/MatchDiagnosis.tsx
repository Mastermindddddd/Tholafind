'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, Loader2 } from 'lucide-react';

type Missing = 'brand' | 'tag' | 'material' | 'color' | 'angle';

interface MatchDiagnosisProps {
  searchId: string;
  explanation: string;
  missing: Missing[];
  imageCount: number;
  existingHint: string | null;
}

const MAX_IMAGES = 3;

/**
 * Shown when the best match is weak. Says plainly why, and asks only for the
 * details that would actually help: brand / material / color as text, and a
 * tag close-up or second angle as a photo. Posts to the existing
 * /api/search/refine route, which re-runs the whole search.
 *
 * Note: the hint is used verbatim as the eBay/Etsy query, so the fields are
 * joined as plain words ("Nike leather red"), not "brand: Nike".
 */
export default function MatchDiagnosis({
  searchId,
  explanation,
  missing,
  imageCount,
  existingHint,
}: MatchDiagnosisProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({ brand: '', material: '', color: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textFields = (['brand', 'material', 'color'] as const).filter((f) => missing.includes(f));
  const wantsPhoto = (missing.includes('tag') || missing.includes('angle')) && imageCount < MAX_IMAGES;
  const hasText = textFields.some((f) => values[f].trim().length > 0);

  async function send(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/search/refine', init);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'That didn’t go through.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t go through — try again.');
    } finally {
      setBusy(false);
    }
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!hasText || busy) return;
    const hint = [existingHint, ...textFields.map((f) => values[f].trim())]
      .filter(Boolean)
      .join(' ')
      .slice(0, 280);
    send({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId, hint }),
    });
  }

  function submitPhoto(file: File | undefined) {
    if (!file || busy) return;
    const form = new FormData();
    form.append('searchId', searchId);
    form.append('file', file);
    send({ method: 'POST', body: form });
  }

  return (
    <div className="rounded-md border border-dashed border-brass bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-brassLight">
          <AlertCircle size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.02rem] font-semibold text-ink">
            Help us tighten this up
          </p>
          <p className="mt-1 text-[0.85rem] text-inkSoft">{explanation}</p>

          {(textFields.length > 0 || wantsPhoto) && (
            <p className="mt-3 text-[0.82rem] text-ink">
              Any of these would help &mdash; none are required:
            </p>
          )}

          {textFields.length > 0 && (
            <form onSubmit={submitDetails} className="mt-2 flex flex-wrap items-end gap-3">
              {textFields.map((f) => (
                <label key={f} className="flex flex-col gap-1">
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-inkSoft">
                    {f}
                  </span>
                  <input
                    type="text"
                    value={values[f]}
                    onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value.slice(0, 60) }))}
                    placeholder={f === 'brand' ? 'e.g. Nike' : f === 'material' ? 'e.g. leather' : 'e.g. olive'}
                    disabled={busy}
                    className="w-36 rounded-sm border border-line bg-paper px-3 py-1.5 text-[0.78rem] text-ink placeholder:text-inkSoft/70 focus:border-pine focus:outline-none"
                  />
                </label>
              ))}
              <button
                type="submit"
                disabled={!hasText || busy}
                className="rounded-full bg-pine px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep disabled:opacity-50"
              >
                Search again
              </button>
            </form>
          )}

          {wantsPhoto && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-pine px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-pine transition-colors hover:bg-pine hover:text-paper disabled:opacity-50"
              >
                <Camera size={12} />
                {missing.includes('tag') ? 'Add a tag or label close-up' : 'Add another angle'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(e) => {
                  submitPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {busy && (
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-inkSoft">
              <Loader2 size={12} className="animate-spin" /> Rescanning&hellip;
            </p>
          )}
          {error && <p className="mt-3 text-[0.8rem] text-brick">{error}</p>}
        </div>
      </div>
    </div>
  );
}