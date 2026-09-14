import type { Types } from 'mongoose';
import type { SearchResultDoc } from '@/lib/models';
import type { FindResult } from '@/lib/types';

export function toFindResult(
  doc: SearchResultDoc & { _id: Types.ObjectId },
  savedResultIds: Set<string>
): FindResult {
  return {
    id: String(doc._id),
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