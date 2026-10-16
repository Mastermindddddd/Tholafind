import { ext, getToken, setToken, hostOf } from './lib/ext.js';
import { API_BASE, TEST_BUILD } from './lib/config.js';
import { bytesToDataUrl, dataUrlToBlob, normalizeToJpeg, thumbDataUrl } from './lib/image.js';
import { startHunt, refineHunt, checkConnected, revoke, ApiError } from './lib/api.js';

const MENU_IMAGE = 'tf-image';
const MENU_SNIP = 'tf-snip';
const OCR_TIMEOUT_MS = 15000;
const SNIP_TIMEOUT_MS = 120000;

/** Per-tab hunt state, kept in memory (a retry after the worker sleeps asks for a fresh capture). */
const jobs = new Map(); // tabId -> { controller, blob, host, searchId, thumb }
const pendingSnips = new Map(); // tabId -> resolve

// ---------- menus & shortcuts ----------

ext.runtime.onInstalled.addListener(() => {
  ext.contextMenus.removeAll(() => {
    ext.contextMenus.create({ id: MENU_IMAGE, title: 'Hunt this on Tholafind', contexts: ['image'] });
    ext.contextMenus.create({ id: MENU_SNIP, title: 'Crop an area & hunt on Tholafind', contexts: ['page', 'frame', 'video', 'selection'] });
  });
});

ext.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === MENU_IMAGE && info.srcUrl) huntFromImage(tab, info.srcUrl);
  else if (info.menuItemId === MENU_SNIP) huntFromSnip(tab);
});

ext.commands?.onCommand.addListener(async (command) => {
  if (command !== 'snip') return;
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) huntFromSnip(tab);
});

// ---------- messages ----------

ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.target === 'offscreen') return; // not for us
  const tabId = sender.tab?.id;

  switch (msg.type) {
    case 'snip-result': {
      pendingSnips.get(tabId)?.(msg.rect ?? null);
      return;
    }
    case 'save-token': {
      // Only the connect page of OUR Tholafind origin may hand us a token.
      const ok = typeof msg.token === 'string' && /^tf_ext_[A-Za-z0-9_-]{20,100}$/.test(msg.token) && isConnectPage(sender.url);
      (async () => { if (ok) await setToken(msg.token); sendResponse({ ok }); })();
      return true;
    }
    case 'status': {
      checkConnected().then((connected) => sendResponse({ connected, base: API_BASE }));
      return true;
    }
    case 'disconnect': {
      revoke().then(() => sendResponse({ ok: true }));
      return true;
    }
    case 'start-snip': {
      (async () => {
        const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) huntFromSnip(tab);
        sendResponse({ ok: !!tab });
      })();
      return true;
    }
    case 'open-connect': {
      ext.tabs.create({ url: `${API_BASE}/extension/connect` });
      return;
    }
    case 'refine': if (tabId != null) refine(tabId, String(msg.hint || '').slice(0, 280)); return;
    case 'retry': if (tabId != null) retry(tabId); return;
    case 'cancel': if (tabId != null) cancel(tabId); return;
  }
});

function isConnectPage(url) {
  try {
    const u = new URL(url);
    return u.origin === new URL(API_BASE).origin && u.pathname.startsWith('/extension/connect');
  } catch {
    return false;
  }
}

// ---------- panel plumbing ----------

async function ensurePanel(tabId) {
  await ext.scripting.executeScript({ target: { tabId }, files: ['panel.js'] });
}
function panel(tabId, message) {
  return ext.tabs.sendMessage(tabId, { target: 'panel', ...message }).catch(() => {});
}
async function openPanel(tab) {
  try {
    await ensurePanel(tab.id);
    return true;
  } catch {
    // chrome://, the web store, PDFs viewers etc. can't be scripted.
    ext.action.setBadgeText({ tabId: tab.id, text: '!' });
    ext.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#a63d2f' });
    setTimeout(() => ext.action.setBadgeText({ tabId: tab.id, text: '' }), 4000);
    return false;
  }
}

// ---------- capture ----------

/** Runs in the page: finds the <img> for srcUrl, scrolls it into view, returns its viewport rect. */
async function findImageRect(srcUrl) {
  const imgs = Array.from(document.images);
  const el = imgs.find((i) => i.currentSrc === srcUrl || i.src === srcUrl);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 200));
  const r = el.getBoundingClientRect();
  const x = Math.max(0, r.left), y = Math.max(0, r.top);
  const w = Math.min(innerWidth, r.right) - x, h = Math.min(innerHeight, r.bottom) - y;
  if (w < 16 || h < 16) return null;
  return { x, y, w, h, vw: innerWidth };
}

async function captureRect(tab, rect) {
  // Give the page a frame to repaint without our overlay/panel flicker.
  await new Promise((r) => setTimeout(r, 60));
  const dataUrl = await ext.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return normalizeToJpeg(await dataUrlToBlob(dataUrl), rect);
}

async function huntFromImage(tab, srcUrl) {
  if (!(await openPanel(tab))) return;
  await panel(tab.id, { state: 'working', step: 'Grabbing the image…' });
  try {
    let jpeg = null;
    // 1) The original file, when the CDN lets us have it (best quality).
    try {
      const res = await fetch(srcUrl, { credentials: 'omit' });
      const blob = await res.blob();
      if (res.ok && blob.type.startsWith('image/') && blob.size < 20 * 1024 * 1024) {
        jpeg = (await normalizeToJpeg(blob)).blob;
      }
    } catch { /* blocked by CORS/blob: URL etc. — fall through */ }

    // 2) Otherwise take what is on screen: crop the image out of the tab.
    if (!jpeg) {
      const [{ result: rect } = {}] = await ext.scripting.executeScript({
        target: { tabId: tab.id }, func: findImageRect, args: [srcUrl],
      });
      if (!rect) throw new ApiError('Couldn’t read that image. Try the crop tool instead.', 'capture');
      jpeg = (await captureRect(tab, rect)).blob;
    }
    await runHunt(tab, jpeg);
  } catch (e) {
    await panel(tab.id, { state: 'error', message: friendly(e), canRetry: false });
  }
}

async function huntFromSnip(tab) {
  if (!(await openPanel(tab))) return;
  try {
    await ext.scripting.executeScript({ target: { tabId: tab.id }, files: ['snip.js'] });
    const rect = await new Promise((resolve) => {
      const t = setTimeout(() => { pendingSnips.delete(tab.id); resolve(null); }, SNIP_TIMEOUT_MS);
      pendingSnips.set(tab.id, (r) => { clearTimeout(t); pendingSnips.delete(tab.id); resolve(r); });
    });
    if (!rect) { await panel(tab.id, { state: 'close' }); return; }
    await panel(tab.id, { state: 'working', step: 'Capturing your selection…' });
    const { blob } = await captureRect(tab, rect);
    await runHunt(tab, blob);
  } catch (e) {
    await panel(tab.id, { state: 'error', message: friendly(e), canRetry: false });
  }
}

// ---------- OCR (on-device) ----------

let ocrHostReady = null;
async function ensureOcrHost() {
  if (ocrHostReady) return ocrHostReady;
  ocrHostReady = (async () => {
    if (ext.offscreen) {
      const existing = ext.runtime.getContexts
        ? await ext.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })
        : [];
      if (existing.length === 0) {
        await ext.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['WORKERS'],
          justification: 'Read tag and label text from images on this device before searching.',
        });
      }
    } else {
      // Firefox / Safari: the background page has a DOM, so host the OCR page in a hidden iframe.
      const f = document.createElement('iframe');
      f.src = ext.runtime.getURL('offscreen.html');
      f.style.display = 'none';
      document.body.appendChild(f);
      await new Promise((r) => f.addEventListener('load', r, { once: true }));
    }
  })().catch((e) => { ocrHostReady = null; throw e; });
  return ocrHostReady;
}

/** Returns a JSON string of {lines, words} or null. OCR is an enhancement: it never blocks or fails a hunt. */
async function runOcr(blob) {
  try {
    await ensureOcrHost();
    const dataUrl = await bytesToDataUrl(blob);
    const res = await Promise.race([
      ext.runtime.sendMessage({ target: 'offscreen', type: 'ocr', dataUrl }),
      new Promise((r) => setTimeout(() => r(null), OCR_TIMEOUT_MS)),
    ]);
    if (!res?.ok || !res.ocr) return null;
    const json = JSON.stringify(res.ocr);
    return json.length <= 60000 ? json : null;
  } catch {
    return null;
  }
}

// ---------- the hunt ----------

function friendly(e) {
  if (e?.name === 'AbortError') return 'Cancelled.';
  if (e instanceof ApiError) return e.message;
  return e?.message || 'Something went wrong.';
}

function keepAlive() {
  // Pings reset the MV3 idle timer while a long (up to ~60s) hunt streams in.
  return setInterval(() => ext.runtime.getPlatformInfo?.(), 20000);
}

async function runHunt(tab, blob) {
  const tabId = tab.id;
  cancel(tabId, true);

  if (!(await getToken())) {
    await panel(tabId, { state: 'connect' });
    return;
  }

  const controller = new AbortController();
  const job = { controller, blob, host: hostOf(tab.url), searchId: null, thumb: await thumbDataUrl(blob).catch(() => null) };
  jobs.set(tabId, job);
  const ka = keepAlive();

  try {
    await panel(tabId, { state: 'working', step: 'Reading any tag or label text…', thumb: job.thumb });
    const ocr = await runOcr(blob);
    if (controller.signal.aborted) return;

    await panel(tabId, { state: 'working', step: 'Searching retail, resale and vintage…', thumb: job.thumb });
    const done = await startHunt({ blob, ocr, host: job.host }, (ev) => onHuntEvent(tabId, job, ev), controller.signal);
    job.searchId = done.searchId;
    await panel(tabId, { state: 'results', thumb: job.thumb, hunt: done });
  } catch (e) {
    if (e?.name === 'AbortError') return;
    if (e?.code === 'unauthorized') await panel(tabId, { state: 'connect' });
    else await panel(tabId, { state: 'error', message: friendly(e), canRetry: true });
  } finally {
    clearInterval(ka);
  }
}

function onHuntEvent(tabId, job, ev) {
  if (ev.type === 'started') job.searchId = ev.searchId;
  if (ev.type === 'status') panel(tabId, { state: 'working', step: ev.message, thumb: job.thumb });
}

async function refine(tabId, hint) {
  const job = jobs.get(tabId);
  if (!job?.searchId || !hint) return;
  job.controller.abort();
  const controller = (job.controller = new AbortController());
  const ka = keepAlive();
  try {
    await panel(tabId, { state: 'working', step: 'Searching again with your detail…', thumb: job.thumb });
    const done = await refineHunt(job.searchId, hint, (ev) => onHuntEvent(tabId, job, ev), controller.signal);
    await panel(tabId, { state: 'results', thumb: job.thumb, hunt: done });
  } catch (e) {
    if (e?.name === 'AbortError') return;
    if (e?.code === 'unauthorized') await panel(tabId, { state: 'connect' });
    else await panel(tabId, { state: 'error', message: friendly(e), canRetry: true });
  } finally {
    clearInterval(ka);
  }
}

async function retry(tabId) {
  const job = jobs.get(tabId);
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  if (job?.blob && tab?.id === tabId) await runHunt(tab, job.blob);
  else await panel(tabId, { state: 'error', message: 'Capture the image again to retry.', canRetry: false });
}

function cancel(tabId, silent = false) {
  const job = jobs.get(tabId);
  job?.controller.abort();
  if (!silent) { jobs.delete(tabId); panel(tabId, { state: 'close' }); }
}

ext.tabs.onRemoved.addListener((tabId) => { jobs.get(tabId)?.controller.abort(); jobs.delete(tabId); });

// Playwright can't click browser-chrome menus, so test builds expose the same handlers.
if (TEST_BUILD) globalThis.__tf = { huntFromImage, huntFromSnip, refine, jobs };
