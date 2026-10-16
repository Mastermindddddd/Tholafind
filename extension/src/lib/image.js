// Image helpers for the background context (OffscreenCanvas works in both
// Chrome service workers and Firefox/Safari background pages).

const MAX_SIDE = 1600;
const MAX_BYTES = 8 * 1024 * 1024;

export async function bytesToDataUrl(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

export async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

/**
 * Decode any browser-readable image (jpeg/png/webp/avif/gif), optionally crop
 * `rect` (in CSS pixels of a viewport `vw` CSS px wide), and re-encode as JPEG
 * with the long side capped. Always re-encoding means the server only ever sees
 * jpeg, and drops metadata from the pixels we send.
 */
export async function normalizeToJpeg(blob, rect) {
  const bmp = await createImageBitmap(blob);
  try {
    let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
    if (rect) {
      const scale = bmp.width / rect.vw;
      sx = Math.max(0, Math.round(rect.x * scale));
      sy = Math.max(0, Math.round(rect.y * scale));
      sw = Math.min(bmp.width - sx, Math.round(rect.w * scale));
      sh = Math.min(bmp.height - sy, Math.round(rect.h * scale));
    }
    if (sw < 2 || sh < 2) throw new Error('That selection is too small.');
    const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k));
    const h = Math.max(1, Math.round(sh * k));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // flatten transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
    const out = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    if (out.size > MAX_BYTES) throw new Error('That image is too large.');
    return { blob: out, width: w, height: h };
  } finally {
    bmp.close?.();
  }
}

export async function thumbDataUrl(blob, side = 120) {
  const bmp = await createImageBitmap(blob);
  try {
    const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k));
    const h = Math.max(1, Math.round(bmp.height * k));
    const c = new OffscreenCanvas(w, h);
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return bytesToDataUrl(await c.convertToBlob({ type: 'image/jpeg', quality: 0.7 }));
  } finally {
    bmp.close?.();
  }
}
