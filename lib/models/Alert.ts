import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

// Each time checkAlert finds a change, it appends one of these rather than
// firing a fleeting one-off notification — so alert history is visible in
// the UI, not just a transient email.
const AlertNotificationSchema = new Schema(
  {
    type: { type: String, enum: ['price_drop', 'new_listing'], required: true },
    searchResultId: { type: Schema.Types.ObjectId, ref: 'SearchResult' },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const AlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    searchId: { type: Schema.Types.ObjectId, ref: 'Search', required: true },
    // 'watch' is what the UI actually creates — one toggle per hunt,
    // covering both price drops and new listings in a single alert rather
    // than exposing separate granular controls. 'price_drop'/'new_listing'
    // remain in the schema for a possible future finer-grained UI, but
    // nothing creates them yet.
    kind: { type: String, enum: ['price_drop', 'new_listing', 'watch'], default: 'watch' },
    active: { type: Boolean, default: true },
    // Cheap diffing target for the scheduled job — only notify on results
    // not already in this list.
    lastSeenResultIds: { type: [Schema.Types.ObjectId], default: [] },
    lastCheckedAt: { type: Date },
    notifications: { type: [AlertNotificationSchema], default: [] },
    // Everything in `notifications` created after this is "unread" — a
    // single cursor is simpler than a read flag per notification, and the
    // only place this matters is a small unread-count badge.
    seenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

AlertSchema.index({ active: 1, lastCheckedAt: 1 });
// One alert per user per hunt — toggling "watch this" twice shouldn't
// create duplicate tracking rows.
AlertSchema.index({ userId: 1, searchId: 1 }, { unique: true });

export type AlertDoc = InferSchemaType<typeof AlertSchema> & { _id: Types.ObjectId };

export const Alert: Model<AlertDoc> = models.Alert || model<AlertDoc>('Alert', AlertSchema);