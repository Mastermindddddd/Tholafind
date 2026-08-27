'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function MarkHelpfulButton({
  requestId,
  answerId,
}: {
  requestId: string;
  answerId: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const markHelpful = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/community-requests/${requestId}/answers/${answerId}/helpful`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={markHelpful}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-inkSoft transition-colors hover:border-pine hover:text-ink disabled:opacity-60"
    >
      <CheckCircle2 size={12} /> {pending ? 'Marking\u2026' : 'This helped'}
    </button>
  );
}