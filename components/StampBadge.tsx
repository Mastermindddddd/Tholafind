import { Confidence } from '@/lib/types';

const config: Record<Confidence, { label: string; rotate: string; tone: string }> = {
  exact: { label: 'Exact match', rotate: '-rotate-3', tone: 'bg-brass text-paper' },
  close: { label: 'Close match', rotate: 'rotate-2', tone: 'bg-pine text-paper' },
  guess: { label: 'Best guess', rotate: '-rotate-1', tone: 'bg-card text-inkSoft border border-inkSoft/40' },
};

export default function StampBadge({ confidence }: { confidence: Confidence }) {
  const c = config[confidence];
  return (
    <span
      className={`inline-block select-none rounded-sm px-2 py-1 font-mono text-[0.62rem] font-medium uppercase tracking-[0.08em] shadow-stamp ${c.rotate} ${c.tone}`}
    >
      {c.label}
    </span>
  );
}
