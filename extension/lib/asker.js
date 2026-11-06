/* CareerOS — question cards
 *
 * When an application asks something only the person can answer, CareerOS walks them through those questions
 * one small card at a time, right beside the question on the form: "2 of 4 · This form asks…". The card never
 * blocks the page (no dimming, no overlay), never takes the cursor and never scrolls while they type: it only
 * scrolls to the next question when they move on. When they answer, the card moves to the next question by
 * itself; their answers are saved, so the same question on a later form is filled without asking again.
 *
 * Everything renders in its own shadow root, so a job site's CSS can't restyle it.
 *
 *   const run = Asker.start({
 *     items: [{ node, label, required, sensitive, canDecline }],
 *     isAnswered(item) -> bool,
 *     onDecline(item) -> Promise<bool>,     // "Prefer not to say"
 *   });
 *   run.skipped(item)  run.pending()  run.stop()
 */
(function (root) {
  'use strict';

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .card {
      position: fixed; z-index: 2147483646;
      width: 320px; max-width: calc(100vw - 24px);
      background: #fff; color: #1C1720;
      border: 1px solid rgba(28,23,32,.12); border-radius: 14px;
      box-shadow: 0 18px 50px -18px rgba(28,23,32,.45), 0 2px 6px rgba(28,23,32,.08);
      font: 13px/1.45 "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      padding: 14px 14px 12px;
      opacity: 0; transform: translateY(4px);
      transition: opacity 180ms ease, transform 180ms ease, top 260ms cubic-bezier(.22,1,.36,1), left 260ms cubic-bezier(.22,1,.36,1);
    }
    .card.on { opacity: 1; transform: none; }
    .arrow { position: absolute; width: 12px; height: 12px; background: #fff; transform: rotate(45deg);
      border: 1px solid rgba(28,23,32,.12); }
    .arrow.top { top: -7px; border-right: 0; border-bottom: 0; }
    .arrow.bottom { bottom: -7px; border-left: 0; border-top: 0; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .step { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #E2632F; }
    .dots { display: flex; gap: 4px; align-items: center; }
    .x { border: 0; background: none; padding: 2px 4px; margin-left: 6px; font-size: 16px; line-height: 1; color: #645C68; }
    .x:hover { background: rgba(28,23,32,.06); color: #1C1720; }
    .tr { display: flex; align-items: center; }
    .dot { width: 6px; height: 6px; border-radius: 99px; background: rgba(28,23,32,.15); }
    .dot.done { background: #2E9E5B; }
    .dot.now { background: #E2632F; }
    .dot.skip { background: #C9B8A8; }
    .q { margin: 8px 0 4px; font-size: 14px; font-weight: 600; line-height: 1.35; max-height: 4.1em; overflow: hidden; }
    .hint { margin: 0; color: #645C68; font-size: 12px; }
    .hint b { color: #1C1720; font-weight: 600; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; }
    .left, .right { display: flex; gap: 6px; }
    button { font: inherit; font-size: 12px; font-weight: 600; border-radius: 8px; padding: 6px 10px; cursor: pointer;
      border: 1px solid rgba(28,23,32,.14); background: #fff; color: #1C1720; }
    button:hover { background: #F6F3F7; }
    button.primary { background: #1C1720; color: #fff; border-color: #1C1720; }
    button.primary:hover { background: #352c3a; }
    button.primary[disabled] { opacity: .45; cursor: default; }
    button.link { border: 0; background: none; padding: 6px 4px; color: #645C68; }
    button.link:hover { background: rgba(28,23,32,.06); color: #1C1720; }
    .ok { display: inline-flex; align-items: center; gap: 4px; color: #2E9E5B; font-size: 12px; font-weight: 600; }
    @media (prefers-color-scheme: dark) {
      .card, .arrow { background: #1E1822; color: #F6F2F7; border-color: rgba(255,255,255,.12); }
      .hint { color: #B6AEBA; } .hint b { color: #F6F2F7; }
      button { background: #1E1822; color: #F6F2F7; border-color: rgba(255,255,255,.16); }
      button:hover { background: #2A2230; }
      button.link, .x { background: none; color: #CFC7D3; }
      button.link:hover, .x:hover { background: rgba(255,255,255,.08); color: #fff; }
      button.primary { background: #F6F2F7; color: #1C1720; border-color: #F6F2F7; }
      .dot { background: rgba(255,255,255,.18); }
    }
  `;

  const IDLE_MS = 1200;
  let current = null;

  function clean(label) {
    return String(label || '').replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  function inView(rect) {
    return rect.top >= 60 && rect.bottom <= window.innerHeight - 60;
  }

  function start(opts) {
    if (current) current.stop();
    const items = (opts.items || []).filter((i) => i && i.node);
    if (!items.length) return null;

    const host = document.createElement('div');
    host.setAttribute('data-careeros-ui', '');
    host.setAttribute('data-careeros-asker', '');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    shadow.append(style, card);
    // A form inside a modal <dialog> sits in the browser's top layer, above anything else on the page: put the
    // cards inside that dialog so they show above it and can be clicked.
    const first = items[0].node;
    const modal = first && first.closest && first.closest('dialog[open]');
    (modal || document.body || document.documentElement).appendChild(host);

    const skipped = new Set();
    let index = 0;
    let lastTouch = 0;
    let raf = 0;
    let stopped = false;

    const answered = (item) => skipped.has(item) || Boolean(opts.isAnswered && opts.isAnswered(item));
    const anchor = (item) => (item.kind === 'radio' || item.kind === 'choice' ? (item.node.closest('fieldset') || item.node.parentElement) : item.node) || item.node;

    function place() {
      raf = 0;
      if (stopped) return;
      const item = items[index];
      const el = item && anchor(item);
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const w = card.offsetWidth || 320;
      const h = card.offsetHeight || 150;
      const gap = 12;
      // Below the question when there's room, else above; always inside the window.
      const below = r.bottom + gap + h <= window.innerHeight - 8 || r.top - gap - h < 8;
      let top = below ? r.bottom + gap : r.top - gap - h;
      top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
      let left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left));
      card.style.top = `${Math.round(top)}px`;
      card.style.left = `${Math.round(left)}px`;
      const arrow = shadow.querySelector('.arrow');
      if (arrow) {
        arrow.className = `arrow ${below ? 'top' : 'bottom'}`;
        arrow.style.left = `${Math.round(Math.max(14, Math.min(w - 26, r.left + 18 - left)))}px`;
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

    function render() {
      const item = items[index];
      const total = items.length;
      const done = answered(item);
      const dots = items.map((it, i) => `<span class="dot ${i === index ? 'now' : skipped.has(it) ? 'skip' : answered(it) ? 'done' : ''}"></span>`).join('');
      const last = index === total - 1;
      const why = item.sensitive
        ? 'Only you can answer this. <b>CareerOS asks once</b> and reuses your answer on later forms.'
        : item.required
          ? 'Answer it on the form. <b>CareerOS remembers your answer</b> for similar questions next time.'
          : 'Optional. Answer once and <b>CareerOS reuses it</b> on later forms.';
      card.innerHTML = `
        <span class="arrow top"></span>
        <div class="head"><span class="step">Question ${index + 1} of ${total}</span><span class="tr"><span class="dots">${dots}</span><button class="x" data-act="close" title="Hide these cards" aria-label="Close">×</button></span></div>
        <p class="q"></p>
        <p class="hint">${why}</p>
        <div class="row">
          <div class="left">
            ${index > 0 ? '<button class="link" data-act="back">Back</button>' : ''}
            ${item.canDecline ? '<button data-act="decline">Prefer not to say</button>' : ''}
            ${!done && !item.canDecline ? `<button class="link" data-act="skip" title="${item.required ? 'Leave it for now; the form still needs it before it can be sent' : 'Leave it empty'}">Skip</button>` : ''}
          </div>
          <div class="right">
            ${done ? '<span class="ok">✓ Saved</span>' : ''}
            <button class="${done || last ? 'primary' : ''}" data-act="next">${last ? 'Done' : 'Next'}</button>
          </div>
        </div>`;
      card.querySelector('.q').textContent = clean(item.label) || 'This question';
      card.classList.add('on');
      schedule();
    }

    function go(i) {
      index = Math.max(0, Math.min(items.length - 1, i));
      const el = anchor(items[index]);
      // Only ever scroll when moving to a question, never while the person is answering one.
      if (el && el.isConnected && !inView(el.getBoundingClientRect())) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      render();
    }

    function nextUnanswered(from) {
      for (let i = from; i < items.length; i++) if (!answered(items[i])) return i;
      for (let i = 0; i < from; i++) if (!answered(items[i])) return i;
      return -1;
    }

    function advance() {
      const n = nextUnanswered(index + 1);
      if (n === -1) { render(); return; }
      go(n);
    }

    async function act(name) {
      const item = items[index];
      if (name === 'close') { close(); return; }
      if (name === 'back') { go(index - 1); return; }
      if (name === 'next') {
        // "Done" on the last card hides the cards once nothing is left to answer; otherwise it moves on.
        if (index === items.length - 1 && nextUnanswered(0) === -1) { close(); return; }
        if (index === items.length - 1) { const n = nextUnanswered(0); go(n === -1 ? index : n); return; }
        go(index + 1);
        return;
      }
      if (name === 'skip') { skipped.add(item); advance(); return; }
      if (name === 'decline') {
        const ok = opts.onDecline ? await opts.onDecline(item) : false;
        if (!ok) skipped.add(item);
        advance();
      }
    }

    /* Hides the cards. Optional questions left empty are skipped; required ones are left for the person to fill
       on the form (the run still waits for those). */
    function close() {
      items.forEach((i) => { if (!answered(i) && !i.required) skipped.add(i); });
      run.stop();
    }

    // Application popups often trap clicks and focus inside the popup (they swallow clicks elsewhere in the
    // capture phase). Listening on the window, which runs before the page's own document listeners, keeps the
    // card's buttons working there, and stops those clicks from reaching the page.
    const fromCard = (e) => typeof e.composedPath === 'function' && e.composedPath().includes(host);
    const guard = (e) => {
      if (!fromCard(e)) return;
      e.stopImmediatePropagation();
      if (e.type === 'mousedown' || e.type === 'pointerdown') e.preventDefault();
      if (e.type !== 'click') return;
      const btn = e.composedPath().find((n) => n && n.getAttribute && n.getAttribute('data-act'));
      if (btn) act(btn.getAttribute('data-act'));
    };
    const guarded = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'touchstart', 'touchend', 'click', 'focusin'];
    guarded.forEach((ev) => window.addEventListener(ev, guard, true));

    const touch = () => { lastTouch = Date.now(); };
    const events = ['keydown', 'input', 'change', 'pointerdown'];
    events.forEach((ev) => document.addEventListener(ev, touch, { capture: true, passive: true }));
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // Move on by itself once the current question has an answer and the person has paused.
    const timer = setInterval(() => {
      if (stopped) return;
      const item = items[index];
      if (!item.node.isConnected) {
        const n = nextUnanswered(index + 1);
        if (n !== -1) go(n);
        return;
      }
      const wasDone = card.querySelector('.ok');
      if (answered(item) && Date.now() - lastTouch > IDLE_MS) {
        const n = nextUnanswered(index + 1);
        if (n !== -1 && n !== index) go(n);
        else if (!wasDone) render();
      } else if (!answered(item) && wasDone) {
        render();
      }
      schedule();
    }, 400);

    go(nextUnanswered(0) === -1 ? 0 : nextUnanswered(0));

    const run = {
      skipped: (item) => skipped.has(item),
      /* Questions still open: unanswered and not skipped. */
      pending: () => items.filter((i) => !answered(i)),
      stop() {
        if (stopped) return;
        stopped = true;
        clearInterval(timer);
        if (raf) cancelAnimationFrame(raf);
        events.forEach((ev) => document.removeEventListener(ev, touch, { capture: true }));
        window.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', schedule);
        guarded.forEach((ev) => window.removeEventListener(ev, guard, true));
        host.remove();
        if (current === run) current = null;
      },
    };
    current = run;
    return run;
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Asker = { start, isActive: () => Boolean(current), stop: () => current && current.stop() };
})(typeof self !== 'undefined' ? self : this);
