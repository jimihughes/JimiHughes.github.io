/* ═══════════════════════════════════════════════════════════
   JimiOS — Shell
   Boot sequence · wallpaper engine · desktop icons · taskbar
   start menu · tray/notifications · context menu · easter eggs
═══════════════════════════════════════════════════════════ */
'use strict';

/* ════════════════ SOUNDS (Web Audio, no files) ════════════════ */
const SFX = (() => {
  let ac = null;
  const ctx = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
  function tone(f0, f1, type, vol, dur) {
    if (!JOS.prefs.sounds) return;
    try {
      const c = ctx(), t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  }
  let ambientNodes = null;
  function ambientOn() {
    try {
      const c = ctx();
      const g = c.createGain(); g.gain.value = 0.018; g.connect(c.destination);
      const nodes = [g];
      [110, 164.8, 220, 329.6].forEach((f, i) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const og = c.createGain(); og.gain.value = 0.5 / (i + 1);
        const lfo = c.createOscillator(); lfo.frequency.value = 0.06 + i * 0.04;
        const lg = c.createGain(); lg.gain.value = 0.25;
        lfo.connect(lg); lg.connect(og.gain);
        o.connect(og); og.connect(g);
        o.start(); lfo.start();
        nodes.push(o, lfo);
      });
      ambientNodes = nodes;
    } catch (e) {}
  }
  function ambientOff() {
    if (!ambientNodes) return;
    ambientNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    ambientNodes = null;
  }
  return {
    open:  () => tone(420, 860, 'sine', 0.045, 0.2),
    close: () => tone(640, 320, 'sine', 0.035, 0.16),
    click: () => tone(900, null, 'sine', 0.02, 0.06),
    notify:() => { tone(880, 1175, 'sine', 0.035, 0.14); setTimeout(() => tone(1175, 880, 'sine', 0.025, 0.12), 110); },
    boot:  () => tone(220, 880, 'triangle', 0.05, 0.5),
    ambientOn, ambientOff,
  };
})();

