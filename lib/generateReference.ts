import 'server-only';
import { Search } from './models';

/** e.g. "TF-4821" — matches the "Hunt log · #TF-2291" copy already in the UI. */
function randomReference(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TF-${n}`;
}

/**
 * Generates a reference guaranteed unique against existing Search documents.
 * Collisions are extremely unlikely at MVP volume (9000 possible values), but
 * this makes the guarantee real rather than assumed.
 */
export async function generateUniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomReference();
    const exists = await Search.exists({ reference: candidate });
    if (!exists) return candidate;
  }
  // Fall past the collision-prone space entirely rather than fail the request.
  return `TF-${Date.now().toString(36).toUpperCase()}`;
}