import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { connectToDatabase } from '@/lib/db';
import { Search } from '@/lib/models';
import { generateUniqueReference } from '@/lib/generateReference';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(request: Request) {
  await connectToDatabase();

  // Anonymous search is allowed by design (Phase 1) — a null user is fine here,
  // Search.userId is optional.
  const user = await getOrCreateUser();

  const contentType = request.headers.get('content-type') || '';

  try {
    // Path 1: the "try a sample hunt" demo — reuses an existing hosted image
    // instead of re-uploading it to Blob storage.
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const demoImageUrl = typeof body.demoImageUrl === 'string' ? body.demoImageUrl : null;

      if (!demoImageUrl || !demoImageUrl.startsWith('https://')) {
        return NextResponse.json(
          { ok: false, message: 'Missing or invalid demoImageUrl.' },
          { status: 400 }
        );
      }

      const reference = await generateUniqueReference();
      const search = await Search.create({
        userId: user?._id,
        images: [demoImageUrl],
        status: 'pending',
        reference,
      });

      return NextResponse.json({ ok: true, searchId: search._id, reference: search.reference });
    }

    // Path 2: a real uploaded photo.
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { ok: false, message: 'Expected multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'No file provided.' }, { status: 400 });
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

    const extension = file.name.split('.').pop() || 'jpg';
    const blobPath = `hunts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    });

    const reference = await generateUniqueReference();
    const search = await Search.create({
      userId: user?._id,
      images: [blob.url],
      status: 'pending',
      reference,
    });

    return NextResponse.json({ ok: true, searchId: search._id, reference: search.reference });
  } catch (err) {
    console.error('[upload] failed:', err);
    return NextResponse.json(
      { ok: false, message: 'Upload failed. Try again in a moment.' },
      { status: 500 }
    );
  }
}