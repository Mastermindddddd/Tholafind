import 'server-only';

/**
 * Generates a CLIP embedding for the query photo via Replicate, using the
 * "krthr/clip-embeddings" model (ViT-L/14-based, ~3s typical runtime).
 *
 * NOTE ON VERIFICATION: this couldn't be tested against a live Replicate
 * call while building this (no network access to replicate.com in the build
 * environment). The request shape follows Replicate's documented HTTP API
 * (POST to /models/{owner}/{name}/predictions, Prefer: wait for sync mode),
 * but the exact shape of `output` for this specific model is unconfirmed —
 * extractEmbedding() below handles the two most likely shapes defensively.
 * Verify this against a real call before relying on it, and adjust
 * extractEmbedding() if the real shape differs.
 *
 * Only called once per search (on the query photo) — not per candidate
 * result — specifically to keep search latency and Replicate cost bounded.
 * See lib/search/cosineSimilarity.ts for why per-candidate re-embedding was
 * deliberately deferred.
 */
export async function generateEmbedding(imageUrl: string): Promise<number[]> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN not set.');
  }

  const res = await fetch('https://api.replicate.com/v1/models/krthr/clip-embeddings/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ input: { image: imageUrl } }),
  });

  if (!res.ok) {
    throw new Error(`Replicate request failed: ${res.status} ${await res.text()}`);
  }

  const prediction = await res.json();

  if (prediction.status === 'succeeded') {
    return extractEmbedding(prediction.output);
  }

  // Prefer: wait can still return early on a cold start — poll briefly
  // rather than give up immediately.
  if (prediction.urls?.get) {
    return pollForEmbedding(prediction.urls.get, token);
  }

  throw new Error(`Replicate prediction did not complete: status=${prediction.status}`);
}

async function pollForEmbedding(getUrl: string, token: string, attempts = 8): Promise<number[]> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
    const prediction = await res.json();
    if (prediction.status === 'succeeded') return extractEmbedding(prediction.output);
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error}`);
    }
  }
  throw new Error('Replicate prediction timed out waiting for the embedding.');
}

function extractEmbedding(output: unknown): number[] {
  if (Array.isArray(output) && typeof output[0] === 'number') {
    return output as number[];
  }
  if (output && typeof output === 'object') {
    const maybe = (output as Record<string, unknown>).embedding;
    if (Array.isArray(maybe) && typeof maybe[0] === 'number') {
      return maybe as number[];
    }
  }
  throw new Error('Unexpected embedding output shape from Replicate — see embeddings.ts.');
}