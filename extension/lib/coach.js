/* CareerOS — coach marks
 *
 * A spotlight walkthrough: the screen dims, the real control being explained
 * is cut out of the dim and outlined, and a step card sits beside it with
 * Back / Next / Skip. Used by the popup and by the panel on job pages.
 *
 * Everything renders inside its own shadow root, so a job site's CSS can't
 * restyle it and its CSS can't leak onto the job site. No dependencies.
 *
 *   Coach.start({
 *     steps: [{ target: Element | selector | () => Element, title, text, placement? }],
 *     onFinish(completed) {}
 *   });
 */
(function (root) {
  'use strict';

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .layer {
      position: fixed; inset: 0;
      pointer-events: auto;
      font: 13px/1.45 "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #1C1720;
      -webkit-font-smoothing: antialiased;
      opacity: 0;
      transition: opacity 200ms ease;
    }
    .layer.on { opacity: 1; }
    .spot {
      position: fixed;
      border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(18, 12, 24, 0.58);
      transition: top 320ms cubic-bezier(.22,1,.36,1), left 320ms cubic-bezier(.22,1,.36,1),
                  width 320ms cubic-bezier(.22,1,.36,1), height 320ms cubic-bezier(.22,1,.36,1);
      pointer-events: none;
    }
    .spot::after {
      content: ""; position: absolute; inset: -3px;
      border-radius: inherit;
      border: 2px solid #F46A29;
      animation: ring 1.8s ease-out infinite;
    }
    .spot.none { box-shadow: 0 0 0 9999px rgba(18, 12, 24, 0.58); }
    .spot.none::after { display: none; }
    @keyframes ring {
      0% { box-shadow: 0 0 0 0 rgba(244,106,41,.55); }
      70% { box-shadow: 0 0 0 10px rgba(244,106,41,0); }
      100% { box-shadow: 0 0 0 0 rgba(244,106,41,0); }
    }
    .card {
      position: fixed;
      width: 280px; max-width: calc(100vw - 24px);
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 18px 50px rgba(18, 12, 24, 0.28), 0 2px 6px rgba(18, 12, 24, 0.08);
      padding: 16px 16px 14px;
      transition: top 320ms cubic-bezier(.22,1,.36,1), left 320ms cubic-bezier(.22,1,.36,1);
    }
    .card.pop { animation: pop 260ms cubic-bezier(.22,1,.36,1); }
    @keyframes pop {
      from { opacity: 0; transform: translateY(6px) scale(.97); }
      to { opacity: 1; transform: none; }
    }
    .arrow {
      position: absolute; width: 14px; height: 14px;
      background: #FFFFFF; transform: rotate(45deg);
      border-radius: 3px;
    }
    .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .dots { display: flex; gap: 5px; }
    .dot { width: 6px; height: 6px; border-radius: 3px; background: #E9E3DE; transition: width 220ms, background 220ms; }
    .dot.on { width: 18px; background: linear-gradient(135deg, #F78320, #F14C2E); }
    .dot.done { background: #F7B48C; }
    .count { font-size: 11px; font-weight: 700; color: #9A939F; letter-spacing: .02em; }
    .title { font-size: 14.5px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 4px; }
    .text { font-size: 12.5px; color: #5F5966; margin: 0; }
    .actions { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
    .grow { flex: 1; }
    button {
      font: inherit; font-size: 12.5px; font-weight: 700;
      border: 0; cursor: pointer; border-radius: 10px;
      padding: 8px 14px;
      transition: transform 140ms, box-shadow 200ms, background 160ms, color 160ms;
    }
    button:active { transform: scale(.97); }
    button:focus-visible { outline: 2px solid #F78320; outline-offset: 2px; }
    .skip { background: none; color: #9A939F; padding: 8px 4px; }
    .skip:hover { color: #1C1720; }
    .back { background: #F4F0EC; color: #1C1720; }
    .back:hover { background: #ECE6E1; }
    .next {
      color: #FFF;
      background: linear-gradient(135deg, #F78320 0%, #F14C2E 60%, #EF4232 100%);
      box-shadow: 0 4px 12px rgba(241, 76, 46, .3);
    }
    .next:hover { box-shadow: 0 6px 16px rgba(241, 76, 46, .38); transform: translateY(-1px); }
    @media (prefers-reduced-motion: reduce) {
      .spot, .card, .layer { transition: none; }
      .spot::after, .card.pop { animation: none; }
    }
  `;

  let active = null;

  function resolveTarget(t) {
    if (!t) return null;
    if (typeof t === 'function') return t();
    if (typeof t === 'string') return document.querySelector(t);
    return t;
  }

  function isShown(el) {
    if (!el || !el.getClientRects || !el.getClientRects().length) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  const Coach = {
    isActive() { return Boolean(active); },

    stop(completed) {
      if (!active) return;
      const a = active;
      active = null;
      window.removeEventListener('resize', a.onMove);
      window.removeEventListener('scroll', a.onMove, true);
      document.removeEventListener('keydown', a.onKey, true);
      a.layer.classList.remove('on');
      setTimeout(() => { if (a.host.parentNode) a.host.parentNode.removeChild(a.host); }, 200);
      if (a.onFinish) a.onFinish(Boolean(completed));
    },

    start(opts) {
      Coach.stop(false);
      const steps = (opts.steps || []).filter(Boolean);
      if (!steps.length) return;

      const host = document.createElement('div');
      host.setAttribute('data-careeros-coach', '');
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${CSS}</style>
        <div class="layer" role="dialog" aria-modal="true" aria-live="polite">
          <div class="spot"></div>
          <div class="card">
            <div class="arrow"></div>
            <div class="top"><div class="dots"></div><span class="count"></span></div>
            <p class="title"></p>
            <p class="text"></p>
            <div class="actions">
              <button type="button" class="skip">Skip</button>
              <span class="grow"></span>
              <button type="button" class="back">Back</button>
              <button type="button" class="next">Next</button>
            </div>
          </div>
        </div>`;
      (document.body || document.documentElement).appendChild(host);

      const $ = (sel) => shadow.querySelector(sel);
      const a = {
        host, steps, index: 0, onFinish: opts.onFinish,
        layer: $('.layer'), spot: $('.spot'), card: $('.card'), arrow: $('.arrow'),
      };
      active = a;

      $('.dots').innerHTML = steps.map(() => '<span class="dot"></span>').join('');
      $('.skip').onclick = () => Coach.stop(false);
      $('.back').onclick = () => go(a.index - 1);
      $('.next').onclick = () => (a.index >= steps.length - 1 ? Coach.stop(true) : go(a.index + 1));

      let raf = 0;
      a.onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
      a.onKey = (e) => {
        if (!active) return;
        if (e.key === 'Escape') { e.stopPropagation(); Coach.stop(false); }
        else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); $('.next').click(); }
        else if (e.key === 'ArrowLeft' && a.index > 0) { e.preventDefault(); go(a.index - 1); }
      };
      window.addEventListener('resize', a.onMove);
      window.addEventListener('scroll', a.onMove, true);
      document.addEventListener('keydown', a.onKey, true);

      function go(i) {
        if (i < 0 || i >= steps.length) return;
        a.index = i;
        const step = steps[i];
        if (typeof step.before === 'function') step.before();
        $('.title').textContent = step.title || '';
        $('.text').textContent = step.text || '';
        $('.count').textContent = `${i + 1} of ${steps.length}`;
        $('.back').hidden = i === 0;
        $('.next').textContent = i === steps.length - 1 ? 'Got it' : 'Next';
        shadow.querySelectorAll('.dot').forEach((d, k) => {
          d.className = `dot${k === i ? ' on' : k < i ? ' done' : ''}`;
        });
        const el = resolveTarget(step.target);
        if (el && isShown(el)) {
          const r = el.getBoundingClientRect();
          if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
        a.card.classList.remove('pop');
        void a.card.offsetWidth; // restart the entrance animation
        a.card.classList.add('pop');
        // Give a step's before() a moment to switch tabs or render.
        setTimeout(place, step.before ? 60 : 0);
      }

      function place() {
        if (!active) return;
        const step = steps[a.index];
        const el = resolveTarget(step.target);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cw = a.card.offsetWidth;
        const ch = a.card.offsetHeight;
        const gap = 14;

        if (!el || !isShown(el)) {
          a.spot.classList.add('none');
          Object.assign(a.spot.style, { top: `${vh / 2}px`, left: `${vw / 2}px`, width: '0px', height: '0px' });
          Object.assign(a.card.style, { top: `${Math.max(12, (vh - ch) / 2)}px`, left: `${Math.max(12, (vw - cw) / 2)}px` });
          a.arrow.style.display = 'none';
          return;
        }

        const pad = step.padding != null ? step.padding : 6;
        const r = el.getBoundingClientRect();
        const s = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
        a.spot.classList.remove('none');
        a.spot.style.borderRadius = step.round ? '50%' : '12px';
        Object.assign(a.spot.style, { top: `${s.top}px`, left: `${s.left}px`, width: `${s.width}px`, height: `${s.height}px` });

        const room = {
          bottom: vh - (s.top + s.height),
          top: s.top,
          right: vw - (s.left + s.width),
          left: s.left,
        };
        const order = [step.placement, 'bottom', 'top', 'left', 'right'].filter(Boolean);
        const fits = (p) => (p === 'bottom' || p === 'top') ? room[p] >= ch + gap + 8 : room[p] >= cw + gap + 8;
        const side = order.find(fits) || (room.bottom >= room.top ? 'bottom' : 'top');

        let top;
        let left;
        if (side === 'bottom' || side === 'top') {
          top = side === 'bottom' ? s.top + s.height + gap : s.top - ch - gap;
          left = s.left + s.width / 2 - cw / 2;
        } else {
          left = side === 'right' ? s.left + s.width + gap : s.left - cw - gap;
          top = s.top + s.height / 2 - ch / 2;
        }
        left = Math.min(Math.max(12, left), vw - cw - 12);
        top = Math.min(Math.max(12, top), vh - ch - 12);
        Object.assign(a.card.style, { top: `${top}px`, left: `${left}px` });

        // Arrow points from the card at the spotlight's centre.
        const arrow = a.arrow.style;
        arrow.display = 'block';
        arrow.top = arrow.left = arrow.right = arrow.bottom = '';
        const cx = s.left + s.width / 2;
        const cy = s.top + s.height / 2;
        if (side === 'bottom') { arrow.top = '-6px'; arrow.left = `${Math.min(Math.max(16, cx - left - 7), cw - 30)}px`; }
        if (side === 'top') { arrow.bottom = '-6px'; arrow.left = `${Math.min(Math.max(16, cx - left - 7), cw - 30)}px`; }
        if (side === 'right') { arrow.left = '-6px'; arrow.top = `${Math.min(Math.max(16, cy - top - 7), ch - 30)}px`; }
        if (side === 'left') { arrow.right = '-6px'; arrow.top = `${Math.min(Math.max(16, cy - top - 7), ch - 30)}px`; }
      }

      go(0);
      requestAnimationFrame(() => a.layer.classList.add('on'));
    }
  };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Coach = Coach;
})(typeof self !== 'undefined' ? self : this);
