const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 2_000_000; // 2MB — enough for head+early body on virtually any product page

/**
 * Attempts to resolve a real price by fetching the item's own page and
 * reading it the way search engines do — structured data first, then meta
 * tags. Returns null (not throws) on any failure — this always runs as a
 * best-effort enhancement, never something that should block a caller.
 *
 * Correct-or-nothing: a price is only returned when the page states BOTH an
 * amount and its currency in structured data. The old last-resort scan of
 * the visible HTML for the first "$123" was removed — on pages without
 * structured data it picked up banners, shipping thresholds and installment
 * text (e.g. "$8"), and a wrong price is worse than "See price on site".
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

  const found = extractFromJsonLd(html) || extractFromMetaTags(html);
  return found ? formatPrice(found) : null;
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

interface FoundPrice {
  amount: number;
  currency: string; // ISO 4217, upper case
}

/** Accepts only unambiguous number formats; anything else (e.g. "1.299,00") is rejected, not guessed. */
function toFound(price: unknown, currency: unknown): FoundPrice | null {
  let amount = NaN;
  if (typeof price === 'number') {
    amount = price;
  } else if (typeof price === 'string') {
    const s = price.trim();
    if (/^\d+(\.\d+)?$/.test(s)) amount = parseFloat(s);
    else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) amount = parseFloat(s.replace(/,/g, ''));
  }
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency.trim())) return null;
  return { amount, currency: currency.trim().toUpperCase() };
}

function extractFromJsonLd(html: string): FoundPrice | null {
  const scriptMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const found = findPriceInJsonLd(parsed);
      if (found) return found;
    } catch {
      continue;
    }
  }
  return null;
}

function fromOffers(offers: unknown, inheritedCurrency?: unknown): FoundPrice | null {
  const list = Array.isArray(offers) ? offers : [offers];
  for (const offer of list) {
    if (offer && typeof offer === 'object') {
      const found = fromOffer(offer as Record<string, unknown>, inheritedCurrency);
      if (found) return found;
    }
  }
  return null;
}

function fromOffer(offer: Record<string, unknown>, inheritedCurrency?: unknown): FoundPrice | null {
  const currency = offer.priceCurrency ?? inheritedCurrency;

  // AggregateOffer: the page states a range; lowPrice is the "from" price.
  if (offer.lowPrice !== undefined) {
    const low = toFound(offer.lowPrice, currency);
    if (low) return low;
  }

  const direct = toFound(offer.price, currency);
  if (direct) return direct;

  const spec = offer.priceSpecification;
  if (spec && typeof spec === 'object') {
    for (const s of Array.isArray(spec) ? spec : [spec]) {
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        const found = toFound(o.price, o.priceCurrency ?? currency);
        if (found) return found;
      }
    }
  }

  if (offer.offers) return fromOffers(offer.offers, currency);
  return null;
}

function findPriceInJsonLd(node: unknown): FoundPrice | null {
  if (!node || typeof node !== 'object') return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPriceInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = node as Record<string, unknown>;

  if (obj.offers) {
    const found = fromOffers(obj.offers);
    if (found) return found;
  }

  // The node may itself be an Offer.
  if (obj.price !== undefined || obj.lowPrice !== undefined) {
    const found = fromOffer(obj);
    if (found) return found;
  }

  // ProductGroup pages keep the offers on their variants.
  if (Array.isArray(obj.hasVariant)) {
    const found = findPriceInJsonLd(obj.hasVariant);
    if (found) return found;
  }

  if (Array.isArray(obj['@graph'])) {
    return findPriceInJsonLd(obj['@graph']);
  }

  return null;
}

function metaContent(html: string, attr: 'property' | 'itemprop', key: string): string | null {
  const before = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i');
  const after = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, 'i');
  return html.match(before)?.[1] ?? html.match(after)?.[1] ?? null;
}

function extractFromMetaTags(html: string): FoundPrice | null {
  const pairs: ['property' | 'itemprop', string, string][] = [
    ['property', 'product:price:amount', 'product:price:currency'],
    ['property', 'og:price:amount', 'og:price:currency'],
    ['itemprop', 'price', 'priceCurrency'],
  ];

  for (const [attr, amountKey, currencyKey] of pairs) {
    const found = toFound(metaContent(html, attr, amountKey), metaContent(html, attr, currencyKey));
    if (found) return found;
  }
  return null;
}

const SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  ZAR: 'R',
  AUD: 'A$',
  CAD: 'C$',
  NZD: 'NZ$',
  JPY: '¥',
  INR: '₹',
};

function formatPrice({ amount, currency }: FoundPrice): string {
  const digits = currency === 'JPY' ? 0 : 2;
  const symbol = SYMBOLS[currency];
  return symbol ? `${symbol}${amount.toFixed(digits)}` : `${currency} ${amount.toFixed(digits)}`;
}