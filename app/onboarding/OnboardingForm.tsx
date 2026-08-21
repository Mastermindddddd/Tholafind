'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const options = [
  { key: 'fashion', label: 'Fashion' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'vintage', label: 'Vintage & thrift' },
  { key: 'homeware', label: 'Homeware' },
  { key: 'other', label: 'A bit of everything' },
] as const;

export default function OnboardingForm() {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Pick at least one — or choose "A bit of everything."');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selected }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/collections');
      router.refresh();
    } catch {
      setError("That didn't save — try again in a moment.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {options.map((o) => {
          const active = selected.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle(o.key)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] transition-colors ${
                active
                  ? 'border-pine bg-pine text-paper'
                  : 'border-line bg-paper text-inkSoft hover:border-inkSoft'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[0.82rem] text-brick">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-pine px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Continue to my collections'}
      </button>
    </div>
  );
}
