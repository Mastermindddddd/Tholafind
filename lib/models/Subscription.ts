import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    stripeCustomerId: { type: String, required: true, unique: true, index: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'],
      default: 'incomplete',
    },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema> & { _id: Types.ObjectId };

export const Subscription: Model<SubscriptionDoc> =
  models.Subscription || model<SubscriptionDoc>('Subscription', SubscriptionSchema);
