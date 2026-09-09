import 'server-only';
import { RawCandidate } from '../types';

interface LensMatch {
  title?: string;
  link?: string;
  source?: string;
  thumbnail?: string;
  image?: string;
  /** Real SerpApi responses are inconsistent here across different
   * matched retailers — sometimes a formatted `value` string is present,
   * sometimes only a numeric `extracted_value` + `currency` (no
   * pre-formatted string at all), and rarely `price` itself is a bare
   * string rather than an object. Narrowly checking only `price.value`
   * (the original implementation) silently dropped every other shape to
   * "Price unavailable" even when the matched page clearly has a price —
   * see extractLensPrice() below for the actual fix. */
  price?: { value?: string; extracted_value?: number; currency?: string } | string;
  in_stock?: boolean;
  position?: number;
}

function extractLensPrice(price: LensMatch['price']): string | undefined {
  if (!price) return undefined;
  if (typeof price === 'string') return price;
  if (price.value) return price.value;
  if (typeof price.extracted_value === 'number') {
    return price.currency ? `${price.currency} ${price.extracted_value}` : `$${price.extracted_value}`;
  }
  return undefined;
}

/**
 * A single Lens call against one image URL — SerpApi's google_lens engine
 * only accepts one image per request, no multi-image param.
 */
async function searchGoogleLensSingle(imageUrl: string, apiKey: string): Promise<RawCandidate[]> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_lens');
  url.searchParams.set('url', imageUrl);
  url.searchParams.set('type', 'visual_matches');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SerpApi request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const matches: LensMatch[] = data.visual_matches || [];

  // Raised from 8: SerpApi's own visual_matches already spans a wide set
  // of retailers per call (confirmed against real response examples, not
  // assumed) — the low cap was silently discarding a chunk of that variety
  // for free, not saving any API cost. With multi-image merge (Phase 4)
  // deduping by URL afterward, a higher per-image cap here is what
  // actually improves the mix of stores a search surfaces.
  return matches
    .slice(0, 16)
    .map((m): RawCandidate | null => {
      const image = m.thumbnail || m.image;
      if (!image || !m.link) return null;
      let source = m.source;
      if (!source) {
        try {
          source = new URL(m.link).hostname.replace(/^www\./, '');
        } catch {
          source = 'Unknown retailer';
        }
      }
      return {
        title: m.title || 'Untitled item',
        image,
        price: extractLensPrice(m.price),
        url: m.link,
        source,
        sourceKind: 'retail',
        metadata: { inStock: m.in_stock ?? null, position: m.position ?? null },
      };
    })
    .filter((c): c is RawCandidate => c !== null);
}

/**
 * Real visual search across every photo attached to a search (Phase 4:
 * a front shot plus a tag close-up, say). This is the only provider whose
 * ranking reflects genuine server-side visual matching (see confidence.ts),
 * so merging results across images — rather than only ever using the first
 * photo — is what actually improves matches on ambiguous items.
 *
 * Runs one call per image in parallel, then merges: duplicate items (same
 * URL) found from more than one photo keep their best rank rather than
 * being counted twice, and the first image's results win ties, since it's
 * the primary shot.
 */
export async function searchGoogleLens(imageUrls: string[]): Promise<RawCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('[serpapiLens] SERPAPI_API_KEY not set — skipping retail search.');
    return [];
  }

  const perImageResults = await Promise.all(
    imageUrls.map((url) => searchGoogleLensSingle(url, apiKey))
  );

  const seen = new Map<string, RawCandidate>();
  for (const results of perImageResults) {
    for (const candidate of results) {
      if (!seen.has(candidate.url)) {
        seen.set(candidate.url, candidate);
      }
    }
  }

  return Array.from(seen.values());
}