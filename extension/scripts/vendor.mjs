// Copies tesseract.js v5 + English data into vendor/ so OCR runs fully offline inside the extension.
// Requires: npm install   (from this folder)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = path.join(root, 'node_modules');
const out = path.join(root, 'vendor');
const need = (p) => { if (!fs.existsSync(p)) throw new Error(`Missing ${p}. Run "npm install" first.`); return p; };

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'core'), { recursive: true });
fs.mkdirSync(path.join(out, 'lang'), { recursive: true });

fs.copyFileSync(need(path.join(nm, 'tesseract.js/dist/tesseract.min.js')), path.join(out, 'tesseract.min.js'));
fs.copyFileSync(need(path.join(nm, 'tesseract.js/dist/worker.min.js')), path.join(out, 'worker.min.js'));

const coreDir = need(path.join(nm, 'tesseract.js-core'));
for (const f of fs.readdirSync(coreDir)) {
  if (/^tesseract-core.*\.(wasm|wasm\.js)$/.test(f)) fs.copyFileSync(path.join(coreDir, f), path.join(out, 'core', f));
}

const langDir = need(path.join(nm, '@tesseract.js-data/eng/4.0.0_best_int'));
fs.copyFileSync(path.join(langDir, 'eng.traineddata.gz'), path.join(out, 'lang', 'eng.traineddata.gz'));
console.log('vendored OCR engine ->', path.relative(process.cwd(), out));
