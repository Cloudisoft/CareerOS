/* CareerOS — storage layer
 * One namespace, used identically by popup, options, content scripts and the worker.
 */
(function (root) {
  'use strict';

  const KEYS = {
    PROFILE: 'careeros.profile',
    SETTINGS: 'careeros.settings',
    APPLICATIONS: 'careeros.applications',
    ANSWERS: 'careeros.answerBank',
    RESUME: 'careeros.resume'
  };

  const DEFAULT_SETTINGS = {
    autoSubmit: false,           // off by default: fill, then let the person press Submit
    reviewCountdown: 8,          // seconds shown before an auto-submit fires
    minMatchScore: 65,           // below this, CareerOS won't offer to apply
    dailyLimit: 25,              // applications per day
    pacingSeconds: 45,           // minimum gap between applications
    concurrency: 3,              // background tabs applying at once
    tailorCoverLetter: true,
    tailorScreeningAnswers: true,
    /* The Career OS app's API. Set this once per deployment — the pairing
       screen writes the token beside it. */
    apiBase: 'http://localhost:3000/api/extension',
    /* Where the sign-in/approval pages live. Same host as apiBase for Career
       OS's own Next.js deployment; kept separate in settings in case a
       self-hosted install ever splits them. */
    webAppUrl: 'http://localhost:3000',
    deviceToken: '',
    pairedAs: '',
    pairedAt: null,
    apiToken: '',
    allowDirectKey: false,   // developer only: call the model provider from the browser
    highlightFields: true,   // outline filled fields and ones still needing you
    /* Per-platform overrides. 'default' keeps the policy in lib/policy.js;
       'auto' turns on full automation for that platform. */
    platformModes: {},
    acknowledgedRestricted: false
  };

  function get(key, fallback) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => {
        resolve(res[key] === undefined ? fallback : res[key]);
      });
    });
  }

  function set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve(value));
    });
  }

  const Storage = {
    KEYS,
    DEFAULT_SETTINGS,
    get,
    set,

    async getProfile() {
      return get(KEYS.PROFILE, null);
    },
    async saveProfile(profile) {
      profile.updatedAt = Date.now();
      return set(KEYS.PROFILE, profile);
    },

    async getSettings() {
      const stored = await get(KEYS.SETTINGS, {});
      return Object.assign({}, DEFAULT_SETTINGS, stored);
    },
    async saveSettings(patch) {
      const current = await Storage.getSettings();
      return set(KEYS.SETTINGS, Object.assign(current, patch));
    },

    async getResume() {
      return get(KEYS.RESUME, null); // { name, mime, dataUrl, text }
    },
    async saveResume(resume) {
      return set(KEYS.RESUME, resume);
    },

    async getApplications() {
      return get(KEYS.APPLICATIONS, []);
    },
    async logApplication(entry) {
      const list = await Storage.getApplications();
      const record = Object.assign(
        { id: crypto.randomUUID(), at: Date.now(), status: 'filled' },
        entry
      );
      list.unshift(record);
      await set(KEYS.APPLICATIONS, list.slice(0, 1000));
      return record;
    },
    async updateApplication(id, patch) {
      const list = await Storage.getApplications();
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      list[idx] = Object.assign(list[idx], patch);
      await set(KEYS.APPLICATIONS, list);
      return list[idx];
    },
    async appliedToday() {
      const list = await Storage.getApplications();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return list.filter((a) => a.at >= start.getTime()).length;
    },
    async alreadyApplied(url) {
      const list = await Storage.getApplications();
      const key = (url || '').split('?')[0];
      return list.find((a) => (a.url || '').split('?')[0] === key) || null;
    },

    /* Answer bank: every screening question the person has answered once,
       reused verbatim the next time the same question shows up. */
    async getAnswers() {
      return get(KEYS.ANSWERS, {});
    },
    async rememberAnswer(question, answer) {
      const bank = await Storage.getAnswers();
      bank[normalizeQuestion(question)] = { answer, at: Date.now() };
      return set(KEYS.ANSWERS, bank);
    },
    async recallAnswer(question) {
      const bank = await Storage.getAnswers();
      const hit = bank[normalizeQuestion(question)];
      return hit ? hit.answer : null;
    }
  };

  function normalizeQuestion(q) {
    return String(q || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Storage = Storage;
})(typeof self !== 'undefined' ? self : this);
