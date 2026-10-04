/**
 * eBay and Etsy need a text query; the user's hint is preferred when present
 * (it's ground truth), but when there's no hint, we borrow the top Google
 * Lens visual match's title as an inferred query — Lens already did the
 * hard work of identifying the item, so this avoids needing a separate
 * image-captioning step just to get a search string.
 *
 * Extended beyond a single query: when there's no hint (i.e. the query is
 * auto-derived, not user-provided), this also generates a second, broader
 * variant from the same title. A full product title ("Nike Air Vaporfly 3
 * Men's Running Shoe White") can be too specific to match how a resale
 * listing phrases the same item, but a shorter brand-first version ("Nike
 * Air Vaporfly") usually still will. This is the bounded, source-honest
 * version of "pivot to more listings once the item is identified" — see
 * the README note on why scraping unauthorized marketplace endpoints
 * (Poshmark/Mercari/Depop/Grailed have no public API) wasn't the answer.
 *
 * A user-supplied hint is NOT expanded into variants — it's already as
 * specific as the person intended, and guessing broader phrasings for
 * something they told us directly would just dilute a query they already
 * got right.
 *
 * Deliberately capped at 2 variants, not an open-ended fan-out: each
 * variant is one real API call per provider (eBay + Etsy), so this at most
 * doubles those calls, never multiplies unboundedly.
 */
export function deriveSearchQueries(
  hint: string | null | undefined,
  lensTopTitle: string | undefined
): string[] {
  const cleanHint = hint?.trim();
  if (cleanHint) return [cleanHint];

  if (!lensTopTitle) return [];

  // Titles from Lens often carry a trailing site name ("... | Etsy",
  // "... - IKEA", "Product Name. Nike.com") — trim at the first strong
  // separator and cap length so it reads like a search query, not a title.
  const cut = lensTopTitle.split(/\s[|\u2014-]\s|\n/)[0];
  const specific = cut.slice(0, 80).trim();
  if (!specific) return [];

  const words = specific.split(/\s+/);
  // Only worth adding a second, broader variant if there's actually
  // something to broaden — a title that's already 3 words or fewer has
  // nothing shorter to try, and querying the identical string twice would
  // just waste an API call for zero benefit.
  if (words.length <= 3) return [specific];

  const broad = words.slice(0, 3).join(' ');
  return [specific, broad];
}