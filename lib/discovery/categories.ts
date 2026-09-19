import 'server-only';

/**
 * Query pool for daily ingestion. Deliberately broad and mixed across
 * sourceKinds so a day's browse feed doesn't skew entirely retail or
 * entirely vintage.
 */
export interface DiscoveryQuery {
  category: string;
  query: string;
}

export const DISCOVERY_QUERIES: DiscoveryQuery[] = [
  { category: 'Home decor', query: 'mid-century modern home decor' },
  { category: 'Sneakers', query: 'rare vintage sneakers' },
  { category: 'Jewelry', query: 'handmade sterling silver jewelry' },
  { category: 'Vinyl & music', query: 'vintage vinyl records' },
  { category: 'Furniture', query: 'vintage wood furniture' },
  { category: 'Outerwear', query: 'vintage leather jacket' },
  { category: 'Kitchenware', query: 'vintage ceramic kitchenware' },
  { category: 'Watches', query: 'vintage wristwatch' },
  { category: 'Denim', query: 'vintage denim jacket' },
  { category: 'Art & prints', query: 'original art print poster' },
  { category: 'Bags', query: 'vintage leather handbag' },
  { category: 'Toys & collectibles', query: 'vintage toy collectible' },
  { category: 'Outdoor gear', query: 'vintage camping gear' },
  { category: 'Glassware', query: 'vintage glassware set' },
];

/**
 * Deterministic daily slice: same day → same queries for every visitor
 * (and for re-runs if the cron retries), rotating through the whole pool
 * over time rather than hitting every query every day.
 */
export function todaysQueries(count = 8): DiscoveryQuery[] {
  const dayIndex = Math.floor(Date.now() / 86_400_000); // days since epoch
  const start = dayIndex % DISCOVERY_QUERIES.length;
  const picked: DiscoveryQuery[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(DISCOVERY_QUERIES[(start + i) % DISCOVERY_QUERIES.length]);
  }
  return picked;
}