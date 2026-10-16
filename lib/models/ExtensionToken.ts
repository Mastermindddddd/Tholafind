import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

/**
 * One row per browser the user has paired with the Tholafind extension.
 * Only a SHA-256 hash of the token is stored, so a database leak doesn't
 * expose working tokens. Tokens can be revoked (revokedAt) without deleting.
 */
const ExtensionTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    label: { type: String, trim: true, maxlength: 80 },
    lastUsedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

export type ExtensionTokenDoc = InferSchemaType<typeof ExtensionTokenSchema> & { _id: Types.ObjectId };

export const ExtensionToken: Model<ExtensionTokenDoc> =
  models.ExtensionToken || model<ExtensionTokenDoc>('ExtensionToken', ExtensionTokenSchema);