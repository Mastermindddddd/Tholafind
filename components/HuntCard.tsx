import Link from 'next/link';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import AlertToggle, { type AlertNotificationData } from '@/components/AlertToggle';

export interface HuntCardData {
  searchId: string;
  reference: string;
  photo: string;
  status: string;
  resultCount: number;
  updatedAt: Date;
  isWatched: boolean;
  unreadCount: number;
  recentNotifications: AlertNotificationData[];
}

const statusLabel: Record<string, string> = {
  pending: 'Starting\u2026',
  searching: 'Searching\u2026',
  complete: 'Complete',
  low_confidence: 'Needs a clearer photo',
  failed: 'No leads yet',
};

export default function HuntCard({ hunt }: { hunt: HuntCardData }) {
  return (
    <Link
      href={`/results/${hunt.searchId}`}
      className="group overflow-hidden rounded-md border border-line bg-card shadow-card transition-shadow hover:shadow-cardHover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paperDim">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hunt.photo}
          alt={`Hunt ${hunt.reference}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-paper backdrop-blur">
          {hunt.resultCount} {hunt.resultCount === 1 ? 'lead' : 'leads'}
        </span>
        <div className="absolute right-3 top-3">
          <AlertToggle
            searchId={hunt.searchId}
            initialWatched={hunt.isWatched}
            initialUnreadCount={hunt.unreadCount}
            recentNotifications={hunt.recentNotifications}
          />
        </div>
      </div>
      <div className="p-4">
        <p className="font-display text-[1.02rem] font-semibold text-ink">#{hunt.reference}</p>
        <p className="mt-1 flex items-center justify-between text-[0.75rem] text-inkSoft">
          <span>{statusLabel[hunt.status] ?? hunt.status}</span>
          <span>{formatRelativeTime(hunt.updatedAt)}</span>
        </p>
      </div>
    </Link>
  );
}