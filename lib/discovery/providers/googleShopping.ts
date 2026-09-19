import 'server-only';
import type { RawCandidate } from '@/lib/search/types';

interface ShoppingResult {
  title?: string;
  thumbnail?: string;
  product_link?: string;
  link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
}

/**
 * General text-query retail search, distinct from searchGoogleLens
 * (reverse-image-only, in lib/search/providers/serpapiLens.ts). Used only
 * for the /browse discovery feed, never for a user's photo hunt.
 */
export async function searchGoogleShopping(query: string): Promise<RawCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('[googleShopping] SERPAPI_API_KEY not set — skipping retail discovery.');
    return [];
  }

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SerpApi Shopping request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const results: ShoppingResult[] = data.shopping_results || [];

  return results
    .slice(0, 12)
    .map((r): RawCandidate | null => {
      const link = r.product_link || r.link;
      if (!r.thumbnail || !link || !r.title) return null;
      const price = r.price || (typeof r.extracted_price === 'number' ? `$${r.extracted_price}` : undefined);
      if (!price) return null; // discovery feed requires a price — drop priceless results here
      return {
        title: r.title,
        image: r.thumbnail,
        price,
        url: link,
        source: r.source || 'Retailer',
        sourceKind: 'retail',
        metadata: {},
      };
    })
    .filter((c): c is RawCandidate => c !== null);
}