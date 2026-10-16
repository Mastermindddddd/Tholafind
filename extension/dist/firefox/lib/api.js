import { API_BASE } from './config.js';
import { getToken, clearToken } from './ext.js';

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/** Reads an NDJSON response, calling onEvent for each parsed line. */
async function readNdjson(res, onEvent, signal) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let last = null;
  for (;;) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      last = ev;
      onEvent(ev);
    }
  }
  return last;
}

async function failFromResponse(res) {
  let body = {};
  try { body = await res.json(); } catch { /* not json */ }
  if (res.status === 401) {
    await clearToken();
    throw new ApiError('Reconnect the extension to your account.', 'unauthorized');
  }
  if (res.status === 429) throw new ApiError(body.message || 'Too many searches. Try again later.', 'rate_limited');
  throw new ApiError(body.message || `Something went wrong (${res.status}).`, 'failed');
}

async function streamed(url, init, onEvent, signal) {
  let res;
  try {
    res = await fetch(url, { ...init, signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError('Couldn’t reach Tholafind. Check your connection.', 'network');
  }
  if (!res.ok) await failFromResponse(res);
  const last = await readNdjson(res, onEvent, signal);
  if (!last || last.type !== 'done') {
    throw new ApiError(last?.type === 'error' ? last.message : 'The hunt didn’t finish. Try again.', 'failed');
  }
  return last;
}

export async function startHunt({ blob, hint, ocr, host }, onEvent, signal) {
  const token = await getToken();
  if (!token) throw new ApiError('Connect your account first.', 'unauthorized');
  const fd = new FormData();
  fd.append('file', blob, 'hunt.jpg');
  if (hint) fd.append('hint', hint);
  if (ocr) fd.append('ocr', ocr);
  if (host) fd.append('host', host);
  return streamed(`${API_BASE}/api/extension/hunt`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  }, onEvent, signal);
}

export async function refineHunt(searchId, hint, onEvent, signal) {
  const token = await getToken();
  if (!token) throw new ApiError('Connect your account first.', 'unauthorized');
  return streamed(`${API_BASE}/api/extension/hunt/${encodeURIComponent(searchId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hint }),
  }, onEvent, signal);
}

export async function checkConnected() {
  const token = await getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/api/extension/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { await clearToken(); return false; }
    return res.ok;
  } catch {
    return null; // unknown (offline)
  }
}

export async function revoke() {
  const token = await getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/extension/token`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  } catch { /* still clear locally */ }
  await clearToken();
}
