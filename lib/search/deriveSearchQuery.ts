/**
 * eBay and Etsy need a text query; the user's hint is preferred when present
 * (it's ground truth), but when there's no hint, we borrow the top Google
 * Lens visual match's title as an inferred query — Lens already did the
 * hard work of identifying the item, so this avoids needing a separate
 * image-captioning step just to get a search string.
 */
export function deriveSearchQuery(hint: string | undefined, lensTopTitle: string | undefined): string | null {
  const cleanHint = hint?.trim();
  if (cleanHint) return cleanHint;

  if (!lensTopTitle) return null;

  // Titles from Lens often carry a trailing site name ("... | Etsy",
  // "... - IKEA", "Product Name. Nike.com") — trim at the first strong
  // separator and cap length so it reads like a search query, not a title.
  const cut = lensTopTitle.split(/\s[|\u2014-]\s|\n/)[0];
  return cut.slice(0, 80).trim() || null;
}