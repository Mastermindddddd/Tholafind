// Injected on demand (activeTab) into the current page. Renders the hunt panel
// inside a closed shadow root so page CSS can't touch it and it can't touch the page.
// All third-party text (titles, sources) is set with textContent, never innerHTML.
(() => {
  if (window.__tfPanel) return;
  const api = globalThis.browser ?? globalThis.chrome;

  const host = document.createElement('div');
  host.setAttribute('data-tholafind', 'panel');
  host.style.cssText = 'all:initial;position:fixed;top:16px;right:16px;z-index:2147483646;';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host{all:initial}
    *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .card{width:360px;max-height:min(640px,calc(100vh - 32px));overflow:auto;background:#f6f1e7;color:#1d1b16;
      border:1px solid #ddd3bf;border-radius:14px;box-shadow:0 12px 40px rgba(20,18,12,.28);font-size:13px;line-height:1.4}
    header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #ddd3bf;position:sticky;top:0;background:#f6f1e7;z-index:1}
    header b{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a63d2f;flex:1}
    button{cursor:pointer;font:inherit}
    .x{border:0;background:none;font-size:18px;line-height:1;color:#5b574b;padding:2px 6px}
    .body{padding:14px}
    .row{display:flex;gap:10px;align-items:center}
    .thumb{width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #ddd3bf;flex:none}
    .muted{color:#5b574b}
    .spin{width:14px;height:14px;border:2px solid #ddd3bf;border-top-color:#1f4d3a;border-radius:50%;animation:s 0.8s linear infinite;display:inline-block;vertical-align:-2px;margin-right:6px}
    @keyframes s{to{transform:rotate(360deg)}}
    .primary{background:#1f4d3a;color:#f6f1e7;border:0;border-radius:999px;padding:9px 16px;font-weight:600}
    .ghost{background:none;border:1px solid #ddd3bf;border-radius:999px;padding:7px 12px;color:#1d1b16}
    .res{display:flex;gap:10px;padding:10px 0;border-top:1px solid #ddd3bf;text-decoration:none;color:inherit}
    .res:first-of-type{border-top:0}
    .res img{width:64px;height:64px;border-radius:8px;object-fit:cover;background:#e9e1cf;flex:none}
    .t{font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;align-items:center}
    .chip{font-size:10.5px;padding:2px 7px;border-radius:999px;border:1px solid #ddd3bf;color:#5b574b}
    .m-exact{background:#1f4d3a;border-color:#1f4d3a;color:#f6f1e7}
    .m-close{background:#b08d3c;border-color:#b08d3c;color:#1d1b16}
    .price{font-weight:700}
    .why{font-size:11.5px;color:#5b574b;margin-top:2px}
    .diag{background:#fff;border:1px solid #ddd3bf;border-radius:10px;padding:10px;margin-bottom:10px}
    .diag input{width:100%;margin-top:6px;padding:7px 9px;border:1px solid #cfc4ab;border-radius:8px;background:#fffdf8;font:inherit}
    .foot{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-top:1px solid #ddd3bf}
    .foot a{color:#1f4d3a;font-weight:600}
    .err{color:#a63d2f}
  `;
  root.appendChild(style);
  const card = document.createElement('div');
  card.className = 'card';
  root.appendChild(card);

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c && n.append(c));
    return n;
  }
  const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : '#');
  const send = (m) => api.runtime.sendMessage(m);

  function close() { host.remove(); window.__tfPanel = false; api.runtime.onMessage.removeListener(onMsg); }
  function shell(...body) {
    return [
      el('header', {}, el('b', { text: 'Tholafind hunt' }),
        el('button', { class: 'x', 'aria-label': 'Close', onclick: () => { send({ type: 'cancel' }); close(); } }, '×')),
      ...body,
    ];
  }
  function render(...nodes) { card.replaceChildren(...nodes); }

  function working(m) {
    render(...shell(el('div', { class: 'body' }, el('div', { class: 'row' },
      m.thumb ? el('img', { class: 'thumb', src: m.thumb, alt: '' }) : null,
      el('div', {}, el('span', { class: 'spin' }), el('span', { text: m.step || 'Working…' }),
        el('div', { class: 'muted', text: 'This can take up to a minute.' }))))));
  }

  function connect() {
    render(...shell(el('div', { class: 'body' },
      el('p', { text: 'Connect the extension to your Tholafind account to start hunts from any page.' }),
      el('button', { class: 'primary', onclick: () => send({ type: 'open-connect' }) }, 'Connect account'))));
  }

  function error(m) {
    render(...shell(el('div', { class: 'body' },
      el('p', { class: 'err', text: m.message || 'Something went wrong.' }),
      m.canRetry ? el('button', { class: 'ghost', onclick: () => send({ type: 'retry' }) }, 'Try again') : null)));
  }

  function results(m) {
    const h = m.hunt;
    const body = el('div', { class: 'body' });

    const best = h.results.find((r) => typeof r.matchScore === 'number');
    body.append(el('div', { class: 'row', style: 'margin-bottom:10px' },
      m.thumb ? el('img', { class: 'thumb', src: m.thumb, alt: '' }) : null,
      el('div', {}, el('div', { style: 'font-weight:700;font-size:15px', text: h.results.length ? `${h.total} match${h.total === 1 ? '' : 'es'} found` : 'No matches yet' }),
        best ? el('div', { class: 'muted', text: `Best: ${best.matchScore}% match on ${best.source}` }) : null)));

    if (h.diagnosis) {
      const input = el('input', { type: 'text', maxlength: '120', placeholder: 'e.g. Stüssy leather', 'aria-label': 'Add a detail' });
      const go = () => { const v = input.value.trim(); if (v) send({ type: 'refine', hint: v }); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      body.append(el('div', { class: 'diag' },
        el('div', { text: h.diagnosis.explanation }),
        h.diagnosis.missing?.length ? el('div', { class: 'muted', text: 'Helpful: ' + h.diagnosis.missing.join(', ') }) : null,
        input, el('div', { style: 'margin-top:8px' }, el('button', { class: 'primary', onclick: go }, 'Search again'))));
    }

    for (const r of h.results) {
      const tone = r.confidence === 'exact' ? 'm-exact' : r.confidence === 'close' ? 'm-close' : '';
      const img = el('img', { alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
      img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
      if (/^https:\/\//i.test(r.image || '')) img.src = r.image;
      body.append(el('a', { class: 'res', href: safeUrl(r.url), target: '_blank', rel: 'noopener noreferrer' },
        img,
        el('div', {}, el('div', { class: 't', text: r.title }),
          el('div', { class: 'meta' },
            el('span', { class: 'price', text: r.price }),
            el('span', { class: 'chip', text: r.source }),
            typeof r.matchScore === 'number' ? el('span', { class: `chip ${tone}`, text: `${r.matchScore}% match` }) : null),
          r.reason ? el('div', { class: 'why', text: r.reason }) : null)));
    }

    render(...shell(body, el('div', { class: 'foot' },
      el('span', { class: 'muted', text: `Ref ${h.reference}` }),
      el('a', { href: safeUrl(h.resultsUrl), target: '_blank', rel: 'noopener noreferrer', text: 'Open full results ↗' }))));
  }

  function onMsg(m) {
    if (!m || m.target !== 'panel') return;
    switch (m.state) {
      case 'working': working(m); break;
      case 'connect': connect(); break;
      case 'error': error(m); break;
      case 'results': results(m); break;
      case 'close': close(); break;
    }
  }
  api.runtime.onMessage.addListener(onMsg);

  window.__tfPanel = true;
  document.documentElement.appendChild(host);
  working({ step: 'Starting…' });
})();
