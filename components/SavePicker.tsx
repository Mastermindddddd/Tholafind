'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Heart, Check, Plus } from 'lucide-react';

interface CollectionOption {
  id: string;
  name: string;
  isDefault: boolean;
}

interface SavePickerProps {
  itemId: string;
  itemType: 'SearchResult' | 'DiscoveryItem';
  initiallySaved: boolean;
}

export default function SavePicker({ itemId, itemType, initiallySaved }: SavePickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[] | null>(null);
  const [savedIn, setSavedIn] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();

  const savedAnywhere = initiallySaved || savedIn.size > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const loadPickerData = useCallback(async () => {
    setLoading(true);
    try {
      const [collectionsRes, statusRes] = await Promise.all([
        fetch('/api/collections'),
        fetch(`/api/collections/items?itemId=${itemId}&itemType=${itemType}`),
      ]);
      const collectionsData = await collectionsRes.json();
      const statusData = await statusRes.json();

      if (collectionsData.ok) {
        setCollections(
          collectionsData.collections.map((c: { id: string; name: string; isDefault: boolean }) => ({
            id: c.id,
            name: c.name,
            isDefault: c.isDefault,
          }))
        );
      }
      if (statusData.ok) {
        setSavedIn(new Set(statusData.collectionIds));
      }
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType]);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const next = !open;
    setOpen(next);
    if (next && collections === null) {
      loadPickerData();
    }
  };

  const toggleCollection = async (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const wasSaved = savedIn.has(collectionId);
    const nextSet = new Set(savedIn);
    wasSaved ? nextSet.delete(collectionId) : nextSet.add(collectionId);
    setSavedIn(nextSet);

    try {
      const res = await fetch('/api/collections/items', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, collectionId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSavedIn(savedIn);
    }
  };

  const createAndSave = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const createRes = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.ok) throw new Error(createData.message);

      await fetch('/api/collections/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, collectionId: createData.id }),
      });

      setCollections((prev) => [...(prev ?? []), { id: createData.id, name: trimmed, isDefault: false }]);
      setSavedIn((prev) => new Set(prev).add(createData.id));
      setNewName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={rootRef} className="absolute right-2.5 top-2.5">
      <button
        onClick={handleHeartClick}
        aria-pressed={savedAnywhere}
        aria-label={savedAnywhere ? 'Manage saved collections' : 'Save to a collection'}
        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-colors ${
          savedAnywhere ? 'bg-brick text-paper' : 'bg-ink/40 text-paper hover:bg-ink/60'
        }`}
      >
        <Heart size={15} fill={savedAnywhere ? 'currentColor' : 'none'} strokeWidth={2} />
      </button>

      {open && (
        <div
          onClick={(e) => e.preventDefault()}
          className="absolute right-0 top-10 z-20 w-56 rounded-md border border-line bg-card p-2 text-left shadow-cardHover"
        >
          <p className="px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-inkSoft">
            Save to&hellip;
          </p>

          {loading && (
            <p className="px-2 py-2 text-[0.82rem] text-inkSoft">Loading your collections&hellip;</p>
          )}

          {!loading && collections && collections.length === 0 && (
            <p className="px-2 py-2 text-[0.82rem] text-inkSoft">No collections yet.</p>
          )}

          {!loading &&
            collections?.map((c) => {
              const isSaved = savedIn.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={(e) => toggleCollection(e, c.id)}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[0.85rem] text-ink hover:bg-paperDim"
                >
                  <span>
                    {c.name}
                    {c.isDefault && <span className="ml-1 text-inkSoft">(default)</span>}
                  </span>
                  {isSaved && <Check size={14} className="text-brick" />}
                </button>
              );
            })}

          <div className="mt-1.5 flex items-center gap-1 border-t border-dashed border-line pt-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 80))}
              onKeyDown={(e) => e.key === 'Enter' && createAndSave(e)}
              placeholder="New collection"
              className="min-w-0 flex-1 rounded-sm border border-line bg-paper px-2 py-1 text-[0.8rem] text-ink focus:border-pine"
            />
            <button
              onClick={createAndSave}
              disabled={creating || !newName.trim()}
              aria-label="Create and save"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine text-paper disabled:opacity-50"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}