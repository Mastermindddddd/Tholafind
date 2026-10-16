import { extractSignalsFromOcr, type OcrLine, type OcrWord } from '@/lib/search/ocrExtract';
import type { ImageSignals } from '@/lib/search/types';

/**
 * The extension can read tag text in the browser before uploading. That text
 * arrives from a client we don't control, so it is treated as untrusted DATA:
 * strictly shape-checked, size-capped, and only ever fed to the same pure
 * parser the server's own OCR output goes through.
 */

const MAX_JSON_CHARS = 60_000;
const MAX_LINES = 60;
const MAX_WORDS = 200;
const MAX_TEXT = 120;

function cleanItems(raw: unknown, max: number): { text: string; confidence: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { text: string; confidence: number }[] = [];
  for (const item of raw) {
    if (out.length >= max) break;
    if (!item || typeof item !== 'object') continue;
    const { text, confidence } = item as { text?: unknown; confidence?: unknown };
    if (typeof text !== 'string' || typeof confidence !== 'number') continue;
    if (!Number.isFinite(confidence)) continue;
    out.push({
      // control characters out, length capped
      text: text.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, MAX_TEXT),
      confidence: Math.max(0, Math.min(100, confidence)),
    });
  }
  return out;
}

export function parseClientOcr(raw: unknown): { lines: OcrLine[]; words: OcrWord[] } | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_JSON_CHARS) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as { lines?: unknown; words?: unknown };
  return { lines: cleanItems(obj.lines, MAX_LINES), words: cleanItems(obj.words, MAX_WORDS) };
}

/** Signals from browser-side OCR, or null when it found nothing useful (server OCR then runs). */
export function signalsFromClientOcr(
  ocr: { lines: OcrLine[]; words: OcrWord[] } | null
): Partial<ImageSignals> | null {
  if (!ocr) return null;
  const s = extractSignalsFromOcr(ocr);
  const found = !!s.brand || s.modelCodes.length > 0 || s.tagText.length > 0 || !!s.material;
  return found ? s : null;
}