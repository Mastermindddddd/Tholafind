/**
 * Cheap sanity check on provider-supplied prices.
 *
 * Google Lens prices come from SerpApi's reading of the matched page and are
 * sometimes wrong (e.g. "$8" on a $90+ sneaker listing). We can't verify every
 * price against the page, but a price far below what the OTHER results in the
 * same hunt cost is a strong hint the number is a mis-read. Those are
 * discarded so the page-price backfill can try the product page instead, and
 * if that fails the card shows "See price on site" rather than a wrong number.
 *
 * Only LOW outliers are flagged. A high outlier can be a genuine collector's
 * price; a very low one on an item that otherwise costs ~$100 almost never is.
 */

export interface ParsedPrice {
  amount: number;
  currency: string;
}

export function parsePrice(display: string | undefined | null): ParsedPrice | null {
  if (!display) return null;
  const m = display.trim().match(/^([^\d\s.,]*)\s*(\d[\d,\s]*(?:\.\d+)?)/);
  if (!m) return null;

  let num = m[2].trim();
  // "1 299,00" style: a comma followed by exactly two digits at the end is a decimal comma.
  if (!num.includes('.') && /,\d{2}$/.test(num)) {
    num = num.replace(/,(\d{2})$/, '.$1');
  }
  const amount = Number(num.replace(/[,\s]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, currency: m[1].toUpperCase() };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Returns the indexes of prices that look like mis-reads. Compares only
 * within the same currency, and only when at least `minGroup` prices share it.
 */
export function findSuspiciousPrices(
  prices: (string | undefined | null)[],
  opts: { minGroup?: number; lowRatio?: number } = {}
): Set<number> {
  const minGroup = opts.minGroup ?? 3;
  const lowRatio = opts.lowRatio ?? 0.25;

  const groups = new Map<string, { index: number; amount: number }[]>();
  prices.forEach((p, index) => {
    const parsed = parsePrice(p);
    if (!parsed) return;
    const list = groups.get(parsed.currency) ?? [];
    list.push({ index, amount: parsed.amount });
    groups.set(parsed.currency, list);
  });

  const flagged = new Set<number>();
  for (const list of groups.values()) {
    if (list.length < minGroup) continue;
    const mid = median(list.map((x) => x.amount));
    for (const { index, amount } of list) {
      if (amount < mid * lowRatio) flagged.add(index);
    }
  }
  return flagged;
}

/**
 * Tidies a price for display: removes asterisks (some sources append "*" to
 * prices, e.g. "$100*") and stray whitespace. Returns undefined when nothing
 * is left, so callers can fall back to "See price on site".
 */
export function cleanPriceDisplay(price: string | undefined | null): string | undefined {
  if (!price) return undefined;
  const cleaned = price.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}