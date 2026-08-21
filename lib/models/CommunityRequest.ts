import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose';

// Embedded, not a separate collection — answers are always read alongside their
// parent request, and there's rarely more than a handful per request.
const CommunityAnswerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    markedHelpful: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CommunityRequestSchema = new Schema(
  {
    searchId: { type: Schema.Types.ObjectId, ref: 'Search', required: true, unique: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    answers: { type: [CommunityAnswerSchema], default: [] },
  },
  { timestamps: true }
);

export type CommunityRequestDoc = InferSchemaType<typeof CommunityRequestSchema> & {
  _id: Types.ObjectId;
};

export const CommunityRequest: Model<CommunityRequestDoc> =
  models.CommunityRequest || model<CommunityRequestDoc>('CommunityRequest', CommunityRequestSchema);
