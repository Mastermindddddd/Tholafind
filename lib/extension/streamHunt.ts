import 'server-only';
import { buildHuntPayload } from './huntPayload';

/**
 * Runs a hunt and streams progress as NDJSON (one JSON object per line):
 *   {"type":"started","searchId":"..."}      sent immediately
 *   {"type":"status","message":"..."}
 *   {"type":"ping"}                          every 8s, keeps the connection alive
 *   {"type":"done", ...payload}              or {"type":"error","message":"..."}
 *
 * Streaming matters because a hunt can take up to ~60s and the extension's
 * service worker is killed if a fetch() sits 30s without a response. Sending
 * headers and the first line right away avoids that.
 */
export function streamHunt(searchId: string, run: () => Promise<void>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
        } catch {
          /* client went away */
        }
      };

      send({ type: 'started', searchId });
      const keepAlive = setInterval(() => send({ type: 'ping' }), 8000);

      try {
        send({ type: 'status', message: 'Searching retail, resale and vintage…' });
        await run();
        send({ type: 'done', ...(await buildHuntPayload(searchId)) });
      } catch (err) {
        console.error(`[extension] hunt ${searchId} failed:`, err);
        send({ type: 'error', message: 'The hunt didn’t finish. Try again in a moment.' });
      } finally {
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}