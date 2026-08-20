import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { mockCollections } from '@/lib/mockData';
import { FolderPlus, Bell } from 'lucide-react';

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-paper paper-texture">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-brick">Your hunts</p>
        <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Nothing here gets lost.
          </h1>
          <button className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-inkSoft transition-colors hover:border-pine hover:text-ink">
            <FolderPlus size={14} /> New collection
          </button>
        </div>
        <p className="mt-2 max-w-xl text-[0.9rem] text-inkSoft">
          Every search you start is saved automatically. Group them, walk away for a month, and pick
          up exactly where the hunt left off.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockCollections.map((c) => (
            <a
              key={c.id}
              href="/results"
              className="group overflow-hidden rounded-md border border-line bg-card shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={c.cover}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 90vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-paper backdrop-blur">
                  {c.itemCount} items
                </span>
              </div>
              <div className="p-4">
                <p className="font-display text-[1.02rem] font-semibold text-ink">{c.name}</p>
                <p className="mt-1 text-[0.75rem] text-inkSoft">Updated {c.updated}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-md border border-dashed border-line bg-paperDim/50 p-5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-brassLight">
            <Bell size={14} />
          </span>
          <p className="text-[0.85rem] text-inkSoft">
            Turn on alerts for any collection and Tholafind will tell you when a saved hunt gets a new
            listing or a price drop &mdash; no need to keep checking back yourself.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