/* ════════════════ JOS — global OS services ════════════════ */
const JOS = {
  prefs: (() => {
    const d = { accent:'#00f5ff', accentRgb:'0,245,255', wallpaper:'particles',
                theme:'dark', fs:1, sounds:true, ambient:false };
    try { return { ...d, ...JSON.parse(localStorage.getItem('jimios-prefs') || '{}') }; }
    catch { return d; }
  })(),
  save() { localStorage.setItem('jimios-prefs', JSON.stringify(this.prefs)); },

  setAccent(c, rgb) {
    this.prefs.accent = c; this.prefs.accentRgb = rgb; this.save();
    document.documentElement.style.setProperty('--accent', c);
    document.documentElement.style.setProperty('--accent-rgb', rgb);
    this.toast('🎨 Accent updated');
  },
  setTheme(t) {
    this.prefs.theme = t; this.save();
    document.body.classList.toggle('theme-light', t === 'light');
  },
  setFontScale(v) {
    this.prefs.fs = v; this.save();
    document.documentElement.style.setProperty('--fs', v);
  },
  togglePref(key) {
    this.prefs[key] = !this.prefs[key]; this.save();
    if (key === 'ambient') this.prefs.ambient ? SFX.ambientOn() : SFX.ambientOff();
    return this.prefs[key];
  },
  applyPrefs() {
    document.documentElement.style.setProperty('--accent', this.prefs.accent);
    document.documentElement.style.setProperty('--accent-rgb', this.prefs.accentRgb);
    document.documentElement.style.setProperty('--fs', this.prefs.fs);
    document.body.classList.toggle('theme-light', this.prefs.theme === 'light');
  },

  toast(msg, ms = 3200) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    SFX.notify();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
  },

  /* ──────── wallpaper engine (canvas modes) ──────── */
  WALLPAPERS: [
    { id:'particles', name:'Neural',  thumb:'radial-gradient(circle at 30% 30%, #103040, #0a0a0f)' },
    { id:'grid',      name:'Grid',    thumb:'linear-gradient(#0a0a0f,#0a0a0f), repeating-linear-gradient(90deg,#1a2a3a 0 1px,transparent 1px 12px)' },
    { id:'space',     name:'Space',   thumb:'radial-gradient(circle at 70% 20%, #1a1040, #050508)' },
    { id:'neon',      name:'Neon',    thumb:'linear-gradient(135deg,#28084a,#0a1a3a)' },
    { id:'minimal',   name:'Minimal', thumb:'linear-gradient(160deg,#0e1018,#08090f)' },
  ],
  _wpRaf: null,
  setWallpaper(id) {
    this.prefs.wallpaper = id; this.save();
    this.startWallpaper(id);
  },
  startWallpaper(id) {
    cancelAnimationFrame(this._wpRaf);
    const cv = document.getElementById('wp-canvas');
    const ctx = cv.getContext('2d');
    let W, H;
    const fit = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
    fit();
    window.addEventListener('resize', fit);
    const rgb = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '0,245,255';
    const self = this;

    if (id === 'particles') {
      const pts = Array.from({ length: 64 }, () => ({
        x: Math.random()*innerWidth, y: Math.random()*innerHeight,
        vx: (Math.random()-0.5)*0.32, vy: (Math.random()-0.5)*0.32 }));
      (function loop() {
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,W,H);
        const c = rgb();
        pts.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          ctx.fillStyle = `rgba(${c},0.55)`;
          ctx.fillRect(p.x-1, p.y-1, 2, 2);
        });
        for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y, d = dx*dx+dy*dy;
          if (d < 19600) {
            ctx.strokeStyle = `rgba(${c},${0.13*(1-d/19600)})`;
            ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke();
          }
        }
        self._wpRaf = requestAnimationFrame(loop);
      })();
    } else if (id === 'space') {
      const stars = Array.from({ length: 220 }, () => ({
        x: Math.random()*innerWidth, y: Math.random()*innerHeight,
        r: Math.random()*1.3+0.2, tw: Math.random()*Math.PI*2, sp: 0.008+Math.random()*0.02 }));
      (function loop() {
        const g = ctx.createRadialGradient(W*0.7,H*0.15,0,W*0.7,H*0.15,W*0.8);
        g.addColorStop(0,'#14102e'); g.addColorStop(1,'#050508');
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
        stars.forEach(s => {
          s.tw += s.sp;
          ctx.fillStyle = `rgba(255,255,255,${0.25+0.5*Math.abs(Math.sin(s.tw))})`;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill();
        });
        self._wpRaf = requestAnimationFrame(loop);
      })();
    } else if (id === 'grid') {
      let t = 0;
      (function loop() {
        t += 0.004;
        ctx.fillStyle = '#08090e'; ctx.fillRect(0,0,W,H);
        const c = rgb();
        ctx.strokeStyle = `rgba(${c},0.09)`; ctx.lineWidth = 1;
        const sz = 44, off = (t*60) % sz;
        for (let x = -off; x < W; x += sz) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y = -off; y < H; y += sz) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        const pulse = (Math.sin(t*3)+1)/2;
        ctx.fillStyle = `rgba(${c},${0.02+pulse*0.025})`;
        ctx.fillRect(0,0,W,H);
        self._wpRaf = requestAnimationFrame(loop);
      })();
    } else if (id === 'neon') {
      let t = 0;
      (function loop() {
        t += 0.0028;
        const g = ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0, `hsl(${265+Math.sin(t)*20},65%,${10+Math.sin(t*1.3)*3}%)`);
        g.addColorStop(1, `hsl(${210+Math.cos(t*0.8)*25},70%,${9+Math.cos(t)*3}%)`);
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
        self._wpRaf = requestAnimationFrame(loop);
      })();
    } else { // minimal — static, zero CPU
      ctx.fillStyle = '#0b0d13'; ctx.fillRect(0,0,W,H);
      const g = ctx.createRadialGradient(W/2,H*1.1,0,W/2,H*1.1,H);
      g.addColorStop(0,'rgba(20,26,40,0.8)'); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
  },
};

