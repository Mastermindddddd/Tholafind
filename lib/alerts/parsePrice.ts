/**
 * SearchResult.price is a display string ("$68", "$1,234.56", or
 * "Price unavailable"), not a stored number — this is the one place that
 * needs an actual numeric comparison (detecting a price drop), so parsing
 * happens here rather than changing how price is stored everywhere else.
 */
export function parsePrice(display: string | undefined | null): number | null {
  if (!display) return null;
  const cleaned = display.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}