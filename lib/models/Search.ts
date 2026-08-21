import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const SearchSchema = new Schema(
  {
    // Optional so anonymous, logged-out searches still work (Phase 1 principle:
    // never force signup before someone sees value).
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // One or more photo URLs (Blob/R2) attached to this hunt. Phase 2 starts with
    // one; Phase 4 allows a second angle / tag close-up to be added to the same search.
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length > 0 && arr.length <= 3,
        message: 'A search needs between 1 and 3 images.',
      },
    },

    // Optional text hint the user adds to narrow ambiguous matches (Phase 4).
    hint: { type: String, trim: true, maxlength: 280 },

    // The embedding vector generated in Phase 3, indexed via Atlas Vector Search
    // (created out-of-band in the Atlas UI / API, not through Mongoose).
    embedding: { type: [Number], select: false },

    status: {
      type: String,
      enum: ['pending', 'searching', 'complete', 'low_confidence', 'failed'],
      default: 'pending',
      index: true,
    },

    // A short, shareable reference shown in the UI (e.g. "Hunt log · #TF-2291").
    reference: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

SearchSchema.index({ userId: 1, createdAt: -1 });

export type SearchDoc = InferSchemaType<typeof SearchSchema> & { _id: Types.ObjectId };

export const Search: Model<SearchDoc> = models.Search || model<SearchDoc>('Search', SearchSchema);
