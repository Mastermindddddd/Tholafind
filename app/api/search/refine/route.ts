import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Search } from '@/lib/models';
import { getOrCreateUser } from '@/lib/getOrCreateUser';
import { runSearch } from '@/lib/search/runSearch';
import { prepareImage } from '@/lib/search/imageSignals';
import { checkSearchRateLimit } from '@/lib/rateLimit/checkSearchRateLimit';

export const dynamic = 'force-dynamic';
// Same reasoning as /api/upload — a full re-run of the multi-source search
// needs more than the default serverless timeout.
export const maxDuration = 60;

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_IMAGES = 3; // matches the Search schema's own validation

/**
 * Phase 4's core action: given an existing search (typically one that came
 * back 'low_confidence' or 'failed'), add a second photo — a different
 * angle, a tag close-up — and/or a text hint, then re-run the full search
 * so the person gets one clean, improved result set rather than starting
 * a whole new hunt from scratch.
 *
 * Known scope limitation, stated plainly rather than silently: this route
 * doesn't check that the caller owns the search. Anyone who knows a
 * searchId (a MongoDB ObjectId — not realistically guessable, but not a
 * secret either) could refine it. Given searches aren't private/sensitive
 * data in this app, that's an acceptable MVP tradeoff — but if that
 * changes, add an ownership check here (Search.userId must match the
 * signed-in user, or the search must be anonymous).
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Cost/abuse protection, not a pricing lever — refine triggers a full
    // re-run of the multi-source search, the same provider cost as a fresh
    // upload, so it's checked against the same daily cap. See
    // checkSearchRateLimit.ts.
    const user = await getOrCreateUser();
    const rateLimit = await checkSearchRateLimit(request, user?._id ?? null);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "You've made a lot of searches very quickly — try again in a few hours.",
        },
        { status: 429 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let searchId: string | null = null;
    let file: File | null = null;
    let hint: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const idRaw = formData.get('searchId');
      searchId = typeof idRaw === 'string' ? idRaw : null;

      const fileRaw = formData.get('file');
      if (fileRaw instanceof File && fileRaw.size > 0) file = fileRaw;

      const hintRaw = formData.get('hint');
      if (typeof hintRaw === 'string' && hintRaw.trim().length > 0) {
        hint = hintRaw.trim().slice(0, 280);
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      searchId = typeof body.searchId === 'string' ? body.searchId : null;
      if (typeof body.hint === 'string' && body.hint.trim().length > 0) {
        hint = body.hint.trim().slice(0, 280);
      }
      // No file path over JSON — refining with a new photo always goes
      // through multipart/form-data, same as the original upload.
    } else {
      return NextResponse.json(
        { ok: false, message: 'Expected multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    if (!searchId || !Types.ObjectId.isValid(searchId)) {
      return NextResponse.json({ ok: false, message: 'Missing or invalid searchId.' }, { status: 400 });
    }

    if (!file && !hint) {
      return NextResponse.json(
        { ok: false, message: 'Add a photo, a hint, or both — nothing to refine with otherwise.' },
        { status: 400 }
      );
    }

    const search = await Search.findById(searchId);
    if (!search) {
      return NextResponse.json({ ok: false, message: 'Search not found.' }, { status: 404 });
    }

    if (file) {
      if (search.images.length >= MAX_IMAGES) {
        return NextResponse.json(
          { ok: false, message: `You've already added the maximum of ${MAX_IMAGES} photos to this hunt.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { ok: false, message: `Unsupported file type "${file.type}". Try a JPEG, PNG, WEBP, or HEIC photo.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { ok: false, message: 'That photo is too large — try one under 8MB.' },
          { status: 400 }
        );
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { ok: false, message: 'Image storage is not configured (BLOB_READ_WRITE_TOKEN missing).' },
          { status: 500 }
        );
      }

      // Same privacy + quality handling as the first upload (see /api/upload).
      const prepared = await prepareImage(file);
      if (!prepared.stripped && prepared.signals.hadLocation) {
        return NextResponse.json(
          {
            ok: false,
            message: "We couldn't process that photo's format — try a JPEG or PNG version.",
          },
          { status: 400 }
        );
      }

      const blobPath = `hunts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${prepared.extension}`;
      const blob = await put(blobPath, prepared.body, {
        access: 'public',
        contentType: prepared.contentType,
      });

      search.images.push(blob.url);
      search.imageSignals.push({ url: blob.url, ...prepared.signals });
    }

    if (hint) {
      search.hint = hint;
    }

    search.status = 'pending';
    await search.save();

    // Awaited, not fire-and-forget: the client shows a "Rescanning…" state
    // and expects the response to mean the refined results are ready.
    await runSearch(String(search._id));

    return NextResponse.json({
      ok: true,
      searchId: search._id,
      imageCount: search.images.length,
    });
  } catch (err) {
    console.error('[search/refine] failed:', err);
    const message =
      err instanceof Error && /querySrv|ETIMEOUT|ENOTFOUND|ECONNREFUSED/.test(err.message)
        ? 'Could not reach the database. Check MONGODB_URI and your network connection.'
        : 'That refine didn’t go through. Try again in a moment.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}