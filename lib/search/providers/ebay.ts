import 'server-only';
import { RawCandidate } from '../types';

interface EbayItem {
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
  condition?: string;
  itemId?: string;
}

// Cached in module scope: fine for a single serverless instance's lifetime,
// resets on cold start. eBay application tokens are valid for ~2 hours, so
// this avoids re-minting one on every search within that window.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not set.');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

/**
 * Text-based search (eBay has no public reverse-image endpoint on the
 * Browse API) — the query comes from the user's hint or an inferred title
 * from the Lens results. See confidence.ts for why this is capped below
 * 'exact' regardless of how well it ranks.
 */
export async function searchEbay(query: string): Promise<RawCandidate[]> {
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.warn('[ebay] EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not set — skipping resale search.');
    return [];
  }

  const token = await getEbayAccessToken();

  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });
  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const items: EbayItem[] = data.itemSummaries || [];

  return items
    .map((it): RawCandidate | null => {
      if (!it.image?.imageUrl || !it.itemWebUrl || !it.title) return null;
      return {
        title: it.title,
        image: it.image.imageUrl,
        price: it.price?.value ? `$${it.price.value}` : undefined,
        url: it.itemWebUrl,
        source: 'eBay',
        sourceKind: 'resale',
        metadata: { condition: it.condition ?? null, itemId: it.itemId ?? null },
      };
    })
    .filter((c): c is RawCandidate => c !== null);
}