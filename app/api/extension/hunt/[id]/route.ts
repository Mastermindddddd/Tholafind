import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Search } from '@/lib/models';
import { runSearch } from '@/lib/search/runSearch';
import { checkSearchRateLimit } from '@/lib/rateLimit/checkSearchRateLimit';
import { authenticateExtension } from '@/lib/extension/auth';
import { streamHunt } from '@/lib/extension/streamHunt';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RouteContext {
  params: { id: string };
}

/**
 * Refines an existing hunt from the extension panel ("Brand guess: Stüssy",
 * "Material: leather"): body { hint }. Only the hunt's owner may do this.
 * Re-runs the search and streams progress like the create route.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const ext = await authenticateExtension(request);
    if (!ext) {
      return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ ok: false, message: 'Invalid hunt.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const hint =
      typeof body.hint === 'string' && body.hint.trim() ? body.hint.trim().slice(0, 280) : null;
    if (!hint) {
      return NextResponse.json({ ok: false, message: 'Add a detail to refine with.' }, { status: 400 });
    }

    const rateLimit = await checkSearchRateLimit(request, ext.userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, code: 'rate_limited', message: 'Too many searches — try again in a few hours.' },
        { status: 429 }
      );
    }

    const search = await Search.findById(params.id);
    if (!search || !search.userId || String(search.userId) !== String(ext.userId)) {
      return NextResponse.json({ ok: false, message: 'Hunt not found.' }, { status: 404 });
    }

    search.hint = hint;
    search.status = 'pending';
    await search.save();

    const searchId = String(search._id);
    return streamHunt(searchId, () => runSearch(searchId));
  } catch (err) {
    console.error('[extension/hunt/refine] failed:', err);
    return NextResponse.json({ ok: false, message: 'That refine didn’t go through.' }, { status: 500 });
  }
}