import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * eBay's Marketplace Account Deletion/Closure compliance endpoint. Required
 * for Production keyset approval whether or not an app actually stores
 * eBay-account-linked data — Tholafind doesn't (we only store generic
 * listing search results, never eBay user accounts or buyer PII), so the
 * POST handler below has nothing to actually delete. It still has to exist
 * and respond correctly, or eBay won't approve Production access.
 *
 * Two things eBay is strict about that are easy to get wrong (both
 * confirmed against real developer reports, not just the official docs,
 * since the docs are known to be misleading on the hash encoding):
 *
 * 1. The response must be a raw lowercase hex SHA-256 digest — not base64,
 *    not uppercase. `createHash('sha256').update(...).digest('hex')`
 *    already produces this correctly.
 * 2. The `endpoint` string hashed below must be BYTE-FOR-BYTE identical to
 *    the URL you type into the eBay dashboard field. It's read from
 *    EBAY_NOTIFICATION_ENDPOINT_URL specifically (rather than reconstructed
 *    from request headers) to avoid mismatches from proxies/redirects — set
 *    that env var to the exact URL you paste into eBay's dashboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeCode = searchParams.get('challenge_code');

  if (!challengeCode) {
    return NextResponse.json({ ok: false, message: 'Missing challenge_code.' }, { status: 400 });
  }

  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;
  const endpoint = process.env.EBAY_NOTIFICATION_ENDPOINT_URL;

  if (!verificationToken || !endpoint) {
    return NextResponse.json(
      { ok: false, message: 'EBAY_VERIFICATION_TOKEN or EBAY_NOTIFICATION_ENDPOINT_URL not set.' },
      { status: 500 }
    );
  }

  const challengeResponse = createHash('sha256')
    .update(challengeCode + verificationToken + endpoint)
    .digest('hex');

  return NextResponse.json({ challengeResponse });
}

/**
 * The actual deletion notifications, once subscribed. eBay expects a 200
 * regardless of payload details to consider the notification acknowledged
 * — and expects to be able to send up to ~1500/day, so this stays cheap
 * and fast rather than doing real work inline.
 *
 * If Tholafind ever does store eBay-account-linked data in the future
 * (e.g. a "connect your eBay account" feature), this is the place to parse
 * notification.data.username / .userId / .eiasToken and purge it — see
 * eBay's docs for the payload shape before adding that.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[ebay-deletion] notification received:', JSON.stringify(body).slice(0, 500));
  } catch {
    // Even a malformed body shouldn't fail the acknowledgment — eBay will
    // just retry, and we have nothing to lose by acking a bad payload.
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}