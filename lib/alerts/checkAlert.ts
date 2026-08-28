import 'server-only';
import { connectToDatabase } from '@/lib/db';
import { Alert, SearchResult, type AlertDoc } from '@/lib/models';
import { runSearch } from '@/lib/search/runSearch';
import { parsePrice } from './parsePrice';
import type { Types } from 'mongoose';

interface Snapshot {
  id: Types.ObjectId;
  url: string;
  title: string;
  price: string;
}

async function snapshotResults(searchId: Types.ObjectId): Promise<Snapshot[]> {
  const docs = await SearchResult.find({ searchId }).select('url title price').lean();
  return docs.map((d) => ({ id: d._id, url: d.url, title: d.title, price: d.price ?? '' }));
}

/**
 * Re-runs the full multi-source search for one alert's hunt and compares
 * the results against what was there before, appending a notification for
 * each genuine change:
 *   - a listing at a URL that wasn't present before (new_listing)
 *   - a listing whose parsed price dropped since last check (price_drop)
 *
 * Deliberately keyed by URL, not by SearchResult._id — runSearch clears and
 * rewrites SearchResult documents on every run (see Phase 4), so IDs never
 * survive a re-run even when the underlying listing is unchanged. URL is
 * the one stable identity a result has across search runs.
 *
 * Returns the number of notifications appended, so the caller (the cron
 * route) can log/aggregate without re-reading each alert.
 */
export async function checkAlert(alert: AlertDoc & { _id: Types.ObjectId }): Promise<number> {
  await connectToDatabase();

  const before = await snapshotResults(alert.searchId);
  const beforeByUrl = new Map(before.map((r) => [r.url, r]));

  await runSearch(String(alert.searchId));

  const after = await snapshotResults(alert.searchId);

  const fresh = await Alert.findById(alert._id);
  if (!fresh) return 0; // deleted mid-check — nothing to update

  let addedCount = 0;

  for (const result of after) {
    const previous = beforeByUrl.get(result.url);

    if (!previous) {
      fresh.notifications.push({
        type: 'new_listing',
        searchResultId: result.id,
        message: `New listing found: ${result.title} \u2014 ${result.price || 'price unavailable'}`,
      });
      addedCount++;
      continue;
    }

    const oldPrice = parsePrice(previous.price);
    const newPrice = parsePrice(result.price);
    if (oldPrice !== null && newPrice !== null && newPrice < oldPrice) {
      fresh.notifications.push({
        type: 'price_drop',
        searchResultId: result.id,
        message: `Price dropped on ${result.title}: ${previous.price} \u2192 ${result.price}`,
      });
      addedCount++;
    }
  }

  fresh.lastSeenResultIds = after.map((r) => r.id);
  fresh.lastCheckedAt = new Date();
  await fresh.save();

  return addedCount;
}