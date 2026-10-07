import 'server-only';
import os from 'os';
import sharp from 'sharp';
import { createWorker, type Worker } from 'tesseract.js';
import type { ImageSignals } from './types';
import { extractSignalsFromOcr, nearestColorName } from './ocrExtract';

/**
 * Free replacement for the vision-model call: local OCR via tesseract.js
 * (needs no account or API key) plus rule-based parsing (ocrExtract.ts).
 *
 * One OCR worker is shared and calls are queued, because each worker holds
 * a lot of memory and runSearch analyzes up to 3 photos at once. On a warm
 * serverless instance the worker and its downloaded language data are reused.
 * The FIRST run on a cold instance downloads the English language data
 * (several MB) and is noticeably slower.
 */

const OCR_TIMEOUT_MS = 20_000;
const FETCH_TIMEOUT_MS = 15_000;

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, { cachePath: os.tmpdir() }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

function recognize(image: Buffer) {
  const run = queue.then(async () => {
    const worker = await getWorker();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('OCR timed out')), OCR_TIMEOUT_MS);
    });
    try {
      return await Promise.race([worker.recognize(image), timeout]);
    } catch (err) {
      // A stuck worker would block the queue — discard it so the next call starts fresh.
      workerPromise = null;
      worker.terminate().catch(() => undefined);
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Could not fetch image for OCR: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Rough dominant color of the centre of the photo (where the item usually is). */
async function centreColor(buf: Buffer): Promise<string | undefined> {
  try {
    const { width, height } = await sharp(buf).metadata();
    if (!width || !height) return undefined;
    const { dominant } = await sharp(buf)
      .extract({
        left: Math.round(width * 0.25),
        top: Math.round(height * 0.25),
        width: Math.round(width * 0.5),
        height: Math.round(height * 0.5),
      })
      .stats();
    return nearestColorName(dominant.r, dominant.g, dominant.b);
  } catch {
    return undefined;
  }
}

export async function analyzeWithOcr(imageUrl: string): Promise<Partial<ImageSignals>> {
  const original = await fetchImage(imageUrl);

  // Greyscale + normalize + upscale small images helps OCR on labels.
  const prepared = await sharp(original)
    .rotate()
    .greyscale()
    .normalize()
    .resize({ width: 2000, height: 2000, fit: 'inside' })
    .sharpen()
    .png()
    .toBuffer();

  const { data } = await recognize(prepared);
  const extracted = extractSignalsFromOcr({
    lines: data.lines ?? [],
    words: data.words ?? [],
  });

  return { ...extracted, color: await centreColor(original) };
}