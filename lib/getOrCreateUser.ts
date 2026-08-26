import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from './db';
import { User, Collection, type UserDoc } from './models';
import type { Types } from 'mongoose';

export type AppUser = UserDoc & { _id: Types.ObjectId };

/**
 * Returns the app's own User document for the currently signed-in Clerk session,
 * creating it on first call if it doesn't exist yet.
 *
 * This is the primary sync mechanism for Phase 1 — simpler and more reliable for
 * an MVP than depending on webhook delivery. The webhook at
 * app/api/webhooks/clerk/route.ts is a secondary, production-hardening sync path
 * (keeps email/name updates and deletions in sync even if the user never hits a
 * route that calls this function).
 *
 * Returns null if there's no signed-in user — callers should treat that as
 * "anonymous", not an error, since anonymous search is allowed by design.
 */
export async function getOrCreateUser(): Promise<AppUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectToDatabase();

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${clerkUser.id} has no email address on file.`);
  }

  const existing = await User.findOne({ authId: clerkUser.id });
  if (existing) return existing as AppUser;

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

  const created = await User.create({
    authId: clerkUser.id,
    email,
    name,
  });

  // Every account gets one default collection to save finds into — created
  // here rather than lazily on first heart-click, so there's never a race
  // between "user exists" and "their default collection exists".
  await Collection.create({
    userId: created._id,
    name: 'Saved finds',
    isDefault: true,
  });

  return created as AppUser;
}

/** Whether this user still needs to go through the onboarding step. */
export function needsOnboarding(user: AppUser): boolean {
  return user.interests.length === 0;
}