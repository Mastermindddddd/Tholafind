// Runs ONLY on <site>/extension/connect. Relays the pairing handshake between
// the page (window.postMessage) and the extension (runtime messages).
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data;
    if (!d || d.source !== 'tholafind-web') return;

    if (d.type === 'ping') {
      window.postMessage({ source: 'tholafind-ext', type: 'hello' }, location.origin);
    } else if (d.type === 'extension-token' && typeof d.token === 'string') {
      Promise.resolve(api.runtime.sendMessage({ type: 'save-token', token: d.token })).then((res) => {
        if (res?.ok) window.postMessage({ source: 'tholafind-ext', type: 'token-saved' }, location.origin);
      });
    }
  });
})();
