'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';

export interface CollectionCardData {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  cover: string | null;
}

export default function CollectionCard({ collection }: { collection: CollectionCardData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const rename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === collection.name) {
      setRenaming(false);
      setName(collection.name);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setName(collection.name); // roll back on failure
    } finally {
      setBusy(false);
      setRenaming(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${collection.name}"? Saved items in it won't be recoverable.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-md border border-line bg-card shadow-card transition-shadow hover:shadow-cardHover">
      <Link href={`/collections/${collection.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-paperDim">
          {collection.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={collection.cover}
              alt={collection.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[0.65rem] uppercase tracking-[0.1em] text-inkSoft">
              Empty
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-paper backdrop-blur">
            {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </Link>

      <div className="p-4">
        {renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              onKeyDown={(e) => e.key === 'Enter' && rename()}
              className="w-full rounded-sm border border-line bg-paper px-2 py-1 text-[0.9rem] text-ink focus:border-pine"
            />
            <button onClick={rename} disabled={busy} aria-label="Save name" className="text-pine">
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setRenaming(false);
                setName(collection.name);
              }}
              aria-label="Cancel rename"
              className="text-inkSoft"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="font-display text-[1.02rem] font-semibold text-ink">{collection.name}</p>
            {!collection.isDefault && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Collection options"
                  className="text-inkSoft hover:text-ink"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-6 z-10 w-36 rounded-md border border-line bg-card py-1 shadow-cardHover">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setRenaming(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.82rem] text-ink hover:bg-paperDim"
                    >
                      <Pencil size={13} /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        remove();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.82rem] text-brick hover:bg-paperDim"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {collection.isDefault && (
          <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-inkSoft">Default</p>
        )}
      </div>
    </div>
  );
}