import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { createExtensionToken, revokeExtensionToken } from '@/lib/extension/auth';

export const dynamic = 'force-dynamic';

/**
 * POST — called by the /extension/connect page while the user is signed in on
 * the website. Mints a pairing token and returns it once; the page hands it to
 * the extension. Clerk session required (cookie), NOT the extension token.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Sign in first.' }, { status: 401 });
    }
    const token = await createExtensionToken(user._id, 'Browser extension');
    return NextResponse.json({ ok: true, token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[extension/token] failed:', err);
    return NextResponse.json({ ok: false, message: 'Could not connect the extension.' }, { status: 500 });
  }
}

/** DELETE — the extension's "Disconnect": revokes the token it authenticates with. */
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const revoked = await revokeExtensionToken(request);
    return NextResponse.json({ ok: revoked });
  } catch (err) {
    console.error('[extension/token] revoke failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}