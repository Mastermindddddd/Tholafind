import 'server-only';
import { User } from '@/lib/models';
import type { Types } from 'mongoose';

/**
 * Sends a plain notification email via Resend's HTTP API. Skipped
 * gracefully (logged, not thrown) if RESEND_API_KEY isn't set — same
 * pattern as the search providers in lib/search/providers/, so a search
 * without every optional integration configured still works correctly,
 * just without that one feature.
 *
 * Requires a domain verified with Resend for RESEND_FROM_EMAIL; there's no
 * way to know that domain ahead of time, so it's read from env rather than
 * hardcoded.
 */
export async function sendAlertEmail(
  userId: Types.ObjectId,
  reference: string,
  messages: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn('[sendAlertEmail] RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping email.');
    return;
  }
  if (messages.length === 0) return;

  const user = await User.findById(userId).select('email').lean();
  if (!user?.email) return;

  const subject =
    messages.length === 1
      ? `Update on hunt #${reference}`
      : `${messages.length} updates on hunt #${reference}`;

  const text = [
    `Your hunt #${reference} has an update:`,
    '',
    ...messages.map((m) => `\u2022 ${m}`),
    '',
    'Open Tholafind to see the full results.',
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`[sendAlertEmail] Resend request failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    // A failed notification email should never take down the alert check
    // that triggered it — the notification is already saved in-app either way.
    console.error('[sendAlertEmail] failed:', err);
  }
}