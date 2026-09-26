/* CareerOS Live Copilot — in-call overlay.
 *
 * Purely passive: this content script never starts capture itself (that
 * only happens from the extension's own popup, the required user gesture
 * for chrome.tabCapture). It just renders the hints/level/errors the
 * background relays once the person has explicitly started it, and offers
 * a Stop button so they don't have to reopen the popup mid-call.
 */
(function () {
  'use strict';

  let root = null;
  let hintEl = null;
  let statusEl = null;
  let visible = false;

  function ensureUI() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'careeros-live-copilot-root';
    root.innerHTML = `
      <div class="cos-lc-panel">
        <div class="cos-lc-header">
          <span class="cos-lc-dot"></span>
          <span>CareerOS Live Copilot</span>
          <button type="button" class="cos-lc-stop" title="Stop Live Copilot">Stop</button>
        </div>
        <div class="cos-lc-hint">Listening…</div>
        <div class="cos-lc-status"></div>
      </div>`;
    document.documentElement.appendChild(root);
    hintEl = root.querySelector('.cos-lc-hint');
    statusEl = root.querySelector('.cos-lc-status');
    root.querySelector('.cos-lc-stop').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'liveCopilot:stop' });
      hide();
    });
  }

  function show() {
    ensureUI();
    root.classList.add('cos-lc-visible');
    visible = true;
  }

  function hide() {
    if (root) root.classList.remove('cos-lc-visible');
    visible = false;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'liveCopilot:started' && msg.mode === 'live') {
      show();
      if (hintEl) hintEl.textContent = 'Listening for the next question…';
    }
    if (msg.type === 'liveCopilot:hint' && msg.hint && msg.hint.text) {
      ensureUI();
      show();
      hintEl.textContent = msg.hint.text;
      hintEl.classList.remove('cos-lc-fade');
      // eslint-disable-next-line no-void
      void hintEl.offsetWidth;
      hintEl.classList.add('cos-lc-fade');
    }
    if (msg.type === 'liveCopilot:error' && visible) {
      statusEl.textContent = msg.message;
    }
  });
})();
