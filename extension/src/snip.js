(() => {
  if (window.__tfSnipActive) return;
  window.__tfSnipActive = true;
  const api = globalThis.browser ?? globalThis.chrome;

  const root = document.createElement('div');
  root.setAttribute('data-tholafind', 'snip');
  const shadow = root.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      .veil{position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(20,18,12,.35);touch-action:none;user-select:none}
      .box{position:fixed;display:none;border:2px solid #fff;outline:2px solid #1f4d3a;box-shadow:0 0 0 100vmax rgba(20,18,12,.45);pointer-events:none}
      .tip{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;
        font:500 13px/1.2 system-ui,sans-serif;color:#f6f1e7;background:#1d1b16;padding:8px 14px;border-radius:999px}
    </style>
    <div class="veil"></div><div class="box"></div><div class="tip">Drag around the item &middot; Esc to cancel</div>`;
  document.documentElement.appendChild(root);
  const veil = shadow.querySelector('.veil');
  const box = shadow.querySelector('.box');

  let sx = 0, sy = 0, drawing = false;

  function rectFrom(e) {
    const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY);
    return { x, y, w: Math.abs(e.clientX - sx), h: Math.abs(e.clientY - sy) };
  }
  function paint(r) {
    box.style.display = 'block';
    box.style.left = r.x + 'px'; box.style.top = r.y + 'px';
    box.style.width = r.w + 'px'; box.style.height = r.h + 'px';
  }
  async function finish(rect) {
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    window.__tfSnipActive = false;
    if (rect) {
      // let the page repaint without the overlay before the tab is captured
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 60));
    }
    api.runtime.sendMessage({ type: 'snip-result', rect });
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(null); }
  }
  window.addEventListener('keydown', onKey, true);

  veil.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    drawing = true; sx = e.clientX; sy = e.clientY;
    veil.setPointerCapture(e.pointerId);
    paint({ x: sx, y: sy, w: 0, h: 0 });
  });
  veil.addEventListener('pointermove', (e) => { if (drawing) paint(rectFrom(e)); });
  veil.addEventListener('pointerup', (e) => {
    if (!drawing) return;
    drawing = false;
    const r = rectFrom(e);
    if (r.w < 24 || r.h < 24) { box.style.display = 'none'; return; } // ignore stray clicks
    finish({ ...r, vw: window.innerWidth });
  });
})();
