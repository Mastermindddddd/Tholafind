import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

// What we know about one uploaded photo beyond its pixels (see lib/search/imageSignals.ts).
// GPS coordinates are deliberately never stored, only whether the original had any.
const ImageSignalSchema = new Schema(
  {
    url: { type: String, required: true },
    analyzed: { type: Boolean, default: false },
    brand: { type: String, trim: true },
    tagText: { type: [String], default: [] },
    modelCodes: { type: [String], default: [] },
    material: { type: String, trim: true },
    color: { type: String, trim: true },
    itemType: { type: String, trim: true },
    designCues: { type: [String], default: [] },
    quality: { type: String, enum: ['good', 'fair', 'poor'], default: 'good' },
    qualityIssues: { type: [String], default: [] },
    exif: {
      type: new Schema(
        { make: String, model: String, takenAt: String },
        { _id: false }
      ),
    },
    hadLocation: { type: Boolean },
  },
  { _id: false }
);

// Why the best match is weak and which details would help most.
const DiagnosisSchema = new Schema(
  {
    explanation: { type: String, required: true },
    missing: { type: [String], enum: ['brand', 'tag', 'material', 'color', 'angle'], default: [] },
  },
  { _id: false }
);

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

    // Per-photo extracted signals: tag text, brand, material, design cues, quality, EXIF summary.
    imageSignals: { type: [ImageSignalSchema], default: [] },

    // Set by runSearch when the best match is weak; cleared when a rerun finds a strong one.
    diagnosis: { type: DiagnosisSchema },

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