import 'server-only';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { ExtensionToken } from '@/lib/models/ExtensionToken';

const TOKEN_PREFIX = 'tf_ext_';
const MAX_ACTIVE_TOKENS_PER_USER = 5;
const TOUCH_EVERY_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Mints a new pairing token for a user. The plaintext is returned ONCE and
 * never stored. Keeps at most 5 active tokens per user (oldest are revoked)
 * so repeated pairing attempts don't pile up.
 */
export async function createExtensionToken(
  userId: Types.ObjectId,
  label?: string
): Promise<string> {
  const token = `${TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
  await ExtensionToken.create({
    userId,
    tokenHash: hashToken(token),
    label: label?.slice(0, 80),
  });

  const active = await ExtensionToken.find({ userId, revokedAt: null })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean();
  const surplus = active.slice(MAX_ACTIVE_TOKENS_PER_USER);
  if (surplus.length > 0) {
    await ExtensionToken.updateMany(
      { _id: { $in: surplus.map((t) => t._id) } },
      { $set: { revokedAt: new Date() } }
    );
  }
  return token;
}

function readBearer(request: Request): string | null {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer (tf_ext_[A-Za-z0-9_-]{20,100})$/);
  return match ? match[1] : null;
}

/** Resolves the Bearer token on an extension request to a user, or null. */
export async function authenticateExtension(
  request: Request
): Promise<{ userId: Types.ObjectId; tokenId: Types.ObjectId } | null> {
  const token = readBearer(request);
  if (!token) return null;

  const doc = await ExtensionToken.findOne({ tokenHash: hashToken(token), revokedAt: null });
  if (!doc) return null;

  // Avoid a write on every request.
  if (!doc.lastUsedAt || Date.now() - doc.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
    doc.lastUsedAt = new Date();
    await doc.save().catch(() => undefined);
  }
  return { userId: doc.userId, tokenId: doc._id };
}

export async function revokeExtensionToken(request: Request): Promise<boolean> {
  const token = readBearer(request);
  if (!token) return false;
  const res = await ExtensionToken.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return res.modifiedCount > 0;
}