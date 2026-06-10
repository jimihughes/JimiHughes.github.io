/* ═══════════════════════════════════════════════════════════
   JimiOS — Window Manager
   Single source of truth for all window state.
   API:
     WM.open(appId)        open (or focus) an app window
     WM.close(id)          close
     WM.minimize(id)       minimize to taskbar
     WM.restore(id)        restore from minimized
     WM.toggleMax(id)      maximize / restore
     WM.focus(id)          bring to front
     WM.cycle()            Alt+Tab style cycling
     WM.on(fn)             subscribe to state changes
   Each app in APPS registry: { id, name, icon, accent, w, h,
     render() -> html string, init(winEl) optional, preview }
═══════════════════════════════════════════════════════════ */
'use strict';

const WM = (() => {
  const wins = new Map();          // id -> { el, state, prevRect, z }
  let zTop = 100;
  const listeners = [];
  const layer = () => document.getElementById('windows');

  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }
  function on(fn) { listeners.push(fn); }

  /* ---------- persistence ---------- */
  function savedRects() {
    try { return JSON.parse(localStorage.getItem('jimios-rects') || '{}'); } catch { return {}; }
  }
  function saveRect(id, el) {
    if (!el || el.classList.contains('maximized')) return;
    const r = savedRects();
    r[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    localStorage.setItem('jimios-rects', JSON.stringify(r));
  }

  /* ---------- open ---------- */
  function open(appId, opts = {}) {
    const app = APPS[appId];
    if (!app) return null;
    const existing = wins.get(appId);
    if (existing) {
      if (existing.state === 'min') restore(appId);
      else focus(appId);
      return existing.el;
    }

    const el = document.createElement('section');
    el.className = 'window opening';
    el.dataset.app = appId;
    el.style.setProperty('--w-accent', app.accent || 'var(--accent)');

    // geometry — saved rect, else centered with cascade offset
    const vw = window.innerWidth, vh = window.innerHeight - 52;
    let w = Math.min(app.w || 640, vw - 40);
    let h = Math.min(app.h || 480, vh - 30);
    const saved = savedRects()[appId];
    let x, y;
    if (saved && saved.x > -50 && saved.x < vw - 80 && saved.y >= 0 && saved.y < vh - 60) {
      x = saved.x; y = saved.y;
      w = Math.min(saved.w, vw - 20); h = Math.min(saved.h, vh - 10);
    } else {
      const n = wins.size;
      x = Math.max(12, Math.round((vw - w) / 2) + n * 32);
      y = Math.max(8,  Math.round((vh - h) / 2.4) + n * 26);
    }
    el.style.cssText += `;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;

    el.innerHTML = `
      <header class="w-titlebar">
        <div class="w-lights">
          <button class="w-light w-close" title="Close" aria-label="Close window"></button>
          <button class="w-light w-min" title="Minimize" aria-label="Minimize window"></button>
          <button class="w-light w-max" title="Maximize" aria-label="Maximize window"></button>
        </div>
        <span class="w-icon">${app.icon}</span>
        <h2 class="w-title">${app.name}</h2>
        <div class="w-tb-spacer"></div>
      </header>
      <div class="w-body">${app.render()}</div>
      <div class="w-resize" aria-hidden="true"></div>`;

    layer().appendChild(el);
    wins.set(appId, { el, state: 'normal', prevRect: null, z: ++zTop });
    el.style.zIndex = zTop;

    // chrome buttons
    el.querySelector('.w-close').addEventListener('click', e => { e.stopPropagation(); close(appId); });
    el.querySelector('.w-min').addEventListener('click',   e => { e.stopPropagation(); minimize(appId); });
    el.querySelector('.w-max').addEventListener('click',   e => { e.stopPropagation(); toggleMax(appId); });
    el.querySelector('.w-titlebar').addEventListener('dblclick', e => {
      if (e.target.closest('.w-light')) return;
      toggleMax(appId);
    });

    el.addEventListener('pointerdown', () => focus(appId));
    makeDraggable(appId, el);
    makeResizable(appId, el);

    focus(appId);
    setTimeout(() => el.classList.remove('opening'), 320);
    if (app.init) { try { app.init(el); } catch (e) { console.error(`[JimiOS] ${appId} init:`, e); } }
    if (window.SFX) SFX.open();
    emit();
    return el;
  }

  /* ---------- close / min / restore / max ---------- */
  function close(id) {
    const w = wins.get(id); if (!w) return;
    saveRect(id, w.el);
    const app = APPS[id];
    if (app && app.destroy) { try { app.destroy(w.el); } catch (e) {} }
    w.el.classList.add('closing');
    wins.delete(id);
    setTimeout(() => w.el.remove(), 200);
    if (window.SFX) SFX.close();
    focusTop();
    emit();
  }

  function minimize(id) {
    const w = wins.get(id); if (!w || w.state === 'min') return;
    w.state = 'min';
    w.el.classList.add('minimized');
    focusTop();
    emit();
  }

  function restore(id) {
    const w = wins.get(id); if (!w) return;
    w.state = w.el.classList.contains('maximized') ? 'max' : 'normal';
    w.el.classList.remove('minimized');
    focus(id);
    emit();
  }

  function toggleMax(id) {
    const w = wins.get(id); if (!w) return;
    const el = w.el;
    if (el.classList.contains('maximized')) {
      el.classList.remove('maximized');
      if (w.prevRect) {
        el.style.left = w.prevRect.x + 'px'; el.style.top = w.prevRect.y + 'px';
        el.style.width = w.prevRect.w + 'px'; el.style.height = w.prevRect.h + 'px';
      }
      w.state = 'normal';
    } else {
      w.prevRect = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      el.classList.add('maximized');
      w.state = 'max';
    }
    focus(id);
    emit();
  }

  /* ---------- focus ---------- */
  function focus(id) {
    const w = wins.get(id); if (!w) return;
    w.z = ++zTop;
    w.el.style.zIndex = zTop;
    wins.forEach((ww, wid) => ww.el.classList.toggle('inactive', wid !== id));
    emit();
  }

  function focusTop() {
    let best = null, bestZ = -1;
    wins.forEach((w, id) => { if (w.state !== 'min' && w.z > bestZ) { bestZ = w.z; best = id; } });
    if (best) focus(best);
  }

  function topId() {
    let best = null, bestZ = -1;
    wins.forEach((w, id) => { if (w.state !== 'min' && w.z > bestZ) { bestZ = w.z; best = id; } });
    return best;
  }

  function cycle() {
    const ids = [...wins.keys()];
    if (!ids.length) return;
    const cur = topId();
    const next = ids[(ids.indexOf(cur) + 1) % ids.length];
    const w = wins.get(next);
    if (w.state === 'min') restore(next); else focus(next);
  }

  /* ---------- drag + edge snap ---------- */
  const snapEl = () => document.getElementById('snap-preview');
  function snapZone(px, py) {
    const vw = window.innerWidth;
    if (py <= 6) return 'top';
    if (px <= 8) return 'left';
    if (px >= vw - 8) return 'right';
    return null;
  }
  function snapRect(zone) {
    const vw = window.innerWidth, vh = window.innerHeight - 52;
    if (zone === 'left')  return { x: 0, y: 0, w: vw / 2, h: vh };
    if (zone === 'right') return { x: vw / 2, y: 0, w: vw / 2, h: vh };
    return { x: 0, y: 0, w: vw, h: vh };
  }

  function makeDraggable(id, el) {
    const bar = el.querySelector('.w-titlebar');
    let sx, sy, ox, oy, dragging = false, zone = null;

    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.w-light') || e.button !== 0) return;
      const w = wins.get(id);
      if (el.classList.contains('maximized')) {
        // drag out of maximized: restore under cursor
        const ratio = e.clientX / window.innerWidth;
        el.classList.remove('maximized');
        if (w) w.state = 'normal';
        const rw = (w && w.prevRect) ? w.prevRect.w : 640;
        const rh = (w && w.prevRect) ? w.prevRect.h : 480;
        el.style.width = rw + 'px'; el.style.height = rh + 'px';
        el.style.left = (e.clientX - rw * ratio) + 'px';
        el.style.top  = (e.clientY - 16) + 'px';
        emit();
      }
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      el.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
    });

    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      const nx = ox + e.clientX - sx;
      const ny = Math.max(0, oy + e.clientY - sy);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
      const z = snapZone(e.clientX, e.clientY);
      if (z !== zone) {
        zone = z;
        const sp = snapEl();
        if (z) {
          const r = snapRect(z);
          sp.style.cssText = `display:block;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
        } else sp.style.display = 'none';
      }
    });

    bar.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      snapEl().style.display = 'none';
      const w = wins.get(id);
      if (zone === 'top') {
        if (w && !el.classList.contains('maximized')) toggleMax(id);
      } else if (zone) {
        const r = snapRect(zone);
        if (w) w.prevRect = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        el.classList.remove('maximized');
        el.style.left = r.x + 'px'; el.style.top = r.y + 'px';
        el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
        if (w) w.state = 'normal';
      }
      zone = null;
      saveRect(id, el);
    });
  }

  /* ---------- resize ---------- */
  function makeResizable(id, el) {
    const grip = el.querySelector('.w-resize');
    let sx, sy, sw, sh, resizing = false;
    grip.addEventListener('pointerdown', e => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', e => {
      if (!resizing) return;
      el.style.width  = Math.max(360, sw + e.clientX - sx) + 'px';
      el.style.height = Math.max(240, sh + e.clientY - sy) + 'px';
    });
    grip.addEventListener('pointerup', () => {
      if (!resizing) return;
      resizing = false;
      saveRect(id, el);
    });
  }

  return { open, close, minimize, restore, toggleMax, focus, cycle, on, wins, topId };
})();
