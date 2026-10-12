// lib/browse/toFindResult.ts
import type { Types } from 'mongoose';
import type { SearchResultDoc, DiscoveryItemDoc } from '@/lib/models';
import type { FindResult } from '@/lib/types';
import { cleanPriceDisplay } from '@/lib/search/priceSanity';

export function toFindResultFromSearchResult(
  doc: SearchResultDoc & { _id: Types.ObjectId },
  savedResultIds: Set<string>
): FindResult {
  return {
    id: String(doc._id),
    itemType: 'SearchResult',
    title: doc.title,
    source: doc.source,
    sourceKind: doc.sourceKind,
    price: cleanPriceDisplay(doc.price) || 'See price on site',
    confidence: doc.confidence,
    matchScore: typeof doc.matchScore === 'number' ? doc.matchScore : undefined,
    matchReasons: doc.matchReasons ?? [],
    image: doc.image,
    url: doc.url,
    aspect: 1,
    saved: savedResultIds.has(String(doc._id)),
  };
}

export function toFindResultFromDiscoveryItem(
  doc: DiscoveryItemDoc & { _id: Types.ObjectId },
  savedResultIds: Set<string>
): FindResult {
  return {
    id: String(doc._id),
    itemType: 'DiscoveryItem',
    title: doc.title,
    source: doc.source,
    sourceKind: doc.sourceKind,
    price: cleanPriceDisplay(doc.price) || 'See price on site',
    confidence: 'exact',
    image: doc.image,
    url: doc.url,
    aspect: 1,
    saved: savedResultIds.has(String(doc._id)),
  };
}