/* ════════════════ BOOT SEQUENCE ════════════════ */
const BOOT_LINES = [
  ['JimiOS BIOS v1.0 — initialising', 'dim'],
  ['CPU: Caffeine-Fuelled Core i∞ ............ <span class="ok">OK</span>', null],
  ['RAM: 64GB of unfinished side projects .... <span class="ok">OK</span>', null],
  ['GPU: Imagination Engine .................. <span class="ok">OK</span>', null],
  ['Mounting /dev/portfolio .................. <span class="ok">OK</span>', null],
  ['Loading window manager ................... <span class="ok">OK</span>', null],
  ['Calibrating particle field ............... <span class="ok">OK</span>', null],
  ['Starting ApexBot daemon .................. <span class="ok">ACTIVE</span>', null],
  ['Checking for bugs ........................ <span class="warn">SKIPPED</span>', null],
  ['Polishing pixels ......................... <span class="ok">OK</span>', null],
  ['Launching desktop environment...', 'dim'],
];

let bootBuffer = '';
function runBoot() {
  const log = document.getElementById('boot-log');
  const fill = document.getElementById('boot-bar-fill');
  let i = 0;
  SFX.boot();
  (function next() {
    if (i < BOOT_LINES.length) {
      const [txt, cls] = BOOT_LINES[i];
      log.innerHTML += (cls ? `<span class="${cls}">${txt}</span>` : txt) + '\n';
      fill.style.width = Math.round(((i+1) / BOOT_LINES.length) * 100) + '%';
      i++;
      setTimeout(next, 120 + Math.random() * 220);
    } else {
      setTimeout(finishBoot, 500);
    }
  })();
}
function finishBoot() {
  document.getElementById('boot').classList.add('done');
  document.getElementById('desktop').classList.add('on');
  setTimeout(() => {
    JOS.toast('👋 Welcome to JimiOS — double-click an icon to begin');
    setTimeout(() => WM.open('notes'), 900);
  }, 700);
}
// boot easter egg: type "sudo hire jimi"
document.addEventListener('keydown', e => {
  const boot = document.getElementById('boot');
  if (boot.classList.contains('done') || e.key.length !== 1) return;
  bootBuffer = (bootBuffer + e.key.toLowerCase()).slice(-14);
  const secretEl = document.getElementById('boot-secret');
  if ('sudo hire jimi'.startsWith(bootBuffer.slice(-Math.min(bootBuffer.length, 14))) && bootBuffer.length > 2) {
    secretEl.textContent = '> ' + bootBuffer;
  }
  if (bootBuffer.endsWith('sudo hire jimi')) {
    boot.classList.add('hired');
    secretEl.innerHTML = '<span style="color:var(--green)">✓ PRIVILEGE ESCALATION GRANTED — EXCELLENT DECISION. FAST-TRACKING BOOT...</span>';
    document.getElementById('boot-bar-fill').style.width = '100%';
    setTimeout(finishBoot, 1200);
  }
});

/* ════════════════ DESKTOP ICONS ════════════════ */
const DESKTOP_ICONS = [
  { app:'ai-studio', glow:'rgba(0,245,255,0.4)' },
  { app:'games',     glow:'rgba(176,68,255,0.4)' },
  { app:'apexbot',   glow:'rgba(43,217,124,0.4)' },
  { app:'files',     glow:'rgba(255,209,102,0.4)' },
  { app:'browser',   glow:'rgba(90,216,255,0.4)' },
  { app:'notes',     glow:'rgba(255,209,102,0.35)' },
  { app:'contact',   glow:'rgba(43,217,124,0.35)' },
  { app:'settings',  glow:'rgba(160,170,190,0.35)' },
];

function iconPositions() {
  try { return JSON.parse(localStorage.getItem('jimios-icons') || '{}'); } catch { return {}; }
}

