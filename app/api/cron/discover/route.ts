import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ingestDiscoveryItems } from '@/lib/discovery/ingestDiscoveryItems';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await ingestDiscoveryItems();

    revalidatePath('/browse');
    revalidatePath('/browse/retail');
    revalidatePath('/browse/resale');
    revalidatePath('/browse/vintage');

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/discover] failed:', err);
    return NextResponse.json({ ok: false, message: 'Discovery ingestion failed.' }, { status: 500 });
  }
}