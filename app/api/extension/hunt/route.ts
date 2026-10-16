import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/db';
import { Search } from '@/lib/models';
import { generateUniqueReference } from '@/lib/generateReference';
import { runSearch } from '@/lib/search/runSearch';
import { prepareImage } from '@/lib/search/imageSignals';
import { checkSearchRateLimit } from '@/lib/rateLimit/checkSearchRateLimit';
import { authenticateExtension } from '@/lib/extension/auth';
import { parseClientOcr, signalsFromClientOcr } from '@/lib/extension/clientOcr';
import { streamHunt } from '@/lib/extension/streamHunt';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Keep only a plausible hostname ("instagram.com"), never a full URL. */
function cleanHost(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const host = raw.trim().toLowerCase().replace(/^www\./, '').slice(0, 100);
  return /^[a-z0-9.-]+$/.test(host) && host.includes('.') ? host : undefined;
}

/**
 * Starts a hunt from the browser extension: one cropped/downloaded image,
 * optional text the extension already read from it, and the source hostname.
 * Authenticated with the extension's Bearer token. Responds with an NDJSON
 * stream (see lib/extension/streamHunt.ts) so the service worker never sits
 * 30s+ waiting for response headers.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const ext = await authenticateExtension(request);
    if (!ext) {
      return NextResponse.json(
        { ok: false, code: 'unauthorized', message: 'Reconnect the extension to your account.' },
        { status: 401 }
      );
    }

    const rateLimit = await checkSearchRateLimit(request, ext.userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: 'rate_limited',
          message: "You've made a lot of searches very quickly — try again in a few hours.",
        },
        { status: 429 }
      );
    }

    if (!(request.headers.get('content-type') || '').includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, message: 'Expected multipart/form-data.' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'No image provided.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, message: `Unsupported image type "${file.type}".` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, message: 'That image is too large.' }, { status: 400 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { ok: false, message: 'Image storage is not configured.' },
        { status: 500 }
      );
    }

    const hintRaw = formData.get('hint');
    const hint =
      typeof hintRaw === 'string' && hintRaw.trim() ? hintRaw.trim().slice(0, 280) : undefined;

    // Same privacy handling as web uploads: EXIF stripped, quality assessed.
    const prepared = await prepareImage(file);
    const blob = await put(
      `hunts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${prepared.extension}`,
      prepared.body,
      { access: 'public', contentType: prepared.contentType }
    );

    // Text the extension read in the browser. If it found something useful the
    // server skips its own (slower) OCR for this photo; otherwise server OCR runs.
    const clientSignals = signalsFromClientOcr(parseClientOcr(formData.get('ocr')));

    const reference = await generateUniqueReference();
    const search = await Search.create({
      userId: ext.userId,
      images: [blob.url],
      imageSignals: [
        { url: blob.url, ...prepared.signals, ...(clientSignals ?? {}), analyzed: !!clientSignals },
      ],
      hint,
      status: 'pending',
      reference,
      via: 'extension',
      sourceHost: cleanHost(formData.get('host')),
    });

    const searchId = String(search._id);
    return streamHunt(searchId, () => runSearch(searchId));
  } catch (err) {
    console.error('[extension/hunt] failed:', err);
    return NextResponse.json(
      { ok: false, message: 'That hunt didn’t start. Try again in a moment.' },
      { status: 500 }
    );
  }
}