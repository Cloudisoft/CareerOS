/* CareerOS Live Copilot — in-call overlay.
 *
 * Purely passive: this content script never starts capture itself (that only happens from the extension's
 * own popup, the required user gesture for chrome.tabCapture). It shows what the background relays once the
 * person has started it: the question the interviewer just asked, a few talking points from their own resume
 * and stories, a pointer to a matching story, and what's happening (listening, transcribing, thinking).
 *
 * It renders in its own shadow root, so the call page's CSS can't restyle it; it can be dragged out of the
 * way, collapsed to a small pill, and stopped without reopening the popup.
 */
(function () {
  'use strict';
  if (window.__careerosLiveCopilot) return;
  window.__careerosLiveCopilot = true;

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .panel { position: fixed; z-index: 2147483647; right: 20px; bottom: 96px; width: 340px; max-width: calc(100vw - 24px);
      background: rgba(22, 19, 26, .96); color: #F6F2F7; border: 1px solid rgba(255,255,255,.1); border-radius: 14px;
      box-shadow: 0 18px 50px -12px rgba(0,0,0,.6); font: 13px/1.45 "Inter","Segoe UI",system-ui,-apple-system,sans-serif;
      -webkit-font-smoothing: antialiased; overflow: hidden; display: none; }
    .panel.on { display: block; }
    .head { display: flex; align-items: center; gap: 8px; padding: 9px 10px 9px 12px; cursor: grab; user-select: none;
      border-bottom: 1px solid rgba(255,255,255,.08); }
    .dot { width: 8px; height: 8px; border-radius: 99px; background: #6b6470; flex: none; }
    .dot.listening { background: #2E9E5B; box-shadow: 0 0 0 0 rgba(46,158,91,.6); animation: pulse 1.8s infinite; }
    .dot.busy { background: #E2632F; }
    @keyframes pulse { 70% { box-shadow: 0 0 0 7px rgba(46,158,91,0); } 100% { box-shadow: 0 0 0 0 rgba(46,158,91,0); } }
    .title { font-weight: 700; font-size: 12px; letter-spacing: .02em; }
    .state { color: #B6AEBA; font-size: 11px; margin-left: auto; }
    button { font: inherit; font-size: 11px; font-weight: 600; color: #F6F2F7; background: rgba(255,255,255,.08); border: 0;
      border-radius: 7px; padding: 4px 8px; cursor: pointer; }
    button:hover { background: rgba(255,255,255,.16); }
    button.stop { background: rgba(226,99,47,.2); color: #FFB394; }
    .body { padding: 10px 12px 12px; max-height: 46vh; overflow: auto; }
    .panel.min .body { display: none; }
    .kind { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #E2632F; }
    .q { margin: 3px 0 8px; font-weight: 600; font-size: 14px; line-height: 1.35; }
    ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 5px; }
    li { padding: 6px 9px; border-radius: 8px; background: rgba(255,255,255,.06); }
    .story { margin-top: 8px; padding: 6px 9px; border-radius: 8px; background: rgba(46,158,91,.14); color: #9FE3BB; }
    .muted { color: #B6AEBA; font-size: 12px; }
    .heard { margin-top: 10px; color: #8E8692; font-size: 11px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .err { margin-top: 8px; color: #FFB394; font-size: 12px; }
    .prev { margin-top: 12px; border-top: 1px solid rgba(255,255,255,.08); padding-top: 8px; }
    .prev summary { cursor: pointer; color: #B6AEBA; font-size: 11px; }
    .prev p { margin: 6px 0 0; font-size: 12px; color: #CFC7D3; }
    .fresh { animation: fresh .5s ease; }
    @keyframes fresh { from { background: rgba(226,99,47,.25); } to { background: transparent; } }
  `;

  let host = null;
  let shadow = null;
  let panel = null;
  const history = [];

  function el(sel) { return shadow.querySelector(sel); }

  function ensureUI() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'careeros-live-copilot-root';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${CSS}</style>
      <div class="panel" role="complementary" aria-label="CareerOS Live Copilot">
        <div class="head">
          <span class="dot"></span><span class="title">CareerOS Live Copilot</span>
          <span class="state">Starting…</span>
          <button class="min" title="Collapse">–</button>
          <button class="stop" title="Stop Live Copilot">Stop</button>
        </div>
        <div class="body">
          <div class="current"><p class="muted">Listening for the interviewer's next question. Talking points from your resume will show here.</p></div>
          <div class="err" hidden></div>
          <div class="heard" hidden></div>
          <details class="prev" hidden><summary>Earlier questions</summary><div class="list"></div></details>
        </div>
      </div>`;
    document.documentElement.appendChild(host);
    panel = el('.panel');
    el('.stop').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'liveCopilot:stop' }).catch(() => {});
      setState('Stopped', 'idle');
      setTimeout(hide, 800);
    });
    el('.min').addEventListener('click', () => {
      panel.classList.toggle('min');
      el('.min').textContent = panel.classList.contains('min') ? '+' : '–';
    });
    drag(el('.head'));
  }

  /* Drag the panel by its header, kept inside the window. */
  function drag(handle) {
    let sx = 0; let sy = 0; let ox = 0; let oy = 0; let moving = false;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      moving = true;
      const r = panel.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!moving) return;
      const w = panel.offsetWidth; const h = panel.offsetHeight;
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, ox + e.clientX - sx));
      const y = Math.max(8, Math.min(window.innerHeight - h - 8, oy + e.clientY - sy));
      Object.assign(panel.style, { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' });
    });
    handle.addEventListener('pointerup', () => { moving = false; });
  }

  function show() { ensureUI(); panel.classList.add('on'); }
  function hide() { if (panel) panel.classList.remove('on'); }

  function setState(text, kind) {
    ensureUI();
    el('.state').textContent = text;
    el('.dot').className = `dot ${kind === 'listening' ? 'listening' : kind === 'busy' ? 'busy' : ''}`;
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }

  function showAssist(a) {
    show();
    const cur = el('.current');
    const prevQ = cur.dataset.q;
    if (prevQ) {
      history.unshift(prevQ);
      el('.prev').hidden = false;
      el('.prev .list').innerHTML = history.slice(0, 5).map((q) => `<p>${esc(q)}</p>`).join('');
    }
    cur.dataset.q = a.question;
    cur.innerHTML = `
      ${a.kind ? `<span class="kind">${esc(a.kind)}</span>` : ''}
      <p class="q">${esc(a.question)}</p>
      ${a.points && a.points.length ? `<ul>${a.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${a.story ? `<div class="story">Your story: ${esc(a.story)}</div>` : ''}`;
    cur.classList.remove('fresh'); void cur.offsetWidth; cur.classList.add('fresh');
    el('.err').hidden = true;
  }

  const STATES = { listening: ['Listening', 'listening'], transcribing: ['Hearing…', 'busy'], thinking: ['Thinking…', 'busy'] };

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'liveCopilot:started' && msg.mode === 'live') { show(); setState('Listening', 'listening'); }
    if (msg.type === 'liveCopilot:status' && host && STATES[msg.status]) setState(...STATES[msg.status]);
    if (msg.type === 'liveCopilot:assist' && msg.assist) showAssist(msg.assist);
    // Extension versions before 1.2 sent single-line hints.
    if (msg.type === 'liveCopilot:hint' && msg.hint && msg.hint.text) showAssist({ question: msg.hint.text, points: [], story: '' });
    if (msg.type === 'liveCopilot:transcript' && host && msg.transcript) {
      const h = el('.heard'); h.hidden = false; h.textContent = `Heard: “${msg.transcript}”`;
    }
    if (msg.type === 'liveCopilot:error' && host) {
      const e = el('.err'); e.hidden = false; e.textContent = msg.message;
    }
    if (msg.type === 'liveCopilot:stopped') {
      show();
      setState('Stopped', 'idle');
      if (msg.reason) { const e = el('.err'); e.hidden = false; e.textContent = msg.reason; }
    }
  });

  // If Live Copilot is already running on this tab (the page re-rendered), show the panel again.
  try {
    chrome.runtime.sendMessage({ type: 'liveCopilot:status?' }).then((r) => { if (r && r.active) { show(); setState('Listening', 'listening'); } }).catch(() => {});
  } catch (err) { /* extension reloaded */ }
})();
