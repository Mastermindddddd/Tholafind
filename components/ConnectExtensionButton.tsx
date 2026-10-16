'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Puzzle } from 'lucide-react';

type Phase = 'checking' | 'missing' | 'ready' | 'connecting' | 'done' | 'error';

/**
 * Pairs the browser extension with the signed-in account.
 *  1. The extension's content script (only injected on this page) answers a
 *     "ping" so we know it is installed.
 *  2. We mint a token via POST /api/extension/token (Clerk session).
 *  3. We hand it to the content script with window.postMessage, same-origin only.
 */
export default function ConnectExtensionButton() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const phaseRef = useRef<Phase>('checking');
  phaseRef.current = phase;

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const d = e.data;
      if (!d || d.source !== 'tholafind-ext') return;
      if (d.type === 'hello' && phaseRef.current === 'checking') setPhase('ready');
      if (d.type === 'token-saved') setPhase('done');
    }
    window.addEventListener('message', onMessage);

    const post = () => window.postMessage({ source: 'tholafind-web', type: 'ping' }, window.location.origin);
    post();
    const retry = setTimeout(post, 500);
    const giveUp = setTimeout(() => {
      if (phaseRef.current === 'checking') setPhase('missing');
    }, 1800);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(retry);
      clearTimeout(giveUp);
    };
  }, []);

  async function connect() {
    setPhase('connecting');
    setMessage(null);
    try {
      const res = await fetch('/api/extension/token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Could not connect.');
      window.postMessage(
        { source: 'tholafind-web', type: 'extension-token', token: data.token },
        window.location.origin
      );
      // If the extension doesn't confirm shortly, say so rather than hang.
      setTimeout(() => {
        if (phaseRef.current === 'connecting') {
          setMessage('The extension didn’t respond. Reload this page and try again.');
          setPhase('error');
        }
      }, 4000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not connect.');
      setPhase('error');
    }
  }

  if (phase === 'checking') {
    return (
      <p className="flex items-center justify-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft">
        <Loader2 size={13} className="animate-spin" /> Looking for the extension&hellip;
      </p>
    );
  }

  if (phase === 'missing') {
    return (
      <p className="mx-auto max-w-sm text-[0.85rem] text-inkSoft">
        We couldn&rsquo;t find the Tholafind extension in this browser. Install it, then reload this page.
      </p>
    );
  }

  if (phase === 'done') {
    return (
      <p className="flex items-center justify-center gap-2 font-display text-lg font-semibold text-pine">
        <Check size={18} /> Connected. You can close this tab and start hunting.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={phase === 'connecting'}
        className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-pineDeep disabled:opacity-60"
      >
        {phase === 'connecting' ? <Loader2 size={14} className="animate-spin" /> : <Puzzle size={14} />}
        Connect extension
      </button>
      {message && <p className="mt-3 text-[0.8rem] text-brick">{message}</p>}
    </div>
  );
}