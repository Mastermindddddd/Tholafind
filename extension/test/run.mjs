// End-to-end test in real Chromium against a mock Tholafind server.
// Covers: pairing handshake, right-click-image path (direct fetch AND screenshot fallback),
// crop/snip drag, panel rendering, refine, auth failure, OCR-unavailable fallback.
// NOT covered: the real context-menu click / activeTab grant (browser chrome), real tesseract OCR.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'http://localhost:4100', SITE = 'http://localhost:4200';
const shots = path.join(root, 'test', 'screenshots');
fs.mkdirSync(shots, { recursive: true });

// --- a red/green test image
const img = Buffer.from(execSync(`python3 -c "
from PIL import Image,ImageDraw;import io,sys
im=Image.new('RGB',(400,300),(200,60,50));d=ImageDraw.Draw(im);d.ellipse((100,60,300,240),fill=(240,230,200));
b=io.BytesIO();im.save(b,'JPEG');sys.stdout.buffer.write(b.getvalue())"`, { maxBuffer: 1e7 }));

// --- mock Tholafind API
const log = { hunts: [], refines: [], tokens: 0 };
let validToken = null;
const api = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    const authed = req.headers.authorization === `Bearer ${validToken}` && validToken;
    if (req.url === '/extension/connect') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(`<!doctype html><body><div id=s>checking</div><button id=b hidden>Connect extension</button><script>
        window.addEventListener('message',e=>{const d=e.data;if(!d||d.source!=='tholafind-ext')return;
          if(d.type==='hello'){s.textContent='ready';b.hidden=false}
          if(d.type==='token-saved'){s.textContent='Connected'}});
        const ping=()=>postMessage({source:'tholafind-web',type:'ping'},location.origin);ping();setTimeout(ping,500);
        b.onclick=async()=>{const r=await fetch('/api/extension/token',{method:'POST'});const j=await r.json();
          postMessage({source:'tholafind-web',type:'extension-token',token:j.token},location.origin)};
      </script>`);
    }
    if (req.url === '/api/extension/token' && req.method === 'POST') {
      validToken = 'tf_ext_' + 'A'.repeat(43); log.tokens++;
      res.writeHead(200, { 'Content-Type': 'application/json', ...cors }); return res.end(JSON.stringify({ ok: true, token: validToken }));
    }
    if (req.url === '/api/extension/me') { res.writeHead(authed ? 200 : 401, cors); return res.end('{}'); }
    if (req.url === '/api/extension/token' && req.method === 'DELETE') { validToken = null; res.writeHead(200, cors); return res.end('{}'); }
    if (req.url === '/img-cors.jpg') { res.writeHead(200, { 'Content-Type': 'image/jpeg', ...cors }); return res.end(img); }
    if (req.url === '/img-nocors.jpg') { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); return res.end(img); }

    const isHunt = req.url === '/api/extension/hunt' || req.url.startsWith('/api/extension/hunt/');
    if (!isHunt) { res.writeHead(404); return res.end(); }
    if (!authed) { res.writeHead(401, { 'Content-Type': 'application/json', ...cors }); return res.end('{"ok":false}'); }
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson', ...cors });
    const line = (o) => res.write(JSON.stringify(o) + '\n');
    line({ type: 'started', searchId: 'abc123' });
    let hint = null;
    if (req.url === '/api/extension/hunt') {
      const txt = body.toString('latin1');
      log.hunts.push({ file: /name="file"/.test(txt), ocr: /name="ocr"/.test(txt), host: (txt.match(/name="host"\r\n\r\n([^\r]+)/) || [])[1], bytes: body.length });
    } else { hint = JSON.parse(body.toString()).hint; log.refines.push(hint); }
    await new Promise((r) => setTimeout(r, 400));
    line({ type: 'status', message: 'Searching retail, resale and vintage…' });
    await new Promise((r) => setTimeout(r, 400));
    line({ type: 'done', searchId: 'abc123', reference: 'TF-1234', status: hint ? 'complete' : 'low_confidence',
      resultsUrl: `${API}/results/abc123`, total: 3, hint,
      diagnosis: hint ? null : { explanation: 'The photo is a little small, so matches are a guess. Add a detail to sharpen them.', missing: ['brand', 'material'] },
      results: [
        { id: '1', title: hint ? `${hint} Heritage Jacket <b>raw</b>` : 'Vintage red jacket', image: 'https://example.com/x.jpg', price: '$91.97', source: 'Grailed', sourceKind: 'resale', confidence: hint ? 'exact' : 'close', matchScore: hint ? 95 : 68, reason: 'Listing confirmed in stock', url: 'https://example.com/a' },
        { id: '2', title: 'Red zip jacket', image: 'https://example.com/y.jpg', price: 'See price on site', source: 'eBay', sourceKind: 'resale', confidence: 'guess', matchScore: 41, reason: null, url: 'javascript:alert(1)' },
      ] });
    res.end();
  });
});

