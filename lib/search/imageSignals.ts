import 'server-only';
import exifr from 'exifr';
import sharp from 'sharp';
import type { CombinedSignals, ImageSignals, PhotoQuality } from './types';
import { analyzeWithOcr } from './ocrAnalyze';

/* ------------------------------------------------------------------ */
/* 1. Upload-time preparation: EXIF read, privacy strip, quality check */
/* ------------------------------------------------------------------ */

export type PreparedSignals = Omit<ImageSignals, 'url'>;

/** Blank signals for a photo we haven't analyzed yet (demo images, legacy searches). */
export function emptySignals(url: string): ImageSignals {
  return { url, ...blankSignals() };
}

export interface PreparedImage {
  body: Buffer;
  contentType: string;
  extension: string;
  /** False if we could not re-encode the photo, i.e. the original (with its EXIF) is what we'd store. */
  stripped: boolean;
  signals: PreparedSignals;
}

function blankSignals(): PreparedSignals {
  return {
    analyzed: false,
    tagText: [],
    modelCodes: [],
    designCues: [],
    quality: 'good',
    qualityIssues: [],
  };
}

/**
 * Laplacian-variance style sharpness check plus resolution and exposure.
 * The thresholds below are starting points, not calibrated values: run a
 * handful of your own good and bad photos through this and adjust.
 */
async function assessQuality(buf: Buffer): Promise<{ quality: PhotoQuality; issues: string[] }> {
  const issues: string[] = [];
  let severe = false;

  const meta = await sharp(buf).metadata();
  const minSide = Math.min(meta.width ?? 0, meta.height ?? 0);
  if (minSide > 0 && minSide < 320) {
    issues.push('very low resolution');
    severe = true;
  } else if (minSide > 0 && minSide < 600) {
    issues.push('low resolution');
  }

  const grey = sharp(buf).greyscale().resize(512, 512, { fit: 'inside' });

  const edges = await grey
    .clone()
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], scale: 1, offset: 128 })
    .stats();
  const edgeStdev = edges.channels[0]?.stdev ?? 99;
  if (edgeStdev < 3) {
    issues.push('looks blurry');
    severe = true;
  } else if (edgeStdev < 6) {
    issues.push('slightly soft focus');
  }

  const brightness = (await grey.clone().stats()).channels[0]?.mean ?? 128;
  if (brightness < 40) {
    issues.push('very dark');
    severe = true;
  } else if (brightness < 70) {
    issues.push('low light');
  } else if (brightness > 225) {
    issues.push('overexposed');
  }

  const quality: PhotoQuality = severe ? 'poor' : issues.length > 0 ? 'fair' : 'good';
  return { quality, issues };
}

/**
 * Reads camera metadata, then re-encodes the photo so the stored copy has no
 * EXIF (including GPS). The blobs are public URLs, so this matters.
 * Only make/model/date and a "had GPS" flag are kept; coordinates are dropped.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const signals = blankSignals();

  try {
    const [tags, gps] = await Promise.all([
      exifr.parse(input, ['Make', 'Model', 'DateTimeOriginal']).catch(() => undefined),
      exifr.gps(input).catch(() => undefined),
    ]);
    if (tags) {
      signals.exif = {
        make: typeof tags.Make === 'string' ? tags.Make.trim() : undefined,
        model: typeof tags.Model === 'string' ? tags.Model.trim() : undefined,
        takenAt: tags.DateTimeOriginal instanceof Date ? tags.DateTimeOriginal.toISOString() : undefined,
      };
    }
    signals.hadLocation = typeof gps?.latitude === 'number';
  } catch (err) {
    console.warn('[imageSignals] EXIF read failed (non-fatal):', err);
  }

  let body: Buffer = input;
  let contentType = file.type;
  let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  let stripped = false;

  try {
    // rotate() bakes the EXIF orientation into the pixels; sharp drops all
    // other metadata on output unless withMetadata() is called.
    let pipeline = sharp(input).rotate();
    if (/hei[cf]$/.test(file.type)) {
      pipeline = pipeline.jpeg({ quality: 90 });
      contentType = 'image/jpeg';
      extension = 'jpg';
    }
    body = await pipeline.toBuffer();
    stripped = true;
  } catch (err) {
    console.warn('[imageSignals] re-encode failed, EXIF not stripped:', err);
  }

  try {
    const { quality, issues } = await assessQuality(body);
    signals.quality = quality;
    signals.qualityIssues = issues;
  } catch (err) {
    console.warn('[imageSignals] quality check failed (non-fatal):', err);
  }

  return { body, contentType, extension, stripped, signals };
}

/* ------------------------------------------------------------------ */
/* 2. Text pass: tag/label OCR + rules (free, no API key)              */
/* ------------------------------------------------------------------ */

/**
 * Reads what is printed on the item: tag text, style codes, brand names,
 * fibre content, plus a rough color. Uses local OCR (see ocrAnalyze.ts).
 * Throws if OCR fails; runSearch treats that as non-fatal and retries the
 * photo on the next run.
 */
export async function analyzeImage(imageUrl: string): Promise<Partial<ImageSignals> | null> {
  return analyzeWithOcr(imageUrl);
}

/* ------------------------------------------------------------------ */
/* 3. Combining several photos into one view for scoring               */
/* ------------------------------------------------------------------ */

const QUALITY_ORDER: Record<PhotoQuality, number> = { good: 0, fair: 1, poor: 2 };

function union(lists: string[][], max: number): string[] {
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!out.some((o) => o.toLowerCase() === item.toLowerCase())) out.push(item);
    }
  }
  return out.slice(0, max);
}

export function combineSignals(list: ImageSignals[]): CombinedSignals {
  // A hunt is only as hard as its BEST photo: a sharp tag close-up rescues a blurry front shot.
  const best = [...list].sort((a, b) => QUALITY_ORDER[a.quality] - QUALITY_ORDER[b.quality])[0];

  return {
    brand: list.find((s) => s.brand)?.brand,
    tagText: union(list.map((s) => s.tagText), 12),
    modelCodes: union(list.map((s) => s.modelCodes), 6),
    material: list.find((s) => s.material)?.material,
    color: list.find((s) => s.color)?.color,
    itemType: list.find((s) => s.itemType)?.itemType,
    designCues: union(list.map((s) => s.designCues), 10),
    quality: best?.quality ?? 'good',
    qualityIssues: best?.qualityIssues ?? [],
  };
}

/** A text query built from what we read off the photo, when that beats guessing from Lens titles. */
export function signalQuery(signals: CombinedSignals): string | undefined {
  const parts = [signals.brand, signals.modelCodes[0] ?? signals.itemType].filter(Boolean);
  if (!signals.brand && signals.modelCodes.length === 0) return undefined;
  return parts.join(' ').trim() || undefined;
}