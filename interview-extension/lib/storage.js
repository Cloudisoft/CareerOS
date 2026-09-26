/* CareerOS Interview Prep — storage layer
 *
 * This extension is fully independent of the Auto Apply extension in
 * `extension/` — no shared modules, no shared manifest, nothing loaded from
 * one into the other. This file happens to look similar to
 * extension/lib/storage.js because the same small team wrote both, not
 * because either imports the other. Keep it that way: if you're tempted to
 * `require`/import across the two extension folders, don't — they are
 * packaged, versioned, and Web-Store-listed separately.
 */
(function (root) {
  'use strict';

  const KEY = 'careerosInterviewPrep.settings';
  const LIVE_KEY = 'careerosInterviewPrep.liveCopilot';

  const DEFAULT_SETTINGS = {
    apiBase: 'https://careeros.silverspringstaffing.com/api/extension',
    webAppUrl: 'https://careeros.silverspringstaffing.com',
    deviceToken: '',
    pairedAs: '',
    pairedAt: null,
  };

  /* Live Copilot is opt-in and off by default. `consentVersion` records
   * which wording of the disclosure the person agreed to, so a materially
   * changed disclosure can re-prompt them (see LIVE_COPILOT_CONSENT_VERSION
   * in lib/live-copilot.js) even though they consented before. */
  const DEFAULT_LIVE_SETTINGS = {
    enabled: false,
    consentedVersion: 0,
    consentedAt: null,
    lastApplicationId: '',
    testPassedAt: null,
  };

  function get(key, fallback) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res[key] === undefined ? fallback : res[key]));
    });
  }

  function set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve(value));
    });
  }

  const Storage = {
    async getSettings() {
      const stored = await get(KEY, {});
      return Object.assign({}, DEFAULT_SETTINGS, stored);
    },
    async saveSettings(patch) {
      const current = await Storage.getSettings();
      return set(KEY, Object.assign(current, patch));
    },

    async getLiveCopilotSettings() {
      const stored = await get(LIVE_KEY, {});
      return Object.assign({}, DEFAULT_LIVE_SETTINGS, stored);
    },
    async saveLiveCopilotSettings(patch) {
      const current = await Storage.getLiveCopilotSettings();
      return set(LIVE_KEY, Object.assign(current, patch));
    },
  };

  root.CareerOSInterviewPrep = root.CareerOSInterviewPrep || {};
  root.CareerOSInterviewPrep.Storage = Storage;
})(typeof self !== 'undefined' ? self : this);
