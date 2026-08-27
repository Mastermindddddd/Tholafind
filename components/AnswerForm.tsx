'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

export default function AnswerForm({ requestId }: { requestId: string }) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/community-requests/${requestId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), note: note.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.message || 'That didn\u2019t go through.');
      setUrl('');
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn\u2019t go through \u2014 try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border border-line bg-card p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-inkSoft">
        Think you know what this is?
      </p>
      <div className="mt-2.5 flex flex-col gap-2.5">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link to where you found it"
          className="rounded-sm border border-line bg-paper px-3 py-2 text-[0.85rem] text-ink placeholder:text-inkSoft/70 focus:border-pine"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="A short note (optional) \u2014 why you think this is it"
          className="rounded-sm border border-line bg-paper px-3 py-2 text-[0.85rem] text-ink placeholder:text-inkSoft/70 focus:border-pine"
        />
        {error && <p className="text-[0.78rem] text-brick">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting || !url.trim()}
          className="flex items-center justify-center gap-1.5 self-start rounded-full bg-pine px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-pineDeep disabled:opacity-60"
        >
          <Send size={12} /> {submitting ? 'Sending\u2026' : 'Send answer'}
        </button>
      </div>
    </div>
  );
}