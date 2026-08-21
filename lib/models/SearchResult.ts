import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const SearchResultSchema = new Schema(
  {
    searchId: { type: Schema.Types.ObjectId, ref: 'Search', required: true, index: true },

    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    price: { type: String, trim: true }, // display string, e.g. "$68" — currency handling is a later concern
    url: { type: String, required: true },

    source: { type: String, required: true, trim: true }, // e.g. "Etsy Vintage", "eBay"
    sourceKind: { type: String, enum: ['retail', 'resale', 'vintage'], required: true },

    // 0–1 similarity score from Atlas Vector Search, and the bucket it maps to for StampBadge.
    similarityScore: { type: Number, min: 0, max: 1, required: true },
    confidence: { type: String, enum: ['exact', 'close', 'guess'], required: true },

    // Deliberately loose: a resale listing might carry condition/seller rating,
    // a retail listing might carry stock status — no migration needed per source.
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SearchResultSchema.index({ searchId: 1, confidence: 1 });

export type SearchResultDoc = InferSchemaType<typeof SearchResultSchema> & { _id: Types.ObjectId };

export const SearchResult: Model<SearchResultDoc> =
  models.SearchResult || model<SearchResultDoc>('SearchResult', SearchResultSchema);
