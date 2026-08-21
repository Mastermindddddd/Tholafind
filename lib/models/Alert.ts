import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const AlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    searchId: { type: Schema.Types.ObjectId, ref: 'Search', required: true },
    kind: { type: String, enum: ['price_drop', 'new_listing'], required: true },
    active: { type: Boolean, default: true },
    // Cheap diffing target for the scheduled job in Phase 7 — only notify on
    // results not already in this list.
    lastSeenResultIds: { type: [Schema.Types.ObjectId], default: [] },
    lastCheckedAt: { type: Date },
  },
  { timestamps: true }
);

AlertSchema.index({ active: 1, lastCheckedAt: 1 });

export type AlertDoc = InferSchemaType<typeof AlertSchema> & { _id: Types.ObjectId };

export const Alert: Model<AlertDoc> = models.Alert || model<AlertDoc>('Alert', AlertSchema);