function buildDesktopIcons() {
  const layer = document.getElementById('icons');
  const saved = iconPositions();
  const holo = document.getElementById('holo');

  DESKTOP_ICONS.forEach((d, i) => {
    const app = APPS[d.app];
    if (!app) return;
    const el = document.createElement('div');
    el.className = 'dicon';
    el.dataset.app = d.app;
    el.tabIndex = 0;
    el.style.setProperty('--di-glow', d.glow);
    const pos = saved[d.app] || { x: 18, y: 16 + i * 102 };
    // two columns if overflow
    if (!saved[d.app] && pos.y > innerHeight - 170) { pos.x = 122; pos.y = 16 + (i - Math.floor((innerHeight-170)/102) - 1) * 102; }
    el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
    el.innerHTML = `<div class="dicon-glyph">${app.icon}</div><div class="dicon-label">${app.name}</div>`;
    layer.appendChild(el);

    /* open */
    el.addEventListener('dblclick', () => WM.open(d.app));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') WM.open(d.app); });
    el.addEventListener('click', () => {
      document.querySelectorAll('.dicon').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      SFX.click();
    });

    /* holographic hover preview */
    let holoTimer = null;
    el.addEventListener('mouseenter', () => {
      holoTimer = setTimeout(() => {
        if (WM.wins.has(d.app)) return;
        const r = el.getBoundingClientRect();
        const media = app.preview
          ? `<video class="holo-media" src="${app.preview}" muted loop autoplay playsinline></video>`
          : `<div class="holo-media" style="display:flex;align-items:center;justify-content:center;font-size:48px">${app.previewEmoji || app.icon}</div>`;
        holo.innerHTML = media + `<div class="holo-name">${app.name}</div><div class="holo-desc">${app.desc || ''}</div>`;
        let hx = r.left + r.width/2 - 120;
        hx = Math.max(8, Math.min(hx, innerWidth - 248));
        let hy = r.top - 196;
        if (hy < 8) hy = r.bottom + 10;
        holo.style.left = hx + 'px'; holo.style.top = hy + 'px';
        holo.classList.add('show');
        const v = holo.querySelector('video'); if (v) v.play().catch(()=>{});
      }, 380);
    });
    el.addEventListener('mouseleave', () => {
      clearTimeout(holoTimer);
      holo.classList.remove('show');
    });

    /* draggable icons (drag with single click-hold) */
    let dx, dy, dragging = false, moved = false;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      dx = e.clientX - el.offsetLeft; dy = e.clientY - el.offsetTop;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const nx = e.clientX - dx, ny = e.clientY - dy;
      if (!moved && Math.hypot(nx - el.offsetLeft, ny - el.offsetTop) < 5) return;
      moved = true;
      holo.classList.remove('show');
      el.style.left = Math.max(0, Math.min(nx, innerWidth - 92)) + 'px';
      el.style.top  = Math.max(0, Math.min(ny, innerHeight - 152)) + 'px';
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const p = iconPositions();
        p[d.app] = { x: el.offsetLeft, y: el.offsetTop };
        localStorage.setItem('jimios-icons', JSON.stringify(p));
      }
    });
  });

  // click empty desktop = deselect
  document.getElementById('desktop').addEventListener('click', e => {
    if (e.target.id === 'desktop' || e.target.closest('#wallpaper'))
      document.querySelectorAll('.dicon').forEach(x => x.classList.remove('selected'));
  });
}

/* ════════════════ TASKBAR ════════════════ */
function renderTaskbar() {
  const box = document.getElementById('tb-apps');
  const top = WM.topId();
  box.innerHTML = '';
  WM.wins.forEach((w, id) => {
    const app = APPS[id];
    const b = document.createElement('button');
    b.className = 'tb-app' + (id === top && w.state !== 'min' ? ' active' : '') + (w.state === 'min' ? ' min' : '');
    b.innerHTML = `<span>${app.icon}</span><span>${app.name}</span>`;
    b.addEventListener('click', () => {
      if (w.state === 'min') WM.restore(id);
      else if (id === top) WM.minimize(id);
      else WM.focus(id);
    });
    box.appendChild(b);
  });
}
WM.on(renderTaskbar);

function startClock() {
  const t = document.getElementById('tb-time');
  const d = document.getElementById('tb-date');
  const tick = () => {
    const n = new Date();
    t.textContent = n.toTimeString().slice(0, 5);
    d.textContent = n.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
  };
  tick(); setInterval(tick, 10000);
}

/* ════════════════ START MENU ════════════════ */
function initStartMenu() {
  const menu = document.getElementById('start-menu');
  const btn = document.getElementById('tb-start');
  const search = document.getElementById('sm-search');
  const grid = document.getElementById('sm-apps');

  function render(filter = '') {
    const f = filter.toLowerCase();
    grid.innerHTML = Object.values(APPS)
      .filter(a => !a.hidden || JOS._konami)
      .filter(a => !f || a.name.toLowerCase().includes(f) || (a.desc||'').toLowerCase().includes(f))
      .map(a => `<div class="sm-app" data-app="${a.id}">
        <span class="sm-app-glyph">${a.icon}</span><span class="sm-app-name">${a.name}</span></div>`).join('')
      || '<div style="grid-column:1/-1;text-align:center;font-family:var(--mono);font-size:11px;color:var(--txt-3);padding:18px">no results</div>';
    grid.querySelectorAll('.sm-app').forEach(el => el.addEventListener('click', () => {
      WM.open(el.dataset.app); toggle(false);
    }));
  }

  function toggle(force) {
    const open = force !== undefined ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    if (open) { render(); search.value = ''; setTimeout(() => search.focus(), 120); }
  }
  btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  search.addEventListener('input', () => render(search.value));
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = grid.querySelector('.sm-app');
      if (first) { WM.open(first.dataset.app); toggle(false); }
    }
    if (e.key === 'Escape') toggle(false);
  });
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) toggle(false);
  });
  JOS.toggleStartMenu = toggle;
}

/* ════════════════ NOTIFICATION CENTRE ════════════════ */
const FAKE_NOTIFS = [
  { icon:'🚀', title:'Deploy complete', body:'jimihughes.com → GitHub Pages build passed.', t:'2m ago' },
  { icon:'📊', title:'ApexBot', body:'BUY signal fired on BTC/USD — SMA confluence detected.', t:'7m ago' },
  { icon:'🧠', title:'Quiz Server', body:'3 players waiting in lobby #42. It\'s getting heated.', t:'18m ago' },
  { icon:'📡', title:'Learnscroll', body:'Someone just scrolled 200 facts about octopuses.', t:'1h ago' },
  { icon:'🔮', title:'System', body:'Konami code remains undiscovered by this visitor.', t:'now' },
];
function initNotifs() {
  const panel = document.getElementById('notif-panel');
  const btn = document.getElementById('tray-notif');
  panel.innerHTML = '<div class="sm-h" style="margin-bottom:9px">Notifications</div>' +
    FAKE_NOTIFS.map(n => `<div class="notif"><div class="notif-icon">${n.icon}</div>
      <div><div class="notif-title">${n.title}</div><div class="notif-body">${n.body}</div>
      <div class="notif-time">${n.t}</div></div></div>`).join('');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
    btn.querySelector('.dot')?.remove();
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('open');
  });
}

/* ════════════════ CONTEXT MENU ════════════════ */
function initCtxMenu() {
  const menu = document.getElementById('ctx-menu');
  const items = [
    { icon:'🤖', label:'Open AI Studio', fn:() => WM.open('ai-studio') },
    { icon:'📊', label:'Open ApexBot Terminal', fn:() => WM.open('apexbot') },
    null,
    { icon:'🖼️', label:'Change Wallpaper', fn:() => { WM.open('settings'); } },
    { icon:'🎨', label:'Personalise', fn:() => WM.open('settings') },
    null,
    { icon:'📝', label:'About JimiOS', fn:() => WM.open('settings') },
    { icon:'🔄', label:'Refresh', fn:() => location.reload() },
  ];
  menu.innerHTML = items.map(it => it
    ? `<div class="ctx-item" data-l="${it.label}"><span>${it.icon}</span>${it.label}</div>`
    : '<div class="ctx-sep"></div>').join('');
  [...menu.querySelectorAll('.ctx-item')].forEach(el => {
    const it = items.filter(Boolean).find(i => i.label === el.dataset.l);
    el.addEventListener('click', () => { it.fn(); menu.classList.remove('open'); });
  });
  document.getElementById('desktop').addEventListener('contextmenu', e => {
    if (e.target.closest('.window')) return;
    e.preventDefault();
    menu.style.left = Math.min(e.clientX, innerWidth - 215) + 'px';
    menu.style.top  = Math.min(e.clientY, innerHeight - 320) + 'px';
    menu.classList.add('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

/* ════════════════ KEYBOARD ════════════════ */
function initKeys() {
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'Tab') { e.preventDefault(); WM.cycle(); }
    if (e.key === 'Escape') {
      document.getElementById('start-menu').classList.remove('open');
      document.getElementById('notif-panel').classList.remove('open');
      document.getElementById('ctx-menu').classList.remove('open');
    }
    if (e.key === 'Meta' || (e.altKey && e.code === 'Space')) {
      // Alt+Space opens launcher
      if (e.altKey) { e.preventDefault(); JOS.toggleStartMenu(); }
    }
  });
}

/* ════════════════ KONAMI ════════════════ */
function initKonami() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let i = 0;
  document.addEventListener('keydown', e => {
    if (e.key === seq[i] || e.key.toLowerCase() === seq[i]) {
      if (++i === seq.length) {
        i = 0;
        if (JOS._konami) return;
        JOS._konami = true;
        DESKTOP_ICONS.push({ app:'secret', glow:'rgba(255,77,106,0.5)' });
        const layer = document.getElementById('icons');
        const el = document.createElement('div');
        el.className = 'dicon'; el.tabIndex = 0;
        el.style.cssText = `left:${innerWidth - 130}px;top:24px;--di-glow:rgba(255,77,106,0.5)`;
        el.innerHTML = '<div class="dicon-glyph">🔮</div><div class="dicon-label">Secret Projects</div>';
        el.addEventListener('dblclick', () => WM.open('secret'));
        layer.appendChild(el);
        JOS.toast('🔮 KONAMI ACCEPTED — Secret Projects unlocked');
      }
    } else i = (e.key === seq[0]) ? 1 : 0;
  });
}

/* ════════════════ SCREENSAVER (matrix rain, 2 min idle) ════════════════ */
function initScreensaver() {
  const ss = document.getElementById('screensaver');
  const cv = document.getElementById('ss-canvas');
  let idle = null, raf = null;

  function start() {
    ss.classList.add('on');
    const ctx = cv.getContext('2d');
    const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = Math.floor(W / 16);
    const drops = Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = 'JIMIOSアイウエオ01<>{}/$#@';
    (function rain() {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0,0,W,H);
      ctx.font = '14px JetBrains Mono';
      drops.forEach((y, x) => {
        ctx.fillStyle = Math.random() > 0.97 ? '#fff' : 'rgba(0,245,255,0.75)';
        ctx.fillText(chars[Math.floor(Math.random()*chars.length)], x*16, y*16);
        drops[x] = y*16 > H && Math.random() > 0.97 ? 0 : y + 0.5 + Math.random()*0.4;
      });
      raf = requestAnimationFrame(rain);
    })();
  }
  function stop() {
    if (!ss.classList.contains('on')) return;
    ss.classList.remove('on');
    cancelAnimationFrame(raf);
  }
  function reset() {
    stop();
    clearTimeout(idle);
    idle = setTimeout(start, 120000);
  }
  ['mousemove','keydown','pointerdown','wheel'].forEach(ev =>
    document.addEventListener(ev, reset, { passive:true }));
  reset();
}

/* ════════════════ INIT ════════════════ */
function isMobile() {
  return innerWidth <= 768 || (matchMedia('(pointer:coarse)').matches && innerWidth <= 1024);
}

document.addEventListener('DOMContentLoaded', () => {
  if (isMobile()) return;       // CSS shows #mobile-gate
  JOS.applyPrefs();
  JOS.startWallpaper(JOS.prefs.wallpaper);
  if (JOS.prefs.ambient) {
    // browsers need a gesture before audio — arm it
    const arm = () => { SFX.ambientOn(); document.removeEventListener('pointerdown', arm); };
    document.addEventListener('pointerdown', arm);
  }
  buildDesktopIcons();
  startClock();
  initStartMenu();
  initNotifs();
  initCtxMenu();
  initKeys();
  initKonami();
  initScreensaver();
  renderTaskbar();
  runBoot();
});
