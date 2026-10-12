/**
 * Pure ranking for the /browse feed (no database, no server-only), so it can
 * be unit tested. getCuratedResults.ts fetches the pool and calls this.
 *
 * Each item gets a score from:
 *   - a per-day pseudo-random value: same order for everyone today, a new
 *     order tomorrow ("random items that change every day")
 *   - popularity: save count, log-scaled so a few saves matter but one viral
 *     item can't own the page
 *   - freshness: newer ingests rank a little higher
 *   - personal interest (only for users with history): overlap between the
 *     item's title/category and what the user searched for and saved
 *
 * The more history a user has, the more weight personal interest gets (15% for
 * a brand-new user, up to 60% for a heavy one), so even personalised feeds
 * keep a large share of "today's popular drop" for discovery.
 */

export interface Interests {
  /** word -> weight, built from the user's hints, brands, top results and saves */
  keywords: Record<string, number>;
  /** DiscoveryItem.category -> weight, from saved items */
  categories: Record<string, number>;
  sourceKinds: Record<string, number>;
  /** 0..1: how much history we have. 0 means don't personalise. */
  strength: number;
}

export interface FeedItem {
  _id: unknown;
  title: string;
  category?: string | null;
  sourceKind: string;
  saveCount?: number | null;
  fetchedAt?: Date | string | null;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'new', 'used', 'size', 'free', 'shipping', 'sale', 'item', 'set',
  'pack', 'pair', 'men', 'mens', 'women', 'womens', 'unisex', 'online', 'shop', 'buy',
]);

export function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const t of text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')) {
    if (t.length > 2 && !STOP_WORDS.has(t)) out.add(t);
  }
  return [...out];
}

/** Deterministic 0..1 value for a string (FNV-1a + a murmur-style finaliser). */
export function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const POPULARITY_CAP = 50;
const FRESH_DAYS = 14; // matches the ingest job's retirement window

export function rankFeed<T extends FeedItem>(
  pool: T[],
  opts: { limit: number; dayKey: string; interests?: Interests | null; now?: Date }
): T[] {
  const { limit, dayKey } = opts;
  const now = (opts.now ?? new Date()).getTime();
  const interests = opts.interests && opts.interests.strength > 0 ? opts.interests : null;
  const personalWeight = interests ? 0.15 + 0.45 * interests.strength : 0;
  const baseWeight = 1 - personalWeight;

  // Raw personal affinity per item, normalised against the best item in the pool.
  const raw = pool.map((item) => {
    if (!interests) return { kw: 0, cat: 0, kind: 0 };
    let kw = 0;
    for (const t of tokenize(`${item.title} ${item.category ?? ''}`)) kw += interests.keywords[t] ?? 0;
    return {
      kw,
      cat: item.category ? interests.categories[item.category] ?? 0 : 0,
      kind: interests.sourceKinds[item.sourceKind] ?? 0,
    };
  });
  const maxKw = Math.max(1e-9, ...raw.map((r) => r.kw));
  const maxCat = Math.max(1e-9, ...raw.map((r) => r.cat));
  const maxKind = Math.max(1e-9, ...raw.map((r) => r.kind));

  const scored = pool.map((item, i) => {
    const id = String(item._id);
    const daily = hashUnit(`${dayKey}:${id}`);
    const popularity =
      Math.log1p(Math.min(item.saveCount ?? 0, POPULARITY_CAP)) / Math.log1p(POPULARITY_CAP);
    const fetched = item.fetchedAt ? new Date(item.fetchedAt).getTime() : NaN;
    const ageDays = Number.isFinite(fetched) ? (now - fetched) / 86_400_000 : FRESH_DAYS / 2;
    const fresh = Math.max(0, Math.min(1, 1 - ageDays / FRESH_DAYS));
    const personal = interests
      ? 0.55 * (raw[i].kw / maxKw) + 0.3 * (raw[i].cat / maxCat) + 0.15 * (raw[i].kind / maxKind)
      : 0;

    const score =
      baseWeight * (0.55 * daily + 0.3 * popularity + 0.15 * fresh) + personalWeight * personal;
    return { item, id, score };
  });

  scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));

  // Diversity: no single category should dominate. The cap adapts to how many
  // categories exist, so a small catalogue can still fill the whole page
  // (a fixed cap of 3 starves the feed when there are only a few categories).
  const categoryOf = (item: T) => item.category || 'other';
  const distinct = new Set(scored.map((s) => categoryOf(s.item))).size || 1;
  const cap = Math.max(3, Math.ceil(limit / distinct) + 1);

  const counts = new Map<string, number>();
  const picked: T[] = [];
  const skipped: T[] = [];
  for (const { item } of scored) {
    if (picked.length >= limit) break;
    const c = counts.get(categoryOf(item)) ?? 0;
    if (c >= cap) {
      skipped.push(item);
      continue;
    }
    counts.set(categoryOf(item), c + 1);
    picked.push(item);
  }
  // Still short (rare): relax the cap rather than show a half-empty page.
  for (const item of skipped) {
    if (picked.length >= limit) break;
    picked.push(item);
  }
  return picked;
}