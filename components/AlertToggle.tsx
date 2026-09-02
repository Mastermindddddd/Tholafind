'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing } from 'lucide-react';
import UpgradeButton from './UpgradeButton';

export interface AlertNotificationData {
  message: string;
  createdAt: string;
}

interface AlertToggleProps {
  searchId: string;
  initialWatched: boolean;
  initialUnreadCount: number;
  recentNotifications: AlertNotificationData[];
}

type PopoverMode = 'none' | 'notifications' | 'limit-reached';

export default function AlertToggle({
  searchId,
  initialWatched,
  initialUnreadCount,
  recentNotifications,
}: AlertToggleProps) {
  const [watched, setWatched] = useState(initialWatched);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pending, setPending] = useState(false);
  const [popover, setPopover] = useState<PopoverMode>('none');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPopover('none');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleWatch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (unreadCount > 0) {
      setPopover((p) => (p === 'notifications' ? 'none' : 'notifications'));
      return;
    }

    if (pending) return;
    setPending(true);
    const next = !watched;
    setWatched(next); // optimistic

    try {
      const res = await fetch('/api/alerts', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      });

      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.limitReached) {
          setWatched(false); // roll back — the watch was not actually turned on
          setLimitMessage(data.message);
          setPopover('limit-reached');
          return;
        }
        throw new Error();
      }
    } catch {
      setWatched(!next); // roll back
    } finally {
      setPending(false);
    }
  };

  const markSeen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUnreadCount(0);
    setPopover('none');
    try {
      await fetch('/api/alerts/seen', { method: 'POST' });
      router.refresh();
    } catch {
      // Non-critical — worst case the badge shows stale count until next load.
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleWatch}
        disabled={pending}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread updates`
            : watched
              ? 'Stop watching this hunt'
              : 'Watch this hunt for updates'
        }
        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-colors ${
          watched || unreadCount > 0 ? 'bg-brass text-paper' : 'bg-ink/40 text-paper hover:bg-ink/60'
        }`}
      >
        {watched || unreadCount > 0 ? <BellRing size={14} /> : <Bell size={14} />}
      </button>

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brick px-1 font-mono text-[0.55rem] text-paper">
          {unreadCount}
        </span>
      )}

      {popover === 'notifications' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-10 z-20 w-64 rounded-md border border-line bg-card p-3 text-left shadow-cardHover"
        >
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft">
            Updates on this hunt
          </p>
          <div className="mt-2 space-y-2">
            {recentNotifications.map((n, i) => (
              <p key={i} className="text-[0.8rem] text-ink">
                {n.message}
              </p>
            ))}
          </div>
          <button
            onClick={markSeen}
            className="mt-3 rounded-full border border-line px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft hover:border-pine hover:text-ink"
          >
            Mark all seen
          </button>
        </div>
      )}

      {popover === 'limit-reached' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-10 z-20 w-60 rounded-md border border-line bg-card p-3 text-left shadow-cardHover"
        >
          <p className="text-[0.82rem] text-ink">{limitMessage}</p>
          <div className="mt-3">
            <UpgradeButton label="Get Plus" />
          </div>
        </div>
      )}
    </div>
  );
}