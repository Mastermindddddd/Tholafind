import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const CollectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Every account gets one of these automatically (Phase 5) so searches are
    // never lost even if the user never manually organizes anything.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export type CollectionDoc = InferSchemaType<typeof CollectionSchema> & { _id: Types.ObjectId };

export const Collection: Model<CollectionDoc> =
  models.Collection || model<CollectionDoc>('Collection', CollectionSchema);

const CollectionItemSchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    searchResultId: { type: Schema.Types.ObjectId, ref: 'SearchResult', required: true },
  },
  { timestamps: true }
);

// A given result can only be saved once per collection.
CollectionItemSchema.index({ collectionId: 1, searchResultId: 1 }, { unique: true });

export type CollectionItemDoc = InferSchemaType<typeof CollectionItemSchema> & { _id: Types.ObjectId };

export const CollectionItem: Model<CollectionItemDoc> =
  models.CollectionItem || model<CollectionItemDoc>('CollectionItem', CollectionItemSchema);
