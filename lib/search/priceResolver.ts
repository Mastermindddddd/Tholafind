const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 2_000_000; // 2MB — enough for head+early body on virtually any product page

/**
 * Attempts to resolve a real price by fetching the item's own page and
 * reading it the way search engines do — structured data first, then
 * meta tags, then a last-resort text scan. Returns null (not throws) on
 * any failure — this always runs as a best-effort enhancement, never
 * something that should block a caller.
 *
 * No 'server-only' guard here (unlike most of lib/search/) since this is
 * called both from runSearch.ts (a Next server route) and from standalone
 * backfill scripts run via plain tsx — the 'server-only' package throws
 * unconditionally outside Next's own bundler, regardless of actual
 * runtime context, so it can't be used in anything invoked by a script.
 */
export async function resolvePriceFromUrl(url: string): Promise<string | null> {
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    return null;
  }

  return (
    extractFromJsonLd(html) ||
    extractFromMetaTags(html) ||
    extractFromVisibleText(html)
  );
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!res.ok || !res.body) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let bytesRead = 0;

    while (bytesRead < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      result += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

function extractFromJsonLd(html: string): string | null {
  const scriptMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const price = findPriceInJsonLd(parsed);
      if (price) return formatPrice(price);
    } catch {
      continue;
    }
  }
  return null;
}

function findPriceInJsonLd(node: unknown): string | number | null {
  if (!node || typeof node !== 'object') return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPriceInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = node as Record<string, unknown>;

  if (typeof obj.price === 'string' || typeof obj.price === 'number') {
    return obj.price;
  }

  if (obj.offers) {
    const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
    if (offers && typeof offers === 'object') {
      const offerObj = offers as Record<string, unknown>;
      if (typeof offerObj.price === 'string' || typeof offerObj.price === 'number') {
        return offerObj.price;
      }
      if (offerObj.priceSpecification && typeof offerObj.priceSpecification === 'object') {
        const spec = offerObj.priceSpecification as Record<string, unknown>;
        if (typeof spec.price === 'string' || typeof spec.price === 'number') {
          return spec.price;
        }
      }
    }
  }

  if (Array.isArray(obj['@graph'])) {
    return findPriceInJsonLd(obj['@graph']);
  }

  return null;
}

function extractFromMetaTags(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["']/i,
    /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']price["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].trim();
      if (/^\d+(\.\d{1,2})?$/.test(cleaned)) return formatPrice(cleaned);
    }
  }
  return null;
}

function extractFromVisibleText(html: string): string | null {
  const match = html.match(/[$£€]\s?\d{1,5}(?:[.,]\d{2})?/);
  return match ? match[0].replace(/\s+/g, '') : null;
}

function formatPrice(raw: string | number): string {
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  if (Number.isNaN(num)) return String(raw);
  return `$${num.toFixed(2)}`;
}