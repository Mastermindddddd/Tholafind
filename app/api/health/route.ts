import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// Must not be statically optimized — this route hits the database on every call.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const state = mongoose.connection.readyState; // 1 = connected
    return NextResponse.json({
      ok: state === 1,
      db: state === 1 ? 'connected' : 'not connected',
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: 'error', message: (err as Error).message },
      { status: 503 }
    );
  }
}
