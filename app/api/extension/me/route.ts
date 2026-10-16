import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authenticateExtension } from '@/lib/extension/auth';

export const dynamic = 'force-dynamic';

/** The extension popup calls this to show "Connected" vs "Reconnect". */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const ext = await authenticateExtension(request);
    if (!ext) return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[extension/me] failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}