'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ScanLine, AlertCircle } from 'lucide-react';

type Phase = 'idle' | 'scanning' | 'error';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MIN_SCAN_MS = 1100;

async function withMinimumDelay<T>(promise: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([promise, new Promise((r) => setTimeout(r, ms))]);
  return result;
}

export default function UploadDropzone() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = useCallback(() => {
    setPhase('idle');
    setErrorMessage(null);
    setPreviewUrl(null);
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;

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

      setPreviewUrl(URL.createObjectURL(file));
      setPhase('scanning');

      const formData = new FormData();
      formData.append('file', file);
      if (hint.trim()) formData.append('hint', hint.trim());

      try {
        const res = await withMinimumDelay(
          fetch('/api/upload', { method: 'POST', body: formData }),
          MIN_SCAN_MS
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || 'Upload failed.');
        }

        router.push(`/results/${data.searchId}`);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'That upload didn\u2019t go through \u2014 try again.'
        );
        setPhase('error');
      }
    },
    [hint, router]
  );

  const handleDemo = useCallback(async () => {
    const demoImageUrl = 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80';
    setPreviewUrl(demoImageUrl);
    setPhase('scanning');

    try {
      const res = await withMinimumDelay(
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoImageUrl }),
        }),
        MIN_SCAN_MS
      );
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Could not start the sample hunt.');
      }

      router.push(`/results/${data.searchId}`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not start the sample hunt \u2014 try again.'
      );
      setPhase('error');
    }
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => phase === 'idle' && inputRef.current?.click()}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed bg-paper/70 px-4 py-3.5 text-center shadow-card transition-colors sm:px-7 sm:py-5 ${
  phase === 'idle' ? 'cursor-pointer' : ''
} ${dragActive ? 'border-brick bg-paperDim' : 'border-pine/30 hover:border-pine/50'}`}
      >
        {phase === 'idle' && (
          <>
            <div className="relative mx-auto flex items-center justify-center">
  <span aria-hidden className="absolute -left-5 text-xs text-brass sm:-left-8 sm:text-sm">
    ✦
  </span>
  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-paper shadow-md sm:h-11 sm:w-11">
    <Camera size={16} strokeWidth={1.5} className="sm:h-[18px] sm:w-[18px]" />
  </span>
  <span aria-hidden className="absolute -right-5 text-xs text-pine/40 sm:-right-8 sm:text-sm">
    ✦
  </span>
</div>

<p className="mt-1.5 font-display text-sm font-semibold text-ink sm:mt-2 sm:text-base md:text-lg">
  Drop your photo here
</p>
<p className="mt-0.5 font-mono text-[0.56rem] uppercase tracking-[0.08em] text-inkSoft sm:text-[0.6rem] sm:tracking-[0.1em]">
  or click to upload
</p>

            <div
              className="mt-3 flex flex-col items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {showHint ? (
                <div className="w-full text-left">
                  <label
                    htmlFor="upload-hint"
                    className="font-mono text-[0.56rem] uppercase tracking-[0.08em] text-inkSoft"
                  >
                    Know a detail? (optional)
                  </label>
                  <input
                    id="upload-hint"
                    type="text"
                    autoFocus
                    value={hint}
                    onChange={(e) => setHint(e.target.value.slice(0, 280))}
                    placeholder="Color, material, a brand guess&hellip;"
                    className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-1.5 text-[0.75rem] text-ink placeholder:text-inkSoft/70 focus:border-pine focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft underline decoration-dotted underline-offset-4 hover:text-pine"
                >
                  + Add a detail (optional)
                </button>
              )}

              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-pine px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep"
                >
                  <Upload size={12} /> Choose a photo
                </button>

                <button
                  onClick={handleDemo}
                  className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft underline decoration-dotted underline-offset-4 hover:text-brick"
                >
                  Try a sample hunt
                </button>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {phase === 'scanning' && previewUrl && (
          <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-sm border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Uploaded item" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-pine/25" />
            <div className="absolute left-0 right-0 h-[2px] bg-brassLight shadow-[0_0_12px_2px_rgba(217,174,107,0.8)] animate-scanline" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink/70 py-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-paper">
              <ScanLine size={10} className="animate-pulse" /> Logging specimen&hellip;
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="py-1" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brick/10 text-brick">
              <AlertCircle size={18} />
            </div>
            <p className="font-display text-base font-semibold text-ink">That didn&rsquo;t go through</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-[0.8rem] text-inkSoft">{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-3 rounded-full bg-pine px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-center font-mono text-[0.58rem] uppercase tracking-[0.08em] text-inkSoft sm:text-[0.6rem]">
        Retail &middot; Resale &middot; Vintage &mdash; searched at once
      </p>
    </div>
  );
}