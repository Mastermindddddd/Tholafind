import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * Purely a cost/abuse guard, not a pricing lever — see
 * lib/rateLimit/checkSearchRateLimit.ts for the reasoning. Applies the same
 * to free and Plus accounts alike, since it protects against a compromised
 * or scripted account running up real provider costs (SerpApi/eBay/Etsy/
 * Replicate calls), not against a real person searching a lot.
 */
const SearchRateLimitSchema = new Schema({
  // 'user:<mongo id>' for signed-in accounts, 'ip:<hash>' for anonymous
  // visitors — a single field covers both without a nullable-field split.
  identityKey: { type: String, required: true },
  // UTC calendar day, e.g. "2026-08-30" — simpler and more predictable
  // than a rolling 24h window, at the cost of a hard reset at midnight UTC
  // rather than exactly 24h after the first search of the day.
  day: { type: String, required: true },
  count: { type: Number, default: 0 },
});

SearchRateLimitSchema.index({ identityKey: 1, day: 1 }, { unique: true });

export type SearchRateLimitDoc = InferSchemaType<typeof SearchRateLimitSchema>;

export const SearchRateLimit: Model<SearchRateLimitDoc> =
  models.SearchRateLimit || model<SearchRateLimitDoc>('SearchRateLimit', SearchRateLimitSchema);