import 'server-only';
import { RawCandidate } from '../types';

const BASE = 'https://api.etsy.com/v3/application';

interface EtsyListing {
  listing_id: number;
  title: string;
  price?: { amount: number; divisor: number; currency_code: string };
  url: string;
}

interface EtsyImage {
  url_570xN?: string;
  url_fullxfull?: string;
}

/**
 * Etsy's active-listings search doesn't inline images in the response, so
 * each listing's primary image needs a separate call. Capped to a handful
 * of results (see searchEtsy below) to avoid an N+1 explosion — this is the
 * one part of this provider that couldn't be verified against a live call;
 * confirm the image field names below against a real response.
 */
async function fetchListingImage(listingId: number, apiKey: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${BASE}/listings/${listingId}/images`, {
      headers: { 'x-api-key': apiKey },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const first: EtsyImage | undefined = data.results?.[0];
    return first?.url_570xN || first?.url_fullxfull;
  } catch {
    return undefined;
  }
}

/**
 * Text-based search, same honesty caveat as eBay: capped below 'exact'
 * confidence in confidence.ts regardless of rank, since this isn't matched
 * against the photo itself.
 */
export async function searchEtsy(query: string): Promise<RawCandidate[]> {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) {
    console.warn('[etsy] ETSY_API_KEY not set — skipping vintage search.');
    return [];
  }

  const url = new URL(`${BASE}/listings/active`);
  url.searchParams.set('keywords', query);
  url.searchParams.set('limit', '6');

  const res = await fetch(url.toString(), { headers: { 'x-api-key': apiKey } });
  if (!res.ok) {
    throw new Error(`Etsy search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const listings: EtsyListing[] = (data.results || []).slice(0, 6);

  const withImages = await Promise.all(
    listings.map(async (l): Promise<RawCandidate | null> => {
      const image = await fetchListingImage(l.listing_id, apiKey);
      if (!image || !l.url) return null;
      return {
        title: l.title,
        image,
        price: l.price
          ? `$${(l.price.amount / l.price.divisor).toFixed(2)}`
          : undefined,
        url: l.url,
        source: 'Etsy Vintage',
        sourceKind: 'vintage',
        metadata: { listingId: l.listing_id },
      };
    })
  );

  return withImages.filter((c): c is RawCandidate => c !== null);
}