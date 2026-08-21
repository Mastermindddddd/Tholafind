import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const UserSchema = new Schema(
  {
    // The ID from the auth provider (Clerk, Auth.js, etc.) — Phase 1 wires this up.
    authId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    // What the user said they usually hunt for during onboarding (Phase 1) —
    // used to seed smarter default filters on the results page.
    interests: {
      type: [String],
      default: [],
      enum: ['fashion', 'furniture', 'vintage', 'homeware', 'other'],
    },
    // Incremented in Phase 6 whenever one of this user's CommunityAnswers is marked helpful.
    helpfulAnswerCount: { type: Number, default: 0 },
    tier: { type: String, enum: ['free', 'plus'], default: 'free' },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> = models.User || model<UserDoc>('User', UserSchema);