// --- a "store" page with two images (one CORS-readable, one not) and room to drag
const site = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!doctype html><body style="margin:0;font:16px sans-serif"><h1>Shop</h1>
    <img id=a src="${API}/img-cors.jpg" width=400 height=300 style="margin:20px">
    <img id=b src="${API}/img-nocors.jpg" width=400 height=300 style="margin:20px"></body>`);
});

await new Promise((r) => api.listen(4100, r));
await new Promise((r) => site.listen(4200, r));

execSync(`node scripts/build.mjs --target chrome --base ${API} --test`, { cwd: root, stdio: 'inherit' });
// open shadow root in the test build so Playwright can look inside the panel
const pj = path.join(root, 'dist/chrome-test/panel.js');
fs.writeFileSync(pj, fs.readFileSync(pj, 'utf8').replace("mode: 'closed'", "mode: 'open'"));

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'tf-')), {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${path.join(root, 'dist/chrome-test')}`, `--load-extension=${path.join(root, 'dist/chrome-test')}`],
  viewport: { width: 1100, height: 800 },
});
let sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');

const hunt = (fn, arg) => sw.evaluate(fn, arg);
const activeTab = (url) => `(async()=>{const [t]=await chrome.tabs.query({url:'${url}*'});return t})()`;

try {
  // 1. pairing
  const connect = await ctx.newPage();
  await connect.goto(`${API}/extension/connect`);
  await connect.locator('#b').click({ timeout: 5000 });
  await connect.waitForFunction(() => document.getElementById('s').textContent === 'Connected', null, { timeout: 5000 });
  const stored = await sw.evaluate(() => chrome.storage.local.get('tf_token'));
  check('pairing: token minted by site reaches the extension', stored.tf_token?.startsWith('tf_ext_'));

  // 2. a page other than the connect page must NOT be able to hand over a token
  const evil = await ctx.newPage();
  await evil.goto(`${SITE}/`); await evil.close();
  const sneaky = await sw.evaluate(async () => {
    return await new Promise((r) => chrome.runtime.onMessage.hasListeners() && r('listener-present'));
  });
  void sneaky; // content script isn't injected on other origins at all; verified by manifest match below
  const mf = JSON.parse(fs.readFileSync(path.join(root, 'dist/chrome-test/manifest.json'), 'utf8'));
  check('relay content script is scoped to the connect page only', mf.content_scripts.length === 1 && mf.content_scripts[0].matches[0] === `${API}/extension/connect*`);

  // 3. right-click image, original reachable (CORS) -> direct fetch path
  const page = await ctx.newPage();
  await page.goto(`${SITE}/`);
  await page.bringToFront();
  const tabUrl = `${SITE}/`;
  const run = (src) => sw.evaluate(async ({ tabUrl, src }) => {
    const [t] = await chrome.tabs.query({ url: tabUrl + '*', active: true });
    await globalThis.__tf.huntFromImage(t, src);
  }, { tabUrl, src });

  const p1 = run(`${API}/img-cors.jpg`);
  p1.catch((e) => console.log('SW run error:', e.message));
  ctx.on('console', (m) => console.log('console:', m.text()));
  sw.on('console', (m) => console.log('sw console:', m.text()));
  await new Promise((r) => setTimeout(r, 2500));
  console.log('DBG host count', await page.locator('[data-tholafind=panel]').count(), 'url', page.url(), 'tabs', await sw.evaluate(async()=>JSON.stringify((await chrome.tabs.query({})).map(t=>[t.id,t.url,t.active]))));
  await page.locator('.card').waitFor({ timeout: 8000 });
  await page.getByText('Vintage red jacket').waitFor({ timeout: 15000 });
  await p1;
  await page.screenshot({ path: path.join(shots, '1-results-low-confidence.png') });
  check('image hunt (direct fetch): panel shows results', await page.getByText('3 matches found').count() === 1);
  check('server got file + host, host is a hostname only', log.hunts[0]?.file && log.hunts[0].host === 'localhost', JSON.stringify(log.hunts[0]));
  check('OCR engine absent -> hunt still ran without ocr field', log.hunts[0] && !log.hunts[0].ocr);
  check('diagnosis + attribute prompt shown when confidence low', await page.getByPlaceholder('e.g. Stüssy leather').count() === 1);
  check('confidence chip rendered ("68% match")', await page.getByText('68% match', { exact: true }).count() === 1);
  const href2 = await page.locator('a.res').nth(1).getAttribute('href');
  check('javascript: result URL neutralised', href2 === '#', href2);

  // 4. refine
  await page.getByPlaceholder('e.g. Stüssy leather').fill('Stüssy leather');
  await page.getByRole('button', { name: 'Search again' }).click();
  await page.getByText('95% match', { exact: true }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(shots, '2-results-refined.png') });
  check('refine sends hint and re-renders higher confidence', log.refines[0] === 'Stüssy leather');
  check('third-party HTML in titles is shown as text, not parsed', (await page.locator('.res b').count()) === 0 && await page.getByText('<b>raw</b>', { exact: false }).count() === 1);

  // 5. close
  await page.locator('.x').click();
  check('panel closes', await page.locator('.card').count() === 0);

  // 6. right-click image, original NOT readable (no CORS) -> screenshot-crop fallback
  const before = log.hunts.length;
  const p2 = run(`${API}/img-nocors.jpg`);
  await page.getByText('3 matches found').waitFor({ timeout: 20000 });
  await p2;
  check('image hunt (CORS-blocked) falls back to cropping the visible tab', log.hunts.length === before + 1 && log.hunts[before].file);
  await page.locator('.x').click();

  // 7. snip drag
  const p3 = sw.evaluate(async (tabUrl) => { const [t] = await chrome.tabs.query({ url: tabUrl + '*', active: true }); await globalThis.__tf.huntFromSnip(t); }, tabUrl);
  await page.waitForFunction(() => !!document.querySelector('[data-tholafind=snip]'), null, { timeout: 5000 });
  await page.screenshot({ path: path.join(shots, '3-snip-overlay.png') });
  const b0 = log.hunts.length;
  await page.mouse.move(60, 140); await page.mouse.down(); await page.mouse.move(300, 330, { steps: 6 }); await page.mouse.up();
  await page.getByText('3 matches found').waitFor({ timeout: 20000 });
  await p3;
  check('crop tool: dragged region becomes a hunt', log.hunts.length === b0 + 1);
  check('snip overlay removed afterwards', await page.locator('[data-tholafind=snip]').count() === 0);
  await page.locator('.x').click();

  // 8. Esc cancels snip, no hunt
  const b1 = log.hunts.length;
  const p4 = sw.evaluate(async (tabUrl) => { const [t] = await chrome.tabs.query({ url: tabUrl + '*', active: true }); await globalThis.__tf.huntFromSnip(t); }, tabUrl);
  await page.waitForFunction(() => !!document.querySelector('[data-tholafind=snip]'), null, { timeout: 5000 });
  await page.keyboard.press('Escape'); await p4;
  check('Esc cancels the crop without starting a hunt', log.hunts.length === b1 && await page.locator('.card').count() === 0);

  // 9. revoked/invalid token -> asks to reconnect
  validToken = 'tf_ext_' + 'B'.repeat(43);
  const p5 = run(`${API}/img-cors.jpg`);
  await page.getByText('Connect account').waitFor({ timeout: 10000 });
  await p5;
  await page.screenshot({ path: path.join(shots, '4-reconnect.png') });
  const cleared = await sw.evaluate(() => chrome.storage.local.get('tf_token'));
  check('401 clears the stored token and prompts to reconnect', !cleared.tf_token);
} catch (e) {
  console.error('TEST ERROR', e);
  results.push(false);
  try { for (const p of ctx.pages()) await p.screenshot({ path: path.join(shots, 'error.png') }); } catch {}
} finally {
  await ctx.close(); api.close(); site.close();
}
const pass = results.filter(Boolean).length;
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
