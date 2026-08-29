import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    paddleCustomerId: { type: String, unique: true, sparse: true },
    paddleSubscriptionId: { type: String, unique: true, sparse: true },
    // Paddle's exact status values (confirmed against the installed
    // @paddle/paddle-node-sdk's SubscriptionStatus type — 'incomplete'
    // doesn't exist in Paddle's model the way it did in Stripe's, since
    // there's no pre-created row waiting on a checkout to complete; a
    // Subscription document here doesn't exist at all until the first
    // webhook creates it).
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'paused', 'canceled'],
    },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema> & { _id: Types.ObjectId };

export const Subscription: Model<SubscriptionDoc> =
  models.Subscription || model<SubscriptionDoc>('Subscription', SubscriptionSchema);