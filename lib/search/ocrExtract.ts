import type { ImageSignals } from './types';

/**
 * Pure parsing of OCR output into search signals. No I/O, so it can be unit
 * tested on its own. The free replacement for the vision-model pass: it can
 * only find what is WRITTEN on the item (tags, labels, care labels, stamps).
 * It cannot judge logos, stitching, shape or item type.
 */

export interface OcrLine {
  text: string;
  confidence: number;
}
export interface OcrWord {
  text: string;
  confidence: number;
}

const MIN_LINE_CONF = 60;
const MIN_WORD_CONF = 70;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// A modest list of common brands. A brand is only reported when its name is
// actually printed in the OCR text; extend freely.
const BRANDS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Asics', 'Converse', 'Vans', 'Under Armour',
  'Fila', 'Skechers', 'Jordan', 'Levi’s', 'Wrangler', 'Lee', 'Gap', 'Zara', 'H&M', 'Uniqlo',
  'Mango', 'Gucci', 'Prada', 'Louis Vuitton', 'Chanel', 'Dior', 'Burberry', 'Hermes', 'Versace',
  'Balenciaga', 'Fendi', 'Ralph Lauren', 'Polo', 'Tommy Hilfiger', 'Calvin Klein', 'Lacoste',
  'Hugo Boss', 'Guess', 'Diesel', 'Supreme', 'Carhartt', 'The North Face', 'Patagonia', 'Columbia',
  'Timberland', 'Dr. Martens', 'Clarks', 'Ugg', 'Birkenstock', 'Crocs', 'Hoka', 'Brooks', 'Salomon',
  'Mizuno', 'Champion', 'Hanes', 'Gymshark', 'Lululemon', 'Ikea', 'Apple', 'Samsung', 'Sony', 'Bose',
  'JBL', 'LG', 'Panasonic', 'Philips', 'Dyson', 'Nespresso', 'KitchenAid', 'Le Creuset', 'Pyrex',
  'Tupperware', 'Stanley', 'Yeti', 'Hydro Flask', 'Coach', 'Michael Kors', 'Kate Spade', 'Fossil',
  'Casio', 'Seiko', 'Citizen', 'Timex', 'Rolex', 'Omega', 'Lego', 'Mattel', 'Hasbro', 'Fisher-Price',
  'Sennheiser', 'Canon', 'Nikon', 'Fujifilm', 'Garmin', 'Fitbit', 'Bosch', 'Makita', 'DeWalt',
  'Truworths', 'Woolworths', 'Mr Price', 'Pick n Pay', 'Cotton On', 'Edgars', 'Jet', 'Pep',
].map((name) => ({ name, key: ` ${norm(name)} `, len: norm(name).length }));

const MATERIAL_WORDS = [
  'cotton', 'polyester', 'wool', 'nylon', 'silk', 'linen', 'cashmere', 'viscose', 'rayon', 'acrylic',
  'elastane', 'spandex', 'lycra', 'polyamide', 'leather', 'suede', 'denim', 'velvet', 'fleece',
];

// Named colors for a rough "what color is the item" guess from pixels.
const COLORS: [string, number, number, number][] = [
  ['black', 20, 20, 20], ['white', 240, 240, 240], ['gray', 128, 128, 128],
  ['red', 200, 40, 40], ['orange', 235, 130, 40], ['yellow', 235, 210, 60],
  ['green', 60, 150, 70], ['blue', 50, 90, 190], ['navy', 25, 35, 90],
  ['purple', 120, 60, 150], ['pink', 235, 140, 175], ['brown', 115, 75, 45],
  ['beige', 215, 195, 160],
];

export function nearestColorName(r: number, g: number, b: number): string {
  let best = COLORS[0][0];
  let bestD = Infinity;
  for (const [name, cr, cg, cb] of COLORS) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

const CODE_RE =
  /^(?=[A-Z0-9\-/.]*\d)(?=[A-Z0-9\-/.]*[A-Z])[A-Z0-9][A-Z0-9\-/.]{3,18}[A-Z0-9]$/;
// Garment registration / care-label numbers look like style codes but aren't.
const NOT_A_CODE = /^(RN|CA|WPL)\d+$/;
const LABELLED_CODE_RE =
  /\b(?:style|art(?:icle)?|ref|model|sku|item)\s*(?:no\.?|#|:)?\s*([A-Z0-9][A-Z0-9\-/.]{3,18})/gi;

function findBrand(fullText: string): string | undefined {
  const hay = ` ${norm(fullText)} `;
  let best: { name: string; len: number } | undefined;
  for (const b of BRANDS) {
    if (hay.includes(b.key) && (!best || b.len > best.len)) best = { name: b.name, len: b.len };
  }
  return best?.name;
}

function findMaterial(fullText: string): string | undefined {
  const lower = fullText.toLowerCase();
  // Prefer the dominant fibre on a composition label ("95% cotton, 5% elastane").
  let top: { pct: number; word: string } | undefined;
  for (const m of lower.matchAll(/(\d{1,3})\s*%\s*([a-z]+)/g)) {
    const pct = Number(m[1]);
    if (MATERIAL_WORDS.includes(m[2]) && (!top || pct > top.pct)) top = { pct, word: m[2] };
  }
  if (top) return top.word;
  return MATERIAL_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower));
}

export function extractSignalsFromOcr(ocr: {
  lines: OcrLine[];
  words: OcrWord[];
}): Pick<ImageSignals, 'tagText' | 'modelCodes' | 'designCues'> &
  Partial<Pick<ImageSignals, 'brand' | 'material'>> {
  const lines: string[] = [];
  for (const l of ocr.lines) {
    if (l.confidence < MIN_LINE_CONF) continue;
    const text = l.text.replace(/\s+/g, ' ').trim();
    if ((text.match(/[A-Za-z0-9]/g) ?? []).length < 4) continue;
    if (!lines.includes(text)) lines.push(text);
  }
  const fullText = lines.join('\n');

  const codes: string[] = [];
  const addCode = (raw: string) => {
    const c = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').toUpperCase();
    if (!CODE_RE.test(c) || NOT_A_CODE.test(c) || codes.includes(c)) return;
    codes.push(c);
  };
  for (const w of ocr.words) {
    if (w.confidence >= MIN_WORD_CONF) addCode(w.text);
  }
  for (const m of fullText.matchAll(LABELLED_CODE_RE)) {
    if (/\d/.test(m[1])) addCode(m[1]);
  }

  return {
    brand: findBrand(fullText),
    tagText: lines.slice(0, 8).map((t) => t.slice(0, 60)),
    modelCodes: codes.slice(0, 4),
    material: findMaterial(fullText),
    // Not available without a vision model: stitching, logo shape, silhouette.
    designCues: [],
  };
}