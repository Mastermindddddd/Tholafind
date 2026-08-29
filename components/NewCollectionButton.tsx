'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, X } from 'lucide-react';
import UpgradeButton from './UpgradeButton';

export default function NewCollectionButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const router = useRouter();

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the collection a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setLimitReached(false);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.limitReached) setLimitReached(true);
        throw new Error(data.message || 'Could not create collection.');
      }
      setOpen(false);
      setName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create collection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft transition-colors hover:border-pine hover:text-ink"
      >
        <FolderPlus size={14} /> New collection
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 80))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Collection name"
        className="rounded-full border border-line bg-card px-4 py-2 text-[0.85rem] text-ink focus:border-pine"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-full bg-pine px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep disabled:opacity-60"
      >
        {submitting ? 'Saving\u2026' : 'Create'}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        aria-label="Cancel"
        className="flex h-8 w-8 items-center justify-center rounded-full text-inkSoft hover:text-ink"
      >
        <X size={16} />
      </button>
      {error && <p className="ml-1 text-[0.78rem] text-brick">{error}</p>}
      {limitReached && (
        <div className="ml-1">
          <UpgradeButton />
        </div>
      )}
    </div>
  );
}