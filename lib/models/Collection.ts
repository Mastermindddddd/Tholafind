import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const CollectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export type CollectionDoc = InferSchemaType<typeof CollectionSchema> & { _id: Types.ObjectId };

export const Collection: Model<CollectionDoc> =
  models.Collection || model<CollectionDoc>('Collection', CollectionSchema);

/**
 * itemType + itemId replaces the old hard SearchResult-only reference, so
 * a save can point at either a SearchResult (from a user's hunt) or a
 * DiscoveryItem (from the daily /browse feed) without two parallel
 * schemas. `searchResultId` is kept, deprecated, for backward
 * compatibility with existing documents and any code not yet migrated —
 * see migration note below. New writes should use itemType/itemId only.
 */
const CollectionItemSchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },

    itemType: { type: String, enum: ['SearchResult', 'DiscoveryItem'], required: true },
    itemId: { type: Schema.Types.ObjectId, required: true },

    // Deprecated: superseded by itemType/itemId above. Kept so existing
    // CollectionItem documents (written before this migration) still read
    // back correctly without a data backfill. Do not write to this field
    // in new code — see migration note in Collection.ts's export block.
    searchResultId: { type: Schema.Types.ObjectId, ref: 'SearchResult' },
  },
  { timestamps: true }
);

CollectionItemSchema.index({ collectionId: 1, itemType: 1, itemId: 1 }, { unique: true });

export type CollectionItemDoc = InferSchemaType<typeof CollectionItemSchema> & { _id: Types.ObjectId };

export const CollectionItem: Model<CollectionItemDoc> =
  models.CollectionItem || model<CollectionItemDoc>('CollectionItem', CollectionItemSchema);