import 'server-only';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { DiscoveryItem } from '@/lib/models';
import { searchEbay } from '@/lib/search/providers/ebay';
import { searchEtsy } from '@/lib/search/providers/etsy';
import { searchGoogleShopping } from './providers/googleShopping';
import { todaysQueries } from './categories';
import type { RawCandidate } from '@/lib/search/types';

function dedupeKey(sourceKind: string, url: string): string {
  return crypto.createHash('sha1').update(`${sourceKind}:${url}`).digest('hex');
}

/**
 * Daily discovery ingestion. Runs each of today's queries across all three
 * providers in parallel, drops anything without a real price, upserts by
 * dedupeKey, and marks items that weren't seen in any recent run inactive.
 *
 * Never throws for a single provider/query failure — same philosophy as
 * runSearch.ts. Only throws on a DB-level failure.
 */
export async function ingestDiscoveryItems(): Promise<{ upserted: number; deactivated: number }> {
  await connectToDatabase();

  const queries = todaysQueries();
  const allCandidates: { category: string; candidate: RawCandidate }[] = [];

  await Promise.all(
    queries.map(async ({ category, query }) => {
      const [ebay, etsy, shopping] = await Promise.allSettled([
        searchEbay(query),
        searchEtsy(query),
        searchGoogleShopping(query),
      ]);

      for (const settled of [ebay, etsy, shopping]) {
        if (settled.status === 'fulfilled') {
          for (const candidate of settled.value) {
            allCandidates.push({ category, candidate });
          }
        } else {
          console.error(`[discovery] provider failed for "${query}":`, settled.reason);
        }
      }
    })
  );

  // Price is mandatory for the browse feed — drop anything without one.
  const priced = allCandidates.filter(({ candidate }) => Boolean(candidate.price));

  const seenKeys = new Set<string>();
  const now = new Date();

  const ops = priced
    .filter(({ candidate }) => {
      const key = dedupeKey(candidate.sourceKind, candidate.url);
      if (seenKeys.has(key)) return false; // same item surfaced by >1 query today
      seenKeys.add(key);
      return true;
    })
    .map(({ category, candidate }) => {
      const key = dedupeKey(candidate.sourceKind, candidate.url);
      return {
        updateOne: {
          filter: { dedupeKey: key },
          update: {
            $set: {
              title: candidate.title,
              image: candidate.image,
              price: candidate.price,
              url: candidate.url,
              source: candidate.source,
              sourceKind: candidate.sourceKind,
              category,
              fetchedAt: now,
              active: true,
              metadata: candidate.metadata ?? {},
            },
            $setOnInsert: { dedupeKey: key, saveCount: 0 },
          },
          upsert: true,
        },
      };
    });

  let upserted = 0;
  if (ops.length > 0) {
    const result = await DiscoveryItem.bulkWrite(ops);
    upserted = result.upsertedCount + result.modifiedCount;
  }

  // Items not refreshed in 14 days are retired from the feed rather than
  // deleted — keeps history if you want it later, just stops surfacing.
  const staleCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const deactivateResult = await DiscoveryItem.updateMany(
    { active: true, fetchedAt: { $lt: staleCutoff } },
    { $set: { active: false } }
  );

  return { upserted, deactivated: deactivateResult.modifiedCount };
}