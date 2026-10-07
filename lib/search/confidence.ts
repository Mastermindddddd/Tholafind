import { Confidence } from '@/lib/types';
import type {
  CombinedSignals,
  MatchDiagnosis,
  MissingAttribute,
  RawCandidate,
} from './types';

/**
 * Match scoring (replaces the old rank-only scoring).
 *
 * What the 0–100 score is made of, and what it deliberately is NOT:
 *
 *  - Visual component. Only Google Lens ranks by real visual similarity, so
 *    only retail candidates get a large visual component (up to 75 points,
 *    decaying with rank). eBay/Etsy results come from a TEXT query, so they
 *    get a much smaller base (up to 35) no matter how high they rank. We
 *    don't currently embed each candidate's thumbnail, so there is no
 *    per-candidate cosine similarity in this number.
 *  - Agreement component (up to 25). Brand, style code, tag text, item type,
 *    material, color and the user's own hint, compared against the
 *    candidate's title. A legible style code found in a listing is treated as
 *    a hard identifier and adds a bonus for text-matched sources.
 *  - Caps. A poor photo can't score above 70, a fair one above 88, so a
 *    blurry upload can never claim an "exact" match.
 *
 * The weights and thresholds are starting points, not calibrated values.
 * Tune them against a few real hunts you know the answer to.
 */

const RETAIL_VISUAL_MAX = 75;
const TEXT_VISUAL_MAX = 35;
const AGREEMENT_MAX = 25;
const HARD_ID_BONUS = 20;

const EXACT_AT = 80;
const CLOSE_AT = 55;
/** Below this best score, we explain why and ask for more detail. */
export const DIAGNOSE_BELOW = 75;

const QUALITY_CAP = { good: 99, fair: 88, poor: 70 } as const;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'new', 'used', 'size', 'men', 'mens', 'women', 'womens',
  'unisex', 'free', 'shipping', 'sale', 'item', 'set', 'pack', 'pair',
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface MatchScore {
  /** Whole number 0–100, shown in the UI. */
  matchScore: number;
  /** matchScore / 100, kept for SearchResult.similarityScore. */
  similarityScore: number;
  confidence: Confidence;
  reasons: string[];
}

export function scoreCandidate(args: {
  candidate: RawCandidate;
  rank: number;
  signals: CombinedSignals;
  hint?: string | null;
}): MatchScore {
  const { candidate, rank, signals } = args;
  const isRetail = candidate.sourceKind === 'retail';
  const reasons: string[] = [];

  // --- visual / source component ---
  const decay = Math.max(0.3, 1 - rank * (isRetail ? 0.05 : 0.1));
  const base = (isRetail ? RETAIL_VISUAL_MAX : TEXT_VISUAL_MAX) * decay;
  if (isRetail) {
    reasons.push(rank <= 2 ? 'Top visual match from Google Lens' : 'Visual match from Google Lens');
  } else {
    reasons.push('Found by text search — your photo wasn’t compared to this listing directly');
  }

  // --- agreement component ---
  const titleTokens = new Set(tokens(candidate.title));
  const titleSquashed = squash(candidate.title);
  const sourceSquashed = squash(candidate.source);

  let agreement = 0;
  let hardIdMatched = false;

  if (signals.brand) {
    const b = squash(signals.brand);
    if (b.length >= 2 && (titleSquashed.includes(b) || sourceSquashed.includes(b))) {
      agreement += 9;
      reasons.push(`Brand on your photo (${signals.brand}) matches`);
    } else if (titleTokens.size > 0) {
      agreement -= 6;
      reasons.push(`Your photo suggests ${signals.brand}, but that brand isn’t in this listing’s title`);
    }
  }

  const matchedCode = signals.modelCodes.find((c) => {
    const sq = squash(c);
    return sq.length >= 4 && titleSquashed.includes(sq);
  });
  if (matchedCode) {
    agreement += 8;
    hardIdMatched = true;
    reasons.push(`Style code ${matchedCode} found in the listing`);
  }

  if (signals.tagText.length > 0) {
    const tagTokens = new Set(signals.tagText.flatMap(tokens));
    const overlap = [...tagTokens].filter((t) => titleTokens.has(t)).length;
    if (overlap > 0) {
      agreement += Math.min(4, overlap * 2);
      reasons.push('Text from the tag appears in the listing');
    }
  }

  if (signals.itemType && tokens(signals.itemType).some((t) => titleTokens.has(t))) {
    agreement += 2;
  }
  if (signals.material && tokens(signals.material).some((t) => titleTokens.has(t))) {
    agreement += 1;
    reasons.push(`Material (${signals.material}) matches`);
  }
  if (signals.color && tokens(signals.color).some((t) => titleTokens.has(t))) {
    agreement += 1;
    reasons.push(`Color (${signals.color}) matches`);
  }

  const hintTokens = args.hint ? tokens(args.hint) : [];
  if (hintTokens.length > 0) {
    const hit = hintTokens.filter((t) => titleTokens.has(t)).length;
    if (hit > 0) {
      agreement += Math.round((hit / hintTokens.length) * 6);
      reasons.push('Matches the detail you added');
    }
  }

  agreement = Math.max(-6, Math.min(AGREEMENT_MAX, agreement));

  let raw = base + agreement;
  if (hardIdMatched && !isRetail) raw += HARD_ID_BONUS;

  // --- caps ---
  const cap = QUALITY_CAP[signals.quality];
  if (raw > cap) {
    raw = cap;
    reasons.push(
      `Score capped at ${cap}% because the photo ${signals.qualityIssues[0] ?? 'is hard to read'}`
    );
  }

  const matchScore = Math.round(Math.max(5, Math.min(99, raw)));
  const confidence: Confidence =
    matchScore >= EXACT_AT ? 'exact' : matchScore >= CLOSE_AT ? 'close' : 'guess';

  return {
    matchScore,
    similarityScore: Number((matchScore / 100).toFixed(2)),
    confidence,
    reasons: reasons.slice(0, 5),
  };
}

/**
 * Explains a weak result set in plain language and lists what to ask the
 * person for. Returns null when the best match is strong and the photo is fine.
 */
export function diagnoseMatch(args: {
  bestScore: number;
  signals: CombinedSignals;
  imageCount: number;
  hint?: string | null;
}): MatchDiagnosis | null {
  const { bestScore, signals, imageCount } = args;
  if (bestScore >= DIAGNOSE_BELOW && signals.quality !== 'poor') return null;

  const causes: string[] = [];
  const missing: MissingAttribute[] = [];

  if (signals.quality !== 'good' && signals.qualityIssues.length > 0) {
    causes.push(`the photo ${signals.qualityIssues.join(' and ')}`);
  }
  if (!signals.brand) {
    causes.push('we couldn’t read a brand');
    missing.push('brand');
  }
  if (signals.tagText.length === 0 && signals.modelCodes.length === 0) {
    causes.push('no tag or style code was legible');
    missing.push('tag');
  }
  if (!signals.material) missing.push('material');
  if (!signals.color) missing.push('color');
  if (imageCount < 3) {
    if (imageCount === 1) causes.push('we only have one angle');
    missing.push('angle');
  }

  const lead = bestScore > 0 ? `Best match so far is ${bestScore}%.` : 'We didn’t find a usable match.';
  const why =
    causes.length > 0
      ? ` Why we’re unsure: ${causes.join('; ')}.`
      : ' The listings we found only loosely resemble your photo.';

  return { explanation: lead + why, missing };
}