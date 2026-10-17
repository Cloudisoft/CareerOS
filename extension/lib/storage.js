/* CareerOS — storage layer
 * One namespace, used identically by popup, options, content scripts and the worker.
 */
(function (root) {
  'use strict';

  const KEYS = {
    PROFILE: 'careeros.profile',      // legacy single-profile slot, kept only for migration
    PROFILES: 'careeros.profiles',    // { activeId, profiles: { [id]: profile } }
    SETTINGS: 'careeros.settings',
    APPLICATIONS: 'careeros.applications',
    ANSWERS: 'careeros.answerBank',
    RESUME: 'careeros.resume',
    SELECTOR_OVERRIDES: 'careeros.selectorOverrides', // cached { overrides, fetchedAt } from /extension/selectors
    SERVER_APPLIED: 'careeros.serverApplied'          // job URLs submitted from any browser, per the last sync
  };

  const PROD_WEB = 'https://careeros.silverspringstaffing.com';
  const PROD_API = PROD_WEB + '/api/extension';
  /* Values shipped by early builds that never pointed at a real server. */
  const STALE_HOST = /^https?:\/\/(localhost(:\d+)?|[^/]*\.careeros\.example)(\/|$)/i;

  const DEFAULT_SETTINGS = {
    autoSubmit: true,            // submit by itself once every answer is in (job boards like LinkedIn stay fill-only)
    reviewCountdown: 8,          // seconds shown before an auto-submit fires
    minMatchScore: 65,           // below this, CareerOS won't offer to apply
    dailyLimit: 200,             // applications per day, per account (the plan's monthly cap still applies)
    pacingSeconds: 45,           // minimum gap between applications
    concurrency: 3,              // background tabs applying at once
    tailorCoverLetter: true,
    tailorScreeningAnswers: true,
    autoHarvest: true,           // keep collecting cards from a search page without a click
    searchJobBoards: true,       // a run also searches LinkedIn and Indeed (needs the Job boards permission)
    harvestMaxScrolls: 40,       // stop auto-scrolling a search page after this many loads
    harvestMaxJobsPerVisit: 400, // stop collecting once a single page-visit has found this many
    /* LinkedIn's f_TPR window for the "Search this position" URL builder
       (see lib/search-urls.js). '24h' | 'week' | 'month' | 'any'. This is the
       one search preference that can't be derived from the profile. */
    searchDatePosted: 'week',
    fastLinkedIn: false,         // opt-in: raise LinkedIn's rate limit and drop its 1-tab cap.
                                  // Real account risk tradeoff, so it stays off until the person
                                  // turns it on for themselves — see lib/policy.js.
    showApplyTabs: true,         // on: opens a small, unfocused window per apply so the person can
                                  // actually watch a form get filled — the visible proof that a run
                                  // is doing something matters more than the small speed cost,
                                  // especially for someone checking whether Auto Apply works at all.
                                  // Off switches to fully hidden background tabs for unattended runs.
    /* The Career OS app's API. Set this once per deployment — the pairing
       screen writes the token beside it. */
    apiBase: 'https://careeros.silverspringstaffing.com/api/extension',
    /* Where the sign-in/approval pages live. Same host as apiBase for Career
       OS's own Next.js deployment; kept separate in settings in case a
       self-hosted install ever splits them. */
    webAppUrl: 'https://careeros.silverspringstaffing.com',
    deviceToken: '',
    pairedAs: '',
    pairedAt: null,
    apiToken: '',
    allowDirectKey: false,   // developer only: call the model provider from the browser
    highlightFields: true,   // outline filled fields and ones still needing you
    panelTutorialSeenAt: null, // when the docked panel's first-run tour was dismissed/completed; null = show it once
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
     writers read the same old list and the second write silently undoes the first. */
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

    /* ---------------- profiles ----------------
     * Storage holds many profiles now ({ activeId, profiles }), but almost every
     * call site only ever wants "the current one" — getProfile/saveProfile stay
     * as thin wrappers over the active profile so none of them had to change. */
    async getProfiles() {
      return getProfilesData();
    },
    async getActiveProfile() {
      const data = await getProfilesData();
      return data.profiles[data.activeId] || null;
    },
    async getProfile() {
      return Storage.getActiveProfile();
    },
    async saveProfileById(id, profile) {
      const data = await getProfilesData();
      profile.id = id;
      profile.updatedAt = Date.now();
      data.profiles[id] = profile;
      await set(KEYS.PROFILES, data);
      return profile;
    },
    async saveProfile(profile) {
      const data = await getProfilesData();
      const id = profile.id || data.activeId || 'default';
      return Storage.saveProfileById(id, profile);
    },
    async createProfile(name) {
      const data = await getProfilesData();
      const id = newProfileId();
      const blank = (root.CareerOS.Profile ? root.CareerOS.Profile.blank() : {});
      const profile = Object.assign(blank, { id, name: name || 'New profile', updatedAt: Date.now() });
      data.profiles[id] = profile;
      await set(KEYS.PROFILES, data);
      return profile;
    },
    async duplicateProfile(id, newName) {
      const data = await getProfilesData();
      const src = data.profiles[id];
      if (!src) return null;
      const newId = newProfileId();
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = newId;
      copy.name = newName || `${src.name || 'Profile'} copy`;
      copy.updatedAt = Date.now();
      data.profiles[newId] = copy;
      await set(KEYS.PROFILES, data);
      return copy;
    },
    async deleteProfile(id) {
      const data = await getProfilesData();
      const ids = Object.keys(data.profiles);
      if (ids.length <= 1) return { ok: false, error: 'Cannot delete the last remaining profile' };
      if (!data.profiles[id]) return { ok: false, error: 'No such profile' };
      delete data.profiles[id];
      if (data.activeId === id) data.activeId = Object.keys(data.profiles)[0];
      await set(KEYS.PROFILES, data);
      return { ok: true, activeId: data.activeId };
    },
    async setActiveProfile(id) {
      const data = await getProfilesData();
      if (!data.profiles[id]) return null;
      data.activeId = id;
      await set(KEYS.PROFILES, data);
      return id;
    },

    async getSettings() {
      const stored = await get(KEYS.SETTINGS, {});
      const merged = Object.assign({}, DEFAULT_SETTINGS, stored);
      // No UI control ever sets these two, so a stored value only ever got
      // there from saveSettings() baking in whatever DEFAULT_SETTINGS said
      // at install time — meaning a raise to the shipped default here would
      // never reach an existing install otherwise. Always take the current
      // default instead of the frozen-in one.
      merged.harvestMaxScrolls = DEFAULT_SETTINGS.harvestMaxScrolls;
      merged.harvestMaxJobsPerVisit = DEFAULT_SETTINGS.harvestMaxJobsPerVisit;
      // Early installs saved localhost / careeros.example, which never reach the real server.
      if (!merged.apiBase || STALE_HOST.test(merged.apiBase)) merged.apiBase = PROD_API;
      if (!merged.webAppUrl || STALE_HOST.test(merged.webAppUrl)) merged.webAppUrl = PROD_WEB;
      // The old shipped default of 25 a day becomes the account allowance of 200.
      if (stored.dailyLimit === 25 && !stored.dailyLimitChosen) merged.dailyLimit = DEFAULT_SETTINGS.dailyLimit;
      return merged;
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
      if (record.status === 'submitted' && !record.submittedAt) record.submittedAt = record.at;
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
    /* Only real submissions count toward limits; filling a form (Fill, or waiting for the person) does not. */
    async appliedToday() {
      const list = await Storage.getApplications();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return list.filter((a) => (a.submittedAt || a.at) >= start.getTime() && a.status === 'submitted').length;
    },
    /* This browser's record of a job (filled or submitted), however the URL was reached. */
    async findApplication(url) {
      const key = normalizeUrl(url);
      const list = await Storage.getApplications();
      return list.find((a) => normalizeUrl(a.url) === key || (a.viaUrl && normalizeUrl(a.viaUrl) === key)) || null;
    },
    /* Submitted from this browser, or from any browser per the server (synced before each run). */
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
       reused verbatim the next time the same question shows up. Scoped by
       profile — "why this role" reads differently from a Frontend Engineer
       profile than a Product Manager one. Shape: { [profileId]: { [q]: {...} } }.
       getAnswers() with no id returns the whole bank, for the data export. */
    async getAnswers(profileId) {
      const bank = await getAnswerBank();
      return profileId ? (bank[profileId] || {}) : bank;
    },
    async rememberAnswer(question, answer, profileId) {
      const id = profileId || (await getProfilesData()).activeId;
      return updateBank((bank) => {
        bank[id] = bank[id] || {};
        bank[id][answerKey(question)] = { answer, at: Date.now(), question: String(question) };
        return bank;
      });
    },
    /* The saved answer for this question, or one worded almost the same way: first this profile's own,
       then answers saved to the CareerOS account from any browser. */
    async recallAnswer(question, profileId) {
      const bank = await getAnswerBank();
      const id = profileId || (await getProfilesData()).activeId;
      return findAnswer(bank[id], question) || findAnswer(bank[SHARED], question);
    },
    /* Every saved answer that could answer this question, best first: this profile's, then the account's.
       A choice question accepts a looser wording match (0.7), because the answer must also be one of its
       options; a written answer needs 0.75 (so "Why work at Northwind?" never answers "Why work at Acme?"). */
    async recallCandidates(question, profileId, opts) {
      const bank = await getAnswerBank();
      const id = profileId || (await getProfilesData()).activeId;
      const floor = opts && opts.choice ? 0.7 : 0.75;
      const key = normalizeQuestion(question);
      const out = [];
      [bank[id], bank[SHARED]].forEach((entries) => {
        Object.keys(entries || {}).forEach((k) => {
          if (k.indexOf('eeo:') === 0) return;
          const score = k === key ? 1 : questionSimilarity(key, k);
          if (score >= floor) out.push({ score, answer: entries[k].answer });
        });
      });
      out.sort((a, b) => b.score - a.score);
      return Array.from(new Set(out.map((c) => c.answer)));
    },
    /* A self-identification answer by meaning ("eeo:veteran" -> "No"), whatever the form's wording. */
    async recallKey(key, profileId) {
      const bank = await getAnswerBank();
      const id = profileId || (await getProfilesData()).activeId;
      const hit = (bank[id] || {})[key] || (bank[SHARED] || {})[key];
      return hit ? hit.answer : null;
    },
    /* Answers saved on the server join the account-wide part of the bank. A profile's own answers still win. */
    async mergeServerAnswers(answers) {
      if (!answers || !answers.length) return null;
      return updateBank((bank) => {
        const shared = Object.assign({}, bank[SHARED]);
        for (const a of answers) {
          if (!a || !a.answer) continue;
          const key = a.key && a.key.indexOf('eeo:') === 0 ? a.key : answerKey(a.question);
          if (!shared[key] || (shared[key].at || 0) === 0) shared[key] = { answer: a.answer, at: 0, question: a.question };
        }
        bank[SHARED] = shared;
        return bank;
      });
    },
    normalizeQuestion,
    questionSimilarity,

    /* ---------------- remote selector overrides ---------------- */
    async getCachedSelectorOverrides() {
      return get(KEYS.SELECTOR_OVERRIDES, null); // { overrides, fetchedAt } or null
    },
    async saveCachedSelectorOverrides(overrides) {
      return set(KEYS.SELECTOR_OVERRIDES, { overrides: overrides || {}, fetchedAt: Date.now() });
    }
  };

  function newProfileId() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* Migrates the old single-profile slot into the multi-profile shape once,
     the first time it's read, and never touches it again after that. A fresh
     install with no legacy profile gets one blank "Default" profile so there
     is always something to score against and edit. */
  async function getProfilesData() {
    const existing = await get(KEYS.PROFILES, null);
    if (existing && existing.profiles && Object.keys(existing.profiles).length) return existing;

    const legacy = await get(KEYS.PROFILE, null);
    const id = (legacy && legacy.id) || 'default';
    const blank = (root.CareerOS.Profile ? root.CareerOS.Profile.blank() : {});
    const profile = Object.assign({}, blank, legacy || {}, {
      id,
      name: (legacy && legacy.name) || 'Default'
    });
    const data = { activeId: id, profiles: { [id]: profile } };
    await set(KEYS.PROFILES, data);
    return data;
  }

  /* The answer bank used to be a flat { [question]: {answer, at} } map. The
     first read after this version installs rewraps it under whichever profile
     is active, so nobody's saved answers vanish. */
  /* Answers from the CareerOS account (any browser), kept beside the per-profile banks. */
  const SHARED = '_account';

  function answerKey(question) {
    return String(question).indexOf('eeo:') === 0 ? String(question) : normalizeQuestion(question);
  }

  function findAnswer(entries, question) {
    if (!entries) return null;
    const key = normalizeQuestion(question);
    if (entries[key]) return entries[key].answer;
    let best = null;
    for (const k of Object.keys(entries)) {
      if (k.indexOf('eeo:') === 0) continue;
      const score = questionSimilarity(key, k);
      if (score >= 0.75 && (!best || score > best.score)) best = { score, answer: entries[k].answer };
    }
    return best ? best.answer : null;
  }

  /* How alike two normalised questions are (0–1), by their meaningful words with synonyms folded together
     ("How big a team have you led?" ~ "What size of team have you managed?"). */
  const STOPWORDS = new Set('a an the of to in on at for with by from about as and or if is are was were be been being do does did have has had you your yours we our us this that these those it its any some what which who whom how when where why will would can could should may might must please currently first ever there their them they i me my am applying apply role position job company'.split(' '));
  const SYNONYM_GROUPS = [
    ['size', 'big', 'large', 'many', 'number', 'count'],
    ['hear', 'find', 'learn', 'discover', 'see', 'come'],
    ['led', 'lead', 'leading', 'manage', 'managed', 'managing', 'supervise', 'supervised'],
    ['years', 'year', 'yrs'],
    ['experience', 'experienced'],
    ['salary', 'compensation', 'pay'],
    ['expected', 'expectation', 'expectations', 'desired'],
    ['start', 'join', 'begin'],
    ['relocate', 'relocation', 'move'],
    ['require', 'need', 'needs', 'required'],
    ['sponsorship', 'sponsor', 'visa'],
    ['authorized', 'authorised', 'eligible', 'permitted', 'legally']
  ];
  const SYNONYM_OF = new Map();
  SYNONYM_GROUPS.forEach((g) => g.forEach((w) => SYNONYM_OF.set(w, g[0])));
  function questionWords(q) {
    return new Set(String(q).split(' ').filter((w) => w.length > 1 && !STOPWORDS.has(w))
      .map((w) => SYNONYM_OF.get(w) || w.replace(/(ing|ed|es|s)$/, '')));
  }
  function questionSimilarity(a, b) {
    const wa = questionWords(a);
    const wb = questionWords(b);
    if (!wa.size || !wb.size) return 0;
    let both = 0;
    wa.forEach((w) => { if (wb.has(w)) both++; });
    return both / (wa.size + wb.size - both);
  }

  /* One write at a time: several tabs learning answers at once must not undo each other. */
  let bankLock = Promise.resolve();
  function updateBank(fn) {
    const run = bankLock.then(async () => set(KEYS.ANSWERS, await fn(await getAnswerBank())));
    bankLock = run.catch(() => {});
    return run;
  }

  async function getAnswerBank() {
    const raw = await get(KEYS.ANSWERS, {});
    const keys = Object.keys(raw);
    const looksFlat = keys.length && raw[keys[0]] && typeof raw[keys[0]] === 'object' && 'answer' in raw[keys[0]];
    if (!looksFlat) return raw;

    const activeId = (await getProfilesData()).activeId;
    const migrated = { [activeId]: raw };
    await set(KEYS.ANSWERS, migrated);
    return migrated;
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
