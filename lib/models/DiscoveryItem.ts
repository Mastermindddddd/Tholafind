import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

/**
 * Powers the public /browse feed independently of user search activity.
 * Populated once a day by the cron job at app/api/cron/discover/route.ts,
 * via lib/discovery/ingestDiscoveryItems.ts — not written to by
 * runSearch.ts or the upload/refine routes at all.
 *
 * `dedupeKey` (a hash of sourceKind + url) is the upsert key — running
 * ingestion again the same day updates fetchedAt/price on items still
 * found rather than creating duplicates.
 */
const DiscoveryItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    // Required, unlike SearchResult.price — discovery items without a
    // parseable price are filtered out before insert (see
    // ingestDiscoveryItems.ts), so the schema enforces the same guarantee
    // the UI depends on.
    price: { type: String, required: true, trim: true },
    url: { type: String, required: true },

    source: { type: String, required: true, trim: true }, // "eBay", "Etsy Vintage", hostname for retail
    sourceKind: { type: String, enum: ['retail', 'resale', 'vintage'], required: true },

    // Loose browse-facing grouping, independent of sourceKind — lets you
    // balance "sneakers" against "home decor" regardless of which
    // marketplace they came from. Drawn from lib/discovery/categories.ts.
    category: { type: String, required: true, trim: true, index: true },

    dedupeKey: { type: String, required: true, unique: true },

    fetchedAt: { type: Date, required: true, default: Date.now },
    // False once an item ages out or stops appearing in re-ingestion —
    // soft-deleted rather than removed, so save/collection references to
    // it don't dangle.
    active: { type: Boolean, required: true, default: true, index: true },

    // Feedback loop: incremented in app/api/collections/items/route.ts
    // when someone saves a discovery item, decremented on un-save. Used
    // as a ranking signal in getCuratedResults.
    saveCount: { type: Number, default: 0 },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

DiscoveryItemSchema.index({ active: 1, fetchedAt: -1 });
DiscoveryItemSchema.index({ active: 1, category: 1, fetchedAt: -1 });
DiscoveryItemSchema.index({ active: 1, sourceKind: 1, fetchedAt: -1 });

export type DiscoveryItemDoc = InferSchemaType<typeof DiscoveryItemSchema> & { _id: Types.ObjectId };

export const DiscoveryItem: Model<DiscoveryItemDoc> =
  models.DiscoveryItem || model<DiscoveryItemDoc>('DiscoveryItem', DiscoveryItemSchema);