/* ═══════════════════════════════════════════════════════════
   JimiOS — Application Registry
   Each app: { id, name, icon, accent, w, h, desc, preview,
               render() -> html, init(winEl)?, destroy(winEl)? }
   Content is lazy: render() runs only when the window opens.
═══════════════════════════════════════════════════════════ */
'use strict';

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- shared project data (reuses repo assets) ---------- */
const AI_PROJECTS = [
  { name:'ApexBot', cat:'Algorithmic Trading', video:null, img:null, emoji:'📊',
    desc:'Autonomous trading bot — multi-timeframe signal engine, moving-average confluence, risk-managed execution. Open the ApexBot Terminal app to watch it live.',
    tags:['Python','Pandas','Signals','Backtesting'], action:`WM.open('apexbot')`, actionLabel:'Open Terminal' },
  { name:'Learnscroll', cat:'AI Learning Feed', video:'videos/learnscroll.mp4',
    desc:'Pick any topic, get an infinite scroll of AI-generated facts, myths and mind-blows. Learning, disguised as doom-scrolling.',
    tags:['Groq AI','Node.js','Express'], href:'https://learn-scroll.onrender.com' },
  { name:'Face-Off Quiz', cat:'AI Quiz Engine', video:'videos/faceoff.mp4',
    desc:'Two things go head-to-head — taller, older, faster? Streak-based difficulty ramps powered by an AI question engine.',
    tags:['AI','Node.js','Web'], href:'https://face-off-quiz.onrender.com' },
  { name:'Just Do It', cat:'AI Productivity PWA', video:'videos/just-do-it.mp4',
    desc:'Tell it your time and energy — it tells you exactly what to tackle, with AI micro-step breakdowns. Offline-first, installable.',
    tags:['Groq AI','PWA','Offline'], href:'just-do-it/' },
  { name:'AI Video Pipeline', cat:'Content Automation', img:'images/dashboard.png', emoji:'🎬',
    desc:'Faceless video factory: AI scripts → synthesized voiceover → auto-generated charts → encoded video. Zero hands after the prompt.',
    tags:['Groq AI','ElevenLabs','MoviePy','Python'] },
  { name:'Meal Planner', cat:'AI Nutrition', video:'videos/meal-planner.mp4',
    desc:'AI-generated weekly meal plans with macros and shopping lists, tuned to your goals.',
    tags:['AI','Web'], href:'meal-planner/' },
];

const GAMES = [
  { name:'Multiplayer Quiz', cat:'Featured · Realtime Multiplayer', video:'videos/quiz.mp4', featured:true,
    desc:'Realtime multiplayer quiz platform — lobbies, live scoreboards, streak bonuses. Node, Express, Socket.io and React doing what they do best. This one gets people competitive fast.',
    tags:['Socket.io','React','Node','Express'], href:'quiz/' },
  { name:'Pixel Runner', cat:'Platformer', video:'videos/platformer.mp4', desc:'Run, jump, dodge lava. Hand-rolled physics on canvas.', tags:['Canvas','JS'], href:'platformer/' },
  { name:'Defend the Tower', cat:'Survival Shooter', video:'videos/defend-the-tower.mp4', desc:'Hold the castle against escalating waves. XP, upgrades, chaos.', tags:['GDevelop'], href:'https://gd.games/jimib0bjim/defend-the-tower' },
  { name:'Space Invaders', cat:'Arcade', video:'videos/space-invaders.mp4', desc:'The classic, rebuilt from scratch with juice and particles.', tags:['Canvas','JS'], href:'space-invaders/' },
  { name:'Snake', cat:'Arcade', video:'videos/snake.mp4', desc:'Snake with smooth interpolation and increasing menace.', tags:['Canvas','JS'], href:'snake/' },
  { name:'2048', cat:'Puzzle', video:'videos/2048.mp4', desc:'Slide, merge, despair at 1024. Animations everywhere.', tags:['JS','CSS Grid'], href:'2048/' },
  { name:'Crossword', cat:'Word Puzzle', video:'videos/crossword.mp4', desc:'Procedurally generated crosswords with smart word placement.', tags:['JS','Algorithms'], href:'crossword/' },
  { name:'Speed Typing', cat:'Skill Test', video:'videos/typing-test.mp4', desc:'60-second WPM test with character-level accuracy feedback.', tags:['JS'], href:'typing-test/' },
];

function projectCard(p) {
  const media = p.video
    ? `<video class="card-media" src="${p.video}" muted loop playsinline preload="metadata"></video>`
    : p.img
      ? `<img class="card-media" src="${p.img}" alt="${esc(p.name)}" loading="lazy">`
      : `<div class="card-media" style="display:flex;align-items:center;justify-content:center;font-size:44px">${p.emoji||'📦'}</div>`;
  const action = p.action
    ? `<button class="btn" onclick="${p.action}">${p.actionLabel||'Open'}</button>`
    : p.href
      ? `<a class="btn" href="${p.href}" target="_blank" rel="noopener">Launch ↗</a>`
      : `<span class="tag">case study</span>`;
  return `<article class="card${p.featured?' feature':''}">
    ${media}
    <div class="card-body">
      <div class="card-cat">${p.cat}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.desc}</div>
      <div>${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="card-row">${action}</div>
    </div>
  </article>`;
}

function hoverPlayVideos(winEl) {
  winEl.querySelectorAll('video.card-media').forEach(v => {
    const card = v.closest('.card');
    card.addEventListener('mouseenter', () => v.play().catch(()=>{}));
    card.addEventListener('mouseleave', () => v.pause());
  });
}

/* ═══════════════════════ APPS ═══════════════════════ */
const APPS = {

  /* ──────────────── AI STUDIO ──────────────── */
  'ai-studio': {
    id:'ai-studio', name:'AI Studio', icon:'🤖', accent:'#00f5ff', w:840, h:600,
    desc:'AI projects — trading bots, learning feeds, automation pipelines.',
    preview:'videos/learnscroll.mp4',
    render: () => `<div class="app-pad">
      <div class="app-h">// installed ai applications — ${AI_PROJECTS.length} packages</div>
      <div class="cards">${AI_PROJECTS.map(projectCard).join('')}</div>
    </div>`,
    init: hoverPlayVideos,
  },

  /* ──────────────── GAME CENTRE ──────────────── */
  'games': {
    id:'games', name:'Game Centre', icon:'🎮', accent:'#b044ff', w:860, h:620,
    desc:'Playable games — multiplayer quiz, arcade rebuilds, puzzles.',
    preview:'videos/platformer.mp4',
    render: () => `<div class="app-pad">
      <div class="app-h">// game library — all playable in browser</div>
      <div class="cards">${GAMES.map(projectCard).join('')}</div>
    </div>`,
    init: hoverPlayVideos,
  },

  /* ──────────────── APEXBOT TERMINAL ──────────────── */
  'apexbot': {
    id:'apexbot', name:'ApexBot Terminal', icon:'📊', accent:'#2bd97c', w:900, h:580,
    desc:'Live trading terminal — candles, moving averages, signal feed.',
    preview:null, previewEmoji:'📊',
    render: () => `<div class="apex">
      <div class="apex-top" id="apex-ticks"></div>
      <div class="apex-main">
        <div class="apex-chart-wrap">
          <canvas id="apex-chart"></canvas>
          <div class="apex-chart-hud">
            <div class="pair">BTC/USD · 1m</div>
            <div><span style="color:#5ad8ff">— SMA 20</span>&nbsp;&nbsp;<span style="color:#b044ff">— SMA 50</span></div>
          </div>
        </div>
        <aside class="apex-side">
          <div class="apex-side-h">Signal Log</div>
          <div id="apex-signals"></div>
          <div class="apex-stats">
            Win rate <b>67.4%</b><br>
            Trades today <b id="apex-trades">23</b><br>
            P&amp;L (sim) <b>+4.21%</b>
          </div>
        </aside>
      </div>
    </div>`,

    init(winEl) {
      const cv = winEl.querySelector('#apex-chart');
      const ctx = cv.getContext('2d');
      const state = this._state = { timers: [], candles: [], price: 67430 };

      // seed candles (random walk)
      let p = state.price;
      for (let i = 0; i < 90; i++) {
        const o = p, c = p + (Math.random() - 0.495) * 160;
        state.candles.push({ o, c, h: Math.max(o,c) + Math.random()*70, l: Math.min(o,c) - Math.random()*70 });
        p = c;
      }
      state.price = p;

      const sma = n => state.candles.map((_, i) =>
        i < n-1 ? null : state.candles.slice(i-n+1, i+1).reduce((s,k)=>s+k.c,0)/n);

      function draw() {
        const wrap = cv.parentElement;
        const W = cv.width = wrap.clientWidth * devicePixelRatio;
        const H = cv.height = wrap.clientHeight * devicePixelRatio;
        if (!W || !H) return;
        ctx.clearRect(0,0,W,H);
        const cs = state.candles;
        const lo = Math.min(...cs.map(k=>k.l)), hi = Math.max(...cs.map(k=>k.h));
        const px = v => H - ((v-lo)/(hi-lo||1)) * (H*0.88) - H*0.06;
        const cw = W / cs.length;

        // grid
        ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
          const y = (H/6)*i;
          ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
          ctx.fillStyle = 'rgba(232,236,244,0.28)';
          ctx.font = `${10*devicePixelRatio}px JetBrains Mono`;
          ctx.fillText((lo + (hi-lo)*(1-i/6)).toFixed(0), 8*devicePixelRatio, y - 4*devicePixelRatio);
        }
        // candles
        cs.forEach((k, i) => {
          const x = i*cw + cw/2;
          const up = k.c >= k.o;
          ctx.strokeStyle = ctx.fillStyle = up ? '#2bd97c' : '#ff4d6a';
          ctx.lineWidth = Math.max(1, devicePixelRatio);
          ctx.beginPath(); ctx.moveTo(x, px(k.h)); ctx.lineTo(x, px(k.l)); ctx.stroke();
          const bw = Math.max(2, cw*0.55);
          ctx.fillRect(x-bw/2, Math.min(px(k.o),px(k.c)), bw, Math.max(1.5, Math.abs(px(k.o)-px(k.c))));
        });
        // moving averages
        [[sma(20),'#5ad8ff'],[sma(50),'#b044ff']].forEach(([line,col]) => {
          ctx.strokeStyle = col; ctx.lineWidth = 1.4*devicePixelRatio; ctx.beginPath();
          let started = false;
          line.forEach((v,i) => {
            if (v == null) return;
            const x = i*cw + cw/2;
            started ? ctx.lineTo(x, px(v)) : ctx.moveTo(x, px(v));
            started = true;
          });
          ctx.stroke();
        });
        // last price line
        const last = cs[cs.length-1].c;
        ctx.strokeStyle = 'rgba(0,245,255,0.5)'; ctx.setLineDash([6,5]);
        ctx.beginPath(); ctx.moveTo(0, px(last)); ctx.lineTo(W, px(last)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#00f5ff';
        ctx.fillText(last.toFixed(0), W - 64*devicePixelRatio, px(last) - 5*devicePixelRatio);
      }

      // tickers
      const tickers = [
        { sym:'BTC/USD', px: 67430, dp: 0 }, { sym:'ETH/USD', px: 3522, dp: 1 },
        { sym:'EUR/USD', px: 1.0863, dp: 4 }, { sym:'AAPL', px: 213.4, dp: 2 },
        { sym:'NVDA', px: 131.2, dp: 2 }, { sym:'XAU/USD', px: 2389.5, dp: 1 },
      ];
      const tickRow = winEl.querySelector('#apex-ticks');
      function renderTicks() {
        tickRow.innerHTML = tickers.map(t => {
          const up = t.chg >= 0;
          return `<div class="apex-tick"><span class="sym">${t.sym}</span>
            <span class="px">${t.px.toFixed(t.dp)}</span>
            <span class="chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(t.chg||0).toFixed(2)}%</span></div>`;
        }).join('');
      }
      tickers.forEach(t => t.chg = (Math.random()-0.5)*2);
      renderTicks();

      // signal feed
      const sigBox = winEl.querySelector('#apex-signals');
      const sigMsgs = [
        ['buy','BUY signal — SMA20 crossed above SMA50 on BTC/USD'],
        ['sell','SELL signal — RSI overbought (74.2) on ETH/USD'],
        ['buy','BUY signal — bullish engulfing at support, EUR/USD'],
        ['sell','TP hit +1.8% — position closed BTC/USD'],
        ['buy','BUY signal — volume spike + MA confluence NVDA'],
        ['sell','SL triggered −0.6% — risk managed, XAU/USD'],
        ['buy','BUY signal — higher-low structure confirmed AAPL'],
      ];
      let trades = 23;
      function pushSignal() {
        const [cls,msg] = sigMsgs[Math.floor(Math.random()*sigMsgs.length)];
        const d = new Date();
        const el = document.createElement('div');
        el.className = 'sig ' + cls;
        el.innerHTML = `<span class="t">${d.toTimeString().slice(0,8)}</span><br>${msg}`;
        sigBox.prepend(el);
        while (sigBox.children.length > 30) sigBox.lastChild.remove();
        const tr = winEl.querySelector('#apex-trades');
        if (tr) tr.textContent = ++trades;
      }
      for (let i = 0; i < 5; i++) pushSignal();

      // live loop
      state.timers.push(setInterval(() => {
        const lastC = state.candles[state.candles.length-1];
        const o = lastC.c, c = o + (Math.random()-0.495)*160;
        state.candles.push({ o, c, h: Math.max(o,c)+Math.random()*70, l: Math.min(o,c)-Math.random()*70 });
        if (state.candles.length > 90) state.candles.shift();
        draw();
      }, 1800));
      state.timers.push(setInterval(() => {
        tickers.forEach(t => { t.chg = (t.chg||0) + (Math.random()-0.5)*0.4; t.px *= 1 + (Math.random()-0.5)*0.0011; });
        renderTicks();
      }, 2400));
      state.timers.push(setInterval(pushSignal, 4200));

      const ro = new ResizeObserver(draw);
      ro.observe(cv.parentElement);
      state.ro = ro;
      requestAnimationFrame(draw);
    },
    destroy() {
      const s = this._state;
      if (!s) return;
      s.timers.forEach(clearInterval);
      if (s.ro) s.ro.disconnect();
      this._state = null;
    },
  },

  /* ──────────────── FILE EXPLORER ──────────────── */
  'files': {
    id:'files', name:'Files', icon:'🗂️', accent:'#ffd166', w:760, h:520,
    desc:'Browse projects, skills, CV and contact details.',
    preview:null, previewEmoji:'🗂️',
    render: () => `<div class="files">
      <nav class="files-tree" id="ftree">
        <div class="tree-item active" data-dir="projects">📁 Projects</div>
        <div class="tree-item" data-dir="about">📁 About Me</div>
        <div class="tree-item" data-dir="skills">📁 Skills</div>
        <div class="tree-item" data-dir="cv">📁 CV</div>
        <div class="tree-item" data-dir="contact">📁 Contact</div>
      </nav>
      <div class="files-main" id="fmain"></div>
    </div>`,
    init(winEl) {
      const main = winEl.querySelector('#fmain');
      const dirs = {
        projects: () => `<div class="app-h">// ~/projects</div><div class="files-grid">
          <div class="fitem" onclick="WM.open('ai-studio')"><span class="fitem-icon">🤖</span><span class="fitem-name">AI Studio.app</span></div>
          <div class="fitem" onclick="WM.open('games')"><span class="fitem-icon">🎮</span><span class="fitem-name">Game Centre.app</span></div>
          <div class="fitem" onclick="WM.open('apexbot')"><span class="fitem-icon">📊</span><span class="fitem-name">ApexBot.exe</span></div>
          <div class="fitem" onclick="WM.open('browser')"><span class="fitem-icon">🌐</span><span class="fitem-name">Live Sites.url</span></div>
        </div>`,
        about: () => `<div class="app-h">// ~/about-me</div><div class="files-grid">
          <div class="fitem" onclick="WM.open('notes')"><span class="fitem-icon">📝</span><span class="fitem-name">README.md</span></div>
        </div>
        <p style="font-size:12.5px;color:var(--txt-2);line-height:1.7;margin-top:16px;max-width:420px">
          Jimi Hughes — creator &amp; AI engineer. I build things that ship: trading bots,
          multiplayer games, AI pipelines, and the operating system you're standing in.
        </p>`,
        skills: () => `<div class="app-h">// system resources — skill utilisation</div>
        <div class="skillbars">
          ${[['JavaScript / TypeScript',92],['Python',88],['AI / LLM Integration',90],
             ['Node.js & APIs',85],['React',80],['Canvas / WebGL',78],
             ['Trading Systems',82],['UI / UX Design',86]].map(([s,v]) => `
            <div class="skill">
              <div class="skill-row"><span>${s}</span><b>${v}%</b></div>
              <div class="skill-bar"><div class="skill-fill" data-v="${v}"></div></div>
            </div>`).join('')}
        </div>`,
        cv: () => `<div class="app-h">// ~/cv</div><div class="files-grid">
          <div class="fitem" onclick="JOS.toast('📄 CV download — drop your real CV.pdf in the repo root to enable')"><span class="fitem-icon">📄</span><span class="fitem-name">Jimi_Hughes_CV.pdf</span></div>
        </div>`,
        contact: () => `<div class="app-h">// ~/contact</div><div class="files-grid">
          <div class="fitem" onclick="WM.open('contact')"><span class="fitem-icon">📬</span><span class="fitem-name">Contact.exe</span></div>
          <div class="fitem" onclick="window.open('https://www.linkedin.com/in/jimi-hughes-a0b33737b','_blank')"><span class="fitem-icon">💼</span><span class="fitem-name">LinkedIn.url</span></div>
        </div>`,
      };
      function show(dir) {
        main.innerHTML = dirs[dir]();
        // animate skill bars after paint
        requestAnimationFrame(() => requestAnimationFrame(() =>
          main.querySelectorAll('.skill-fill').forEach(f => f.style.width = f.dataset.v + '%')));
      }
      winEl.querySelectorAll('.tree-item').forEach(t => t.addEventListener('click', () => {
        winEl.querySelectorAll('.tree-item').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        show(t.dataset.dir);
      }));
      show('projects');
    },
  },

  /* ──────────────── CONTACT.EXE ──────────────── */
  'contact': {
    id:'contact', name:'Contact.exe', icon:'📬', accent:'#2bd97c', w:560, h:440,
    desc:'Terminal-style contact form. Say hello.',
    preview:null, previewEmoji:'📬',
    render: () => `<div class="cterm">
      <div class="muted"># contact protocol v1.0 — all fields transmitted via mail client</div>
      <div class="muted"># press TAB / ENTER to advance</div>
      <br>
      <div class="cterm-line"><span class="p">&gt; enter_your_name:</span><input id="ct-name" autocomplete="name" spellcheck="false"></div>
      <div class="cterm-line"><span class="p">&gt; enter_your_email:</span><input id="ct-email" type="email" autocomplete="email" spellcheck="false"></div>
      <div class="cterm-line" style="display:block"><span class="p">&gt; enter_message:</span><br><textarea id="ct-msg" spellcheck="false"></textarea></div>
      <br>
      <button class="btn" id="ct-send">▶ transmit_message</button>
      <span class="cursor"></span>
      <div id="ct-status" class="muted" style="margin-top:10px"></div>
    </div>`,
    init(winEl) {
      const status = winEl.querySelector('#ct-status');
      winEl.querySelector('#ct-send').addEventListener('click', () => {
        const name = winEl.querySelector('#ct-name').value.trim();
        const email = winEl.querySelector('#ct-email').value.trim();
        const msg = winEl.querySelector('#ct-msg').value.trim();
        if (!name || !msg) { status.textContent = '! error: name and message required'; status.style.color = 'var(--red)'; return; }
        status.style.color = 'var(--green)';
        status.textContent = '✓ opening mail client...';
        location.href = `mailto:jimifh0111@gmail.com?subject=${encodeURIComponent('JimiOS contact from ' + name)}&body=${encodeURIComponent(msg + '\n\n— ' + name + (email ? ' <' + email + '>' : ''))}`;
      });
      setTimeout(() => winEl.querySelector('#ct-name').focus(), 350);
    },
  },

  /* ──────────────── BROWSER ──────────────── */
  'browser': {
    id:'browser', name:'NetRunner', icon:'🌐', accent:'#5ad8ff', w:880, h:600,
    desc:'In-OS browser with bookmarks to live projects.',
    preview:null, previewEmoji:'🌐',
    render: () => `<div class="browser">
      <div class="browser-bar">
        <button class="nav" id="br-back" title="Back">←</button>
        <button class="nav" id="br-reload" title="Reload">⟳</button>
        <input id="browser-url" value="jimios://newtab" spellcheck="false">
      </div>
      <div class="browser-bm" id="br-bms"></div>
      <div id="browser-view">
        <iframe id="browser-frame" style="display:none" title="Browser view"></iframe>
        <div id="browser-splash">
          <div style="font-size:36px">🌐</div>
          <div style="font-size:14px;color:var(--txt)">NetRunner</div>
          <div>Pick a bookmark above, or type a URL.<br>Local projects load inline — external sites may refuse to be framed and open in a new tab.</div>
        </div>
      </div>
    </div>`,
    init(winEl) {
      const BMS = [
        { label:'🧠 Quiz (play inline!)', url:'quiz/', inline:true },
        { label:'🐍 Snake', url:'snake/', inline:true },
        { label:'🔢 2048', url:'2048/', inline:true },
        { label:'🏃 Pixel Runner', url:'platformer/', inline:true },
        { label:'👾 Space Invaders', url:'space-invaders/', inline:true },
        { label:'💼 LinkedIn', url:'https://www.linkedin.com/in/jimi-hughes-a0b33737b', inline:false },
        { label:'📡 Learnscroll', url:'https://learn-scroll.onrender.com', inline:false },
      ];
      const frame = winEl.querySelector('#browser-frame');
      const splash = winEl.querySelector('#browser-splash');
      const urlbar = winEl.querySelector('#browser-url');
      const history = [];
      function go(url, inline) {
        urlbar.value = url;
        if (inline === false || /^https?:\/\//.test(url) && !url.includes(location.host)) {
          window.open(url, '_blank', 'noopener');
          return;
        }
        history.push(url);
        splash.style.display = 'none';
        frame.style.display = 'block';
        frame.src = url;
      }
      winEl.querySelector('#br-bms').innerHTML = BMS.map((b,i) =>
        `<button class="bm" data-i="${i}">${b.label}</button>`).join('');
      winEl.querySelectorAll('.bm').forEach(b => b.addEventListener('click', () => {
        const bm = BMS[+b.dataset.i]; go(bm.url, bm.inline);
      }));
      urlbar.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        let u = urlbar.value.trim();
        if (!u) return;
        if (!/^https?:\/\//.test(u) && u.includes('.') && !u.endsWith('/')) u = 'https://' + u;
        go(u, !/^https?:\/\//.test(u));
      });
      winEl.querySelector('#br-reload').addEventListener('click', () => { if (frame.src) frame.src = frame.src; });
      winEl.querySelector('#br-back').addEventListener('click', () => {
        history.pop();
        const prev = history.pop();
        if (prev) go(prev, true);
        else { frame.style.display='none'; splash.style.display='flex'; urlbar.value='jimios://newtab'; }
      });
    },
  },

  /* ──────────────── NOTES / README ──────────────── */
  'notes': {
    id:'notes', name:'README.md', icon:'📝', accent:'#ffd166', w:640, h:560,
    desc:'About me — the human behind the OS.',
    preview:null, previewEmoji:'📝',
    render: () => `<div class="md">
      <h1>Jimi Hughes</h1>
      <p style="color:var(--accent);font-family:var(--mono);font-size:12px">creator · AI engineer · builder of slightly-too-ambitious side projects</p>
      <hr>
      <h2>## whoami</h2>
      <p>I build things that ship. Trading bots that watch markets while I sleep, multiplayer games that make friends shout at each other, AI pipelines that turn a single prompt into finished video — and this operating system, which started as "I'll just put my projects on a page."</p>
      <h2>## currently</h2>
      <ul>
        <li>Running <strong>ApexBot</strong> — an algorithmic trading system (open the terminal app, it's live)</li>
        <li>Shipping AI-powered web apps on <code>Groq</code> + <code>Node.js</code></li>
        <li>Automating content pipelines: script → voice → video, zero hands</li>
      </ul>
      <h2>## stack</h2>
      <p><code>JavaScript</code> <code>TypeScript</code> <code>Python</code> <code>Node.js</code> <code>React</code> <code>Socket.io</code> <code>Canvas/WebGL</code> <code>Groq</code> <code>Pandas</code></p>
      <h2>## philosophy</h2>
      <p>Done is better than perfect, but <strong>delightful</strong> is better than done. Every project here is live, clickable, and slightly over-engineered on purpose.</p>
      <h2>## contact</h2>
      <p>Open <code>Contact.exe</code> from the desktop, or find me on <a href="https://www.linkedin.com/in/jimi-hughes-a0b33737b" target="_blank" rel="noopener">LinkedIn</a>.</p>
    </div>`,
  },

  /* ──────────────── SETTINGS ──────────────── */
  'settings': {
    id:'settings', name:'Settings', icon:'⚙️', accent:'#8a93a8', w:660, h:520,
    desc:'Wallpaper, accent colour, themes, about JimiOS.',
    preview:null, previewEmoji:'⚙️',
    render: () => {
      const P = JOS.prefs;
      const ACCENTS = [['#00f5ff','0,245,255'],['#b044ff','176,68,255'],['#2bd97c','43,217,124'],
        ['#ff4d6a','255,77,106'],['#ffd166','255,209,102'],['#5ad8ff','90,216,255'],['#ff8c42','255,140,66']];
      return `<div class="settings">
      <nav class="set-nav">
        <div class="set-nav-item active" data-pane="appearance">🎨 Appearance</div>
        <div class="set-nav-item" data-pane="system">🖥️ System</div>
        <div class="set-nav-item" data-pane="access">♿ Accessibility</div>
        <div class="set-nav-item" data-pane="about">ℹ️ About</div>
      </nav>
      <div class="set-main">
        <div class="set-pane on" data-pane="appearance">
          <div class="app-h">// appearance</div>
          <div class="set-row">
            <div><div class="set-label">Accent colour</div><div class="set-sub">Recolours the entire OS</div></div>
            <div class="swatches">${ACCENTS.map(([c,rgb]) =>
              `<div class="swatch${P.accent===c?' on':''}" style="background:${c}" data-accent="${c}" data-rgb="${rgb}"></div>`).join('')}</div>
          </div>
          <div class="set-row" style="flex-wrap:wrap">
            <div><div class="set-label">Wallpaper</div><div class="set-sub">Live animated backgrounds</div></div>
            <div class="wp-opts">${JOS.WALLPAPERS.map(w =>
              `<div class="wp-opt${P.wallpaper===w.id?' on':''}" style="background:${w.thumb}" data-wp="${w.id}"><span>${w.name}</span></div>`).join('')}</div>
          </div>
          <div class="set-row">
            <div><div class="set-label">Theme</div><div class="set-sub">Cyberpunk dark is the truth</div></div>
            <div class="seg">
              <button class="seg-btn${P.theme==='dark'?' on':''}" data-theme="dark">Dark</button>
              <button class="seg-btn${P.theme==='light'?' on':''}" data-theme="light">Light</button>
            </div>
          </div>
        </div>
        <div class="set-pane" data-pane="system">
          <div class="app-h">// system</div>
          <div class="set-row">
            <div><div class="set-label">UI sounds</div><div class="set-sub">Synthesized — no audio files</div></div>
            <div class="toggle${P.sounds?' on':''}" data-toggle="sounds"></div>
          </div>
          <div class="set-row">
            <div><div class="set-label">Ambient soundscape</div><div class="set-sub">Lo-fi synth pad, very quiet</div></div>
            <div class="toggle${P.ambient?' on':''}" data-toggle="ambient"></div>
          </div>
          <div class="set-row">
            <div><div class="set-label">Reset JimiOS</div><div class="set-sub">Clears saved layout &amp; preferences</div></div>
            <button class="btn ghost" id="set-reset">Factory Reset</button>
          </div>
        </div>
        <div class="set-pane" data-pane="access">
          <div class="app-h">// accessibility</div>
          <div class="set-row">
            <div><div class="set-label">Font size</div><div class="set-sub">Scales all UI text</div></div>
            <div class="seg">
              <button class="seg-btn${P.fs===0.9?' on':''}" data-fs="0.9">A−</button>
              <button class="seg-btn${P.fs===1?' on':''}" data-fs="1">A</button>
              <button class="seg-btn${P.fs===1.15?' on':''}" data-fs="1.15">A+</button>
            </div>
          </div>
          <div class="set-row">
            <div><div class="set-label">Keyboard</div><div class="set-sub">Alt+Tab cycles windows · Esc closes menus · Enter opens selected icon</div></div>
          </div>
        </div>
        <div class="set-pane" data-pane="about">
          <div class="about-os">
            <div class="about-os-logo">J</div>
            <div style="font-size:19px;font-weight:700;letter-spacing:0.1em">Jimi<span style="color:var(--accent)">OS</span></div>
            <div style="font-family:var(--mono);font-size:10.5px;color:var(--txt-3);margin-top:4px">version 1.0 "Neon"</div>
          </div>
          ${[['Built by','Jimi Hughes'],['Engine','Vanilla JS — zero frameworks'],['Window manager','Custom, ~300 lines'],
             ['Graphics','Canvas particle wallpapers'],['Persistence','localStorage'],['Hosting','GitHub Pages'],
             ['Easter eggs','3 (find them)']].map(([k,v]) =>
            `<div class="about-kv"><span class="k">${k}</span><span>${v}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
    },
    init(winEl) {
      winEl.querySelectorAll('.set-nav-item').forEach(n => n.addEventListener('click', () => {
        winEl.querySelectorAll('.set-nav-item').forEach(x => x.classList.remove('active'));
        n.classList.add('active');
        winEl.querySelectorAll('.set-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === n.dataset.pane));
      }));
      winEl.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', () => {
        JOS.setAccent(s.dataset.accent, s.dataset.rgb);
        winEl.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === s));
      }));
      winEl.querySelectorAll('.wp-opt').forEach(w => w.addEventListener('click', () => {
        JOS.setWallpaper(w.dataset.wp);
        winEl.querySelectorAll('.wp-opt').forEach(x => x.classList.toggle('on', x === w));
      }));
      winEl.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
        JOS.setTheme(b.dataset.theme);
        winEl.querySelectorAll('[data-theme]').forEach(x => x.classList.toggle('on', x === b));
      }));
      winEl.querySelectorAll('[data-fs]').forEach(b => b.addEventListener('click', () => {
        JOS.setFontScale(+b.dataset.fs);
        winEl.querySelectorAll('[data-fs]').forEach(x => x.classList.toggle('on', x === b));
      }));
      winEl.querySelectorAll('.toggle[data-toggle]').forEach(t => t.addEventListener('click', () => {
        const key = t.dataset.toggle;
        const on = JOS.togglePref(key);
        t.classList.toggle('on', on);
      }));
      const reset = winEl.querySelector('#set-reset');
      if (reset) reset.addEventListener('click', () => {
        if (!confirm('Factory reset JimiOS? Clears all saved preferences and layout.')) return;
        localStorage.clear();
        location.reload();
      });
    },
  },

  /* ──────────────── SECRET (Konami unlock) ──────────────── */
  'secret': {
    id:'secret', name:'Secret Projects', icon:'🔮', accent:'#ff4d6a', w:520, h:380, hidden:true,
    desc:'You found it.',
    render: () => `<div class="app-pad" style="font-family:var(--mono);font-size:12.5px;line-height:2">
      <div class="app-h">// classified — konami clearance granted</div>
      <p>🔮 <strong>Project Oracle</strong> — LLM that predicts which side projects I'll actually finish. Accuracy: 12%.</p>
      <p>🤫 <strong>JimiOS 2.0</strong> — this, but it boots <em>your</em> projects too.</p>
      <p>👻 <strong>The Graveyard</strong> — 14 abandoned repos. We do not speak of the NFT thing.</p>
      <p style="color:var(--txt-3)">// you're the kind of person who tries konami codes on portfolio sites.<br>// we should probably work together. → Contact.exe</p>
    </div>`,
  },
};
