// lib/browse/toFindResult.ts
import type { Types } from 'mongoose';
import type { SearchResultDoc, DiscoveryItemDoc } from '@/lib/models';
import type { FindResult } from '@/lib/types';

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
    price: doc.price || 'See price on site',
    confidence: doc.confidence,
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
    price: doc.price,
    confidence: 'exact',
    image: doc.image,
    url: doc.url,
    aspect: 1,
    saved: savedResultIds.has(String(doc._id)),
  };
}