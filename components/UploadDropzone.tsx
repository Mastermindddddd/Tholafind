'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ScanLine } from 'lucide-react';

type Phase = 'idle' | 'preview' | 'scanning';

export default function UploadDropzone() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhase('scanning');
    window.setTimeout(() => {
      router.push('/results');
    }, 1600);
  }, [router]);

  const handleDemo = useCallback(() => {
    setPreviewUrl(
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80'
    );
    setPhase('scanning');
    window.setTimeout(() => {
      router.push('/results');
    }, 1600);
  }, [router]);

  return (
    <div className="w-full max-w-md">
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
        className={`relative overflow-hidden rounded-md border-2 border-dashed bg-card p-8 text-center shadow-card transition-colors ${
          dragActive ? 'border-brick bg-paperDim' : 'border-line'
        }`}
      >
        {phase === 'idle' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pine text-brassLight">
              <Camera size={20} />
            </div>
            <p className="font-display text-lg font-semibold text-ink">
              Drop a photo of what you&rsquo;re after
            </p>
            <p className="mx-auto mt-1.5 max-w-[26ch] text-[0.85rem] text-inkSoft">
              A screenshot, a thrift find, a blurry photo from across the room &mdash; any of it works.
            </p>

            <div className="mt-5 flex flex-col items-center gap-2.5">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-pine px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep"
              >
                <Upload size={14} /> Choose a photo
              </button>
              <button
                onClick={handleDemo}
                className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft underline decoration-dotted underline-offset-4 hover:text-brick"
              >
                Or try a sample hunt
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {phase === 'scanning' && previewUrl && (
          <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-sm border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Uploaded item" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-pine/25" />
            <div className="absolute left-0 right-0 h-[2px] bg-brassLight shadow-[0_0_12px_2px_rgba(217,174,107,0.8)] animate-scanline" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink/70 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-paper">
              <ScanLine size={11} className="animate-pulse" /> Logging specimen&hellip;
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.1em] text-inkSoft">
        Retail &middot; Resale &middot; Vintage &mdash; searched at once
      </p>
    </div>
  );
}
