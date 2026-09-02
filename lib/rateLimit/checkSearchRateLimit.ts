import 'server-only';
import { createHash } from 'crypto';
import { SearchRateLimit } from '@/lib/models';
import type { Types } from 'mongoose';

/**
 * Deliberately generous and deliberately NOT tier-based. This exists to
 * protect against a compromised or scripted account running up real
 * provider costs (SerpApi/eBay/Etsy/Replicate calls per search) — not to
 * ration search as a monetization lever. Search staying unlimited for any
 * real person is a core product promise (see the "No surprise paywalls"
 * section on the landing page); this cap is set well above what any real
 * usage pattern would hit; it exists so a single bad actor can't run the
 * provider bill up indefinitely, not to nudge anyone toward Plus.
 *
 * Same limit for free and Plus accounts — upgrading doesn't raise this
 * number, since raising it isn't what Plus is for.
 */
const DAILY_SEARCH_LIMIT = 20;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "2026-08-30"
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

/**
 * Best-effort client IP extraction for anonymous (signed-out) searches.
 * Vercel sets x-forwarded-for; falls back to a shared "unknown" bucket if
 * it's ever missing (e.g. local dev without a proxy) rather than throwing —
 * degrading to a shared bucket is an acceptable tradeoff for a guard this
 * generous, not a security boundary that needs to be airtight.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function identityKeyFor(request: Request, userId: Types.ObjectId | null): string {
  return userId ? `user:${userId}` : `ip:${hashIp(getClientIp(request))}`;
}

/**
 * Checks and atomically increments the caller's count for today in one
 * step — the increment happens regardless of whether the limit was already
 * hit, so a burst of rejected attempts doesn't let someone slip extra
 * searches in via a race condition.
 */
export async function checkSearchRateLimit(
  request: Request,
  userId: Types.ObjectId | null
): Promise<{ allowed: boolean }> {
  const identityKey = identityKeyFor(request, userId);
  const day = todayUTC();

  const doc = await SearchRateLimit.findOneAndUpdate(
    { identityKey, day },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return { allowed: (doc?.count ?? 0) <= DAILY_SEARCH_LIMIT };
}