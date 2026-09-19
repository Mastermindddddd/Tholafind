import 'server-only';
import type { RawCandidate } from '@/lib/search/types';

interface ShoppingResult {
  title?: string;
  thumbnail?: string;
  product_id?: string;
  product_link?: string;
  link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
}

interface ProductSeller {
  name?: string;
  link?: string;
  direct_link?: string;
  base_price?: string;
  extracted_base_price?: number;
}

/**
 * google_shopping's own `product_link` points at Google's product
 * comparison page (google.com/shopping/product/...), not the merchant's
 * actual page — confirmed against real SerpApi responses, not assumed.
 * This second call resolves a product_id to its first real seller link via
 * the separate google_product engine's sellers_results.
 */
async function resolveDirectLink(productId: string, apiKey: string): Promise<{ url: string; price?: string } | null> {
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_product');
    url.searchParams.set('product_id', productId);
    url.searchParams.set('api_key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const sellers: ProductSeller[] = data.sellers_results?.online_sellers || [];
    const first = sellers.find((s) => s.direct_link || s.link);
    if (!first) return null;

    const link = first.direct_link || first.link;
    if (!link) return null;

    const price = first.base_price
      ? first.base_price
      : typeof first.extracted_base_price === 'number'
        ? `$${first.extracted_base_price}`
        : undefined;

    return { url: link, price };
  } catch {
    return null;
  }
}

/**
 * General text-query retail search, distinct from searchGoogleLens
 * (reverse-image-only). Used only for the /browse discovery feed.
 *
 * Each candidate needs a second API call (resolveDirectLink) to get a real
 * merchant URL instead of a Google Shopping comparison page — run in
 * parallel, capped by the slice(0, 12) below so a single query never fans
 * out more than 12 extra requests.
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
  const results: ShoppingResult[] = (data.shopping_results || []).slice(0, 12);

  const resolved = await Promise.all(
    results.map(async (r): Promise<RawCandidate | null> => {
      if (!r.thumbnail || !r.title) return null;

      const fallbackPrice =
        r.price || (typeof r.extracted_price === 'number' ? `$${r.extracted_price}` : undefined);

      // Prefer the resolved direct merchant link; skip the item entirely
      // rather than fall back to product_link, since that's the Google
      // comparison page this whole fix exists to avoid.
      const direct = r.product_id ? await resolveDirectLink(r.product_id, apiKey) : null;
      if (!direct) return null;

      const price = direct.price || fallbackPrice;
      if (!price) return null; // discovery feed requires a price

      return {
        title: r.title,
        image: r.thumbnail,
        price,
        url: direct.url,
        source: r.source || 'Retailer',
        sourceKind: 'retail',
        metadata: {},
      };
    })
  );

  return resolved.filter((c): c is RawCandidate => c !== null);
}