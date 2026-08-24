import 'server-only';
import { RawCandidate } from '../types';

interface LensMatch {
  title?: string;
  link?: string;
  source?: string;
  thumbnail?: string;
  image?: string;
  price?: { value?: string };
  in_stock?: boolean;
  position?: number;
}

/**
 * Real visual search: SerpApi scrapes Google Lens results for the given
 * image URL. This is the only provider whose ranking reflects genuine
 * server-side visual matching (see confidence.ts).
 */
export async function searchGoogleLens(imageUrl: string): Promise<RawCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('[serpapiLens] SERPAPI_API_KEY not set — skipping retail search.');
    return [];
  }

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

  return matches
    .slice(0, 8)
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
        price: m.price?.value,
        url: m.link,
        source,
        sourceKind: 'retail',
        metadata: { inStock: m.in_stock ?? null, position: m.position ?? null },
      };
    })
    .filter((c): c is RawCandidate => c !== null);
}