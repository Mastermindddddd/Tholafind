// On-device OCR. Runs in an offscreen document (Chrome) or hidden iframe (Firefox/Safari).
// The image never leaves the device for this step; only the recognised text is sent on.
const api = globalThis.browser ?? globalThis.chrome;
const u = (p) => api.runtime.getURL(p);

let workerPromise = null;
function getWorker() {
  if (!workerPromise) {
    if (typeof Tesseract === 'undefined') return Promise.reject(new Error('OCR engine not bundled'));
    workerPromise = Tesseract.createWorker('eng', 1, {
      workerPath: u('vendor/worker.min.js'),
      corePath: u('vendor/core/'),
      langPath: u('vendor/lang/'),
      workerBlobURL: false,
    }).catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

function pick(items) {
  return (items || [])
    .map((i) => ({ text: String(i.text || '').trim(), confidence: Number(i.confidence) }))
    .filter((i) => i.text && Number.isFinite(i.confidence));
}

// Serialise recognitions: one worker, one job at a time.
let queue = Promise.resolve();
function recognise(dataUrl) {
  const run = queue.then(async () => {
    const worker = await getWorker();
    const { data } = await worker.recognize(dataUrl);
    let lines = data.lines, words = data.words;
    if (!lines && data.blocks) { // newer tesseract.js shapes
      lines = data.blocks.flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
      words = lines.flatMap((l) => l.words);
    }
    return { lines: pick(lines).slice(0, 60), words: pick(words).slice(0, 200) };
  });
  queue = run.catch(() => {});
  return run;
}

api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.target !== 'offscreen' || msg.type !== 'ocr') return;
  recognise(msg.dataUrl)
    .then((ocr) => sendResponse({ ok: true, ocr }))
    .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
  return true;
});
