import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Alert, Search } from '@/lib/models';
import { checkAlert } from '@/lib/alerts/checkAlert';
import { sendAlertEmail } from '@/lib/alerts/sendAlertEmail';

export const dynamic = 'force-dynamic';
// Checking N alerts means N full multi-source searches — this can run long
// once there's real alert volume. 60s is the Hobby-tier ceiling on Vercel;
// see the README note on splitting this into batched/queued runs if it's
// ever not enough.
export const maxDuration = 60;

/**
 * Meant to be hit by Vercel Cron (see vercel.json), not a person. Verifies
 * a bearer token against CRON_SECRET, matching Vercel's documented pattern
 * for securing cron routes: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *
 * Checks every active Alert sequentially (not in parallel) — each check is
 * itself a full search across three external providers, and running many
 * of those concurrently risks tripping rate limits on SerpApi/eBay/Etsy
 * faster than a sequential pass would.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ ok: false, message: 'CRON_SECRET not set.' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  await connectToDatabase();

  const activeAlerts = await Alert.find({ active: true });

  const results: { alertId: string; notificationsAdded: number; error?: string }[] = [];

  for (const alert of activeAlerts) {
    try {
      const addedCount = await checkAlert(alert);
      results.push({ alertId: String(alert._id), notificationsAdded: addedCount });

      if (addedCount > 0) {
        const search = await Search.findById(alert.searchId).select('reference').lean();
        const newMessages = alert.notifications.slice(-addedCount).map((n) => n.message);
        if (search) {
          await sendAlertEmail(alert.userId, search.reference, newMessages);
        }
      }
    } catch (err) {
      console.error(`[cron/check-alerts] alert ${alert._id} failed:`, err);
      results.push({
        alertId: String(alert._id),
        notificationsAdded: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: activeAlerts.length,
    results,
  });
}