/**
 * eBay and Etsy need a text query. Priority, highest first:
 *
 *  1. The user's hint (it's ground truth, and used alone as before).
 *  2. A query built from what we READ off the photo: brand plus style code
 *     (or item type) from the vision pass. A legible tag beats a guess.
 *  3. The top Google Lens visual match's title — Lens already did the hard
 *     work of identifying the item, so this avoids a separate captioning step.
 *
 * With no hint, up to two variants are returned, never more, since each is a
 * real API call per provider (eBay + Etsy):
 *  - if a tag-derived query exists: [tag query, specific Lens title]
 *  - otherwise: [specific Lens title, broader 3-word version of it]
 *
 * A user-supplied hint is NOT expanded into variants — it's already as
 * specific as the person intended, and guessing broader phrasings for
 * something they told us directly would just dilute a query they got right.
 */
export function deriveSearchQueries(
  hint: string | null | undefined,
  lensTopTitle: string | undefined,
  signalDerivedQuery?: string
): string[] {
  const cleanHint = hint?.trim();
  if (cleanHint) return [cleanHint];

  // Titles from Lens often carry a trailing site name ("... | Etsy",
  // "... - IKEA", "Product Name. Nike.com") — trim at the first strong
  // separator and cap length so it reads like a search query, not a title.
  let specific = '';
  if (lensTopTitle) {
    const cut = lensTopTitle.split(/\s[|—-]\s|\n/)[0];
    specific = cut.slice(0, 80).trim();
  }

  const fromTag = signalDerivedQuery?.trim();
  if (fromTag) {
    const out = [fromTag];
    if (specific && specific.toLowerCase() !== fromTag.toLowerCase()) out.push(specific);
    return out;
  }

  if (!specific) return [];

  const words = specific.split(/\s+/);
  // Only worth adding a broader variant if there's something to broaden — a
  // title of 3 words or fewer has nothing shorter to try.
  if (words.length <= 3) return [specific];

  return [specific, words.slice(0, 3).join(' ')];
}