import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

// Must not be statically optimized — a cached response would mean this route
// stops actually testing the database after the first build.
export const dynamic = 'force-dynamic';

/**
 * Dev-only sanity check for the Phase 0 deliverable: "a user can be created, a
 * document can be written and read from Atlas." Not meant to ship to production —
 * it writes and then immediately deletes a throwaway user document.
 *
 * Usage: GET /api/dev/seed-check
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, message: 'Disabled in production.' }, { status: 404 });
  }

  try {
    await connectToDatabase();

    const throwawayEmail = `seed-check-${Date.now()}@tholafind.dev`;

    const created = await User.create({
      authId: `seed-check-${Date.now()}`,
      email: throwawayEmail,
      name: 'Seed Check',
    });

    const found = await User.findById(created._id).lean();

    await User.deleteOne({ _id: created._id });

    return NextResponse.json({
      ok: true,
      message: 'Wrote and read a User document successfully, then cleaned it up.',
      wroteId: created._id,
      readBack: found,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}
