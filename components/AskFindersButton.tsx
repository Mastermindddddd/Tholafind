'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';

interface AskFindersButtonProps {
  searchId: string;
  /** Non-null when a request already exists for this search (checked
   * server-side on the results page) — skips straight to the "already
   * asked" state instead of showing the ask button. */
  existingRequestId: string | null;
}

type Phase = 'idle' | 'pending' | 'asked' | 'error';

export default function AskFindersButton({ searchId, existingRequestId }: AskFindersButtonProps) {
  const [phase, setPhase] = useState<Phase>(existingRequestId ? 'asked' : 'idle');
  const [requestId, setRequestId] = useState<string | null>(existingRequestId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const ask = async () => {
    setPhase('pending');
    try {
      const res = await fetch('/api/community-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'That didn\u2019t go through.');
      }

      setRequestId(data.id);
      setPhase('asked');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'That didn\u2019t go through \u2014 try again.');
      setPhase('error');
    }
  };

  if (phase === 'asked' && requestId) {
    return (
      <Link
        href={`/community/${requestId}`}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-inkSoft transition-colors hover:border-pine hover:text-ink"
      >
        <Users size={13} /> View request <ArrowRight size={12} />
      </Link>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="flex items-center gap-1.5 text-[0.78rem] text-brick">
          <AlertCircle size={13} /> {errorMessage}
        </p>
        <button
          onClick={ask}
          className="rounded-full bg-brick px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brick/85"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={ask}
      disabled={phase === 'pending'}
      className="shrink-0 rounded-full bg-brick px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brick/85 disabled:opacity-60"
    >
      {phase === 'pending' ? 'Asking\u2026' : 'Ask the finders'}
    </button>
  );
}