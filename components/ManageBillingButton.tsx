'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Could not open billing portal.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft transition-colors hover:border-pine hover:text-ink disabled:opacity-60"
      >
        <Settings size={13} /> {loading ? 'Opening\u2026' : 'Manage billing'}
      </button>
      {error && <p className="mt-1.5 text-[0.78rem] text-brick">{error}</p>}
    </div>
  );
}