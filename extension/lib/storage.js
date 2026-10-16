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
    RESUME: 'careeros.resume',
    SERVER_APPLIED: 'careeros.serverApplied',
    SERVER_PROFILE: 'careeros.serverProfile',     // the profile as the website last sent it (see lib/sync.js)
    SERVER_SETTINGS: 'careeros.serverSettings'    // the run settings as the website last sent them
  };

  /* The production Career OS deployment. A development build can still point Settings → API base elsewhere. */
  const PROD_WEB = 'https://careeros.silverspringstaffing.com';
  const PROD_API = PROD_WEB + '/api/extension';
  /* Values shipped by 2.4.0 and earlier that never pointed at a real server. */
  const STALE_HOST = /^https?:\/\/(localhost(:\d+)?|[^/]*\.careeros\.example)(\/|$)/i;

  const DEFAULT_SETTINGS = {
    autoSubmit: false,           // off by default: fill, then let the person press Submit
    reviewCountdown: 8,          // seconds shown before an auto-submit fires
    minMatchScore: 65,           // below this, CareerOS won't offer to apply
    dailyLimit: 25,              // applications per day (also capped by the plan's monthly limit from /sync)
    monthlyLimit: null,          // the plan's monthly cap, from /sync (null = no cap)
    appliedThisMonth: 0,         // submitted this month, from /sync
    pacingSeconds: 45,           // minimum gap between applications
    concurrency: 3,              // background tabs applying at once
    tailorCoverLetter: true,
    tailorScreeningAnswers: true,
    /* The Career OS app's API. Set this once per deployment — the pairing
       screen writes the token beside it. */
    apiBase: PROD_API,
    /* Where the sign-in/approval pages live. Same host as apiBase for Career
       OS's own Next.js deployment; kept separate in settings in case a
       self-hosted install ever splits them. */
    webAppUrl: PROD_WEB,
    deviceToken: '',
    pairedAs: '',
    pairedAt: null,
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

  /* Read-modify-write on one key, one at a time. Several tabs report results at once; without this two
     writers read the same old list and the second write silently undoes the first (a finished job flips
     back to queued and is applied to twice). */
  const locks = {};
  function update(key, fallback, fn) {
    const run = (locks[key] || Promise.resolve()).then(async () => {
      const next = await fn(await get(key, fallback));
      await set(key, next);
      return next;
    });
    locks[key] = run.catch(() => {});
    return run;
  }

  /* One form of a job URL (no tracking parameters, fragment or trailing slash): the same posting reached
     through different links counts as one job. Mirrors normalizeJobUrl on the server. */
  function normalizeUrl(raw) {
    try {
      const u = new URL(String(raw || '').trim());
      u.hash = '';
      u.hostname = u.hostname.toLowerCase();
      for (const key of Array.from(u.searchParams.keys())) {
        if (/^(utm_|gh_src$|source$|src$|ref$|referrer$|lever-source|lever-origin$|trk|refId$|trackingId$)/i.test(key)) u.searchParams.delete(key);
      }
      u.searchParams.sort();
      let out = u.toString();
      if (out.endsWith('/') && u.pathname !== '/') out = out.slice(0, -1);
      return out;
    } catch (err) {
      return String(raw || '').trim();
    }
  }

  const Storage = {
    KEYS,
    DEFAULT_SETTINGS,
    PROD_WEB,
    PROD_API,
    get,
    set,
    update,
    normalizeUrl,

    /* A new account (or none) must not inherit the previous account's copy of the website's data. */
    async forgetServerCopy() {
      await new Promise((resolve) => chrome.storage.local.remove([KEYS.SERVER_PROFILE, KEYS.SERVER_SETTINGS], resolve));
    },

    async getProfile() {
      return get(KEYS.PROFILE, null);
    },
    async saveProfile(profile) {
      profile.updatedAt = Date.now();
      return set(KEYS.PROFILE, profile);
    },

    async getSettings() {
      const stored = await get(KEYS.SETTINGS, {});
      const settings = Object.assign({}, DEFAULT_SETTINGS, stored);
      // Installs from 2.4.0 saved localhost / careeros.example, which never reach the real server.
      if (!settings.apiBase || STALE_HOST.test(settings.apiBase)) settings.apiBase = PROD_API;
      if (!settings.webAppUrl || STALE_HOST.test(settings.webAppUrl)) settings.webAppUrl = PROD_WEB;
      return settings;
    },
    async saveSettings(patch) {
      return update(KEYS.SETTINGS, {}, (stored) => Object.assign({}, stored, patch));
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
      const record = Object.assign(
        { id: crypto.randomUUID(), at: Date.now(), status: 'filled' },
        entry
      );
      await update(KEYS.APPLICATIONS, [], (list) => [record].concat(list).slice(0, 1000));
      return record;
    },
    async updateApplication(id, patch) {
      let found = null;
      await update(KEYS.APPLICATIONS, [], (list) =>
        list.map((a) => (a.id === id ? (found = Object.assign({}, a, patch)) : a))
      );
      return found;
    },
    /* Only real submissions count toward limits; filling a form (popup "Fill", or waiting for the person) does not. */
    async appliedToday() {
      const list = await Storage.getApplications();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return list.filter((a) => a.at >= start.getTime() && a.status === 'submitted').length;
    },
    async appliedThisMonth() {
      const list = await Storage.getApplications();
      const now = new Date();
      const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
      return list.filter((a) => a.at >= start && a.status === 'submitted').length;
    },
    /* Submitted from this browser, or from any device per the server (synced at the start of each run). */
    async alreadyApplied(url) {
      const key = normalizeUrl(url);
      const list = await Storage.getApplications();
      const local = list.find((a) => a.status === 'submitted' && (normalizeUrl(a.url) === key || (a.viaUrl && normalizeUrl(a.viaUrl) === key)));
      if (local) return local;
      const server = await get(KEYS.SERVER_APPLIED, []);
      return server.indexOf(key) !== -1 ? { url, status: 'submitted', source: 'server' } : null;
    },
    async saveServerApplied(urls) {
      return set(KEYS.SERVER_APPLIED, Array.from(new Set((urls || []).map(normalizeUrl))));
    },

    /* Answer bank: every screening question the person has answered once,
       reused verbatim the next time the same question shows up. */
    async getAnswers() {
      return get(KEYS.ANSWERS, {});
    },
    async rememberAnswer(question, answer, source) {
      const key = String(question).indexOf('eeo:') === 0 ? String(question) : normalizeQuestion(question);
      return update(KEYS.ANSWERS, {}, (bank) =>
        Object.assign({}, bank, { [key]: { answer, at: Date.now(), question, source: source || 'user' } })
      );
    },
    /* Answers saved on the server (from any device) join the local bank; local answers newer than the sync stay. */
    async mergeServerAnswers(answers) {
      return update(KEYS.ANSWERS, {}, (bank) => {
        const next = Object.assign({}, bank);
        for (const a of answers || []) {
          const key = a.key && a.key.indexOf('eeo:') === 0 ? a.key : normalizeQuestion(a.question);
          if (!next[key]) next[key] = { answer: a.answer, at: 0, question: a.question, source: a.source || 'user' };
        }
        return next;
      });
    },
    /* The saved answer for this question, or for a question worded almost the same way. */
    async recallAnswer(question) {
      const bank = await Storage.getAnswers();
      const key = normalizeQuestion(question);
      if (bank[key]) return bank[key].answer;
      let best = null;
      for (const k of Object.keys(bank)) {
        if (k.indexOf('eeo:') === 0) continue;
        const score = similarity(key, k);
        if (score >= 0.8 && (!best || score > best.score)) best = { score, answer: bank[k].answer };
      }
      return best ? best.answer : null;
    },
    normalizeQuestion
  };

  /* Word-overlap similarity of two normalised questions (0–1). */
  function similarity(a, b) {
    const wa = new Set(a.split(' ').filter((w) => w.length > 2));
    const wb = new Set(b.split(' ').filter((w) => w.length > 2));
    if (!wa.size || !wb.size) return 0;
    let both = 0;
    wa.forEach((w) => { if (wb.has(w)) both++; });
    return both / (wa.size + wb.size - both);
  }

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
