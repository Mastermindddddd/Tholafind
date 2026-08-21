import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

/**
 * Secondary sync path to lib/getOrCreateUser.ts. That helper covers the common
 * case (a signed-in user hits a route that needs their User doc); this webhook
 * covers what it can't: email/name changes made outside the app, and account
 * deletions, so our data doesn't quietly drift from Clerk's over time.
 *
 * Requires CLERK_WEBHOOK_SECRET, set from the endpoint's signing secret in the
 * Clerk dashboard (Webhooks -> your endpoint -> Signing Secret). This route
 * itself must stay public — middleware.ts only protects /collections and
 * /onboarding, so no change is needed there, but double-check if that matcher
 * is ever tightened.
 */
export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { ok: false, message: 'CLERK_WEBHOOK_SECRET is not set.' },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, message: 'Missing svix headers.' }, { status: 400 });
  }

  const body = await request.text();

  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(signingSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid signature.' }, { status: 400 });
  }

  await connectToDatabase();

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const data = event.data as {
        id: string;
        email_addresses: { id: string; email_address: string }[];
        primary_email_address_id: string;
        first_name: string | null;
        last_name: string | null;
      };
      const email =
        data.email_addresses.find((e) => e.id === data.primary_email_address_id)
          ?.email_address ?? data.email_addresses[0]?.email_address;
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined;

      if (email) {
        await User.updateOne(
          { authId: data.id },
          { $set: { email, name } },
          { upsert: true }
        );
      }
      break;
    }
    case 'user.deleted': {
      const data = event.data as { id: string };
      await User.deleteOne({ authId: data.id });
      break;
    }
    default:
      // Other event types aren't relevant to Phase 1 — ignored, not an error.
      break;
  }

  return NextResponse.json({ ok: true });
}
