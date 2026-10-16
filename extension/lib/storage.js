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
    SELECTOR_OVERRIDES: 'careeros.selectorOverrides' // cached { overrides, fetchedAt } from /extension/selectors
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
    autoHarvest: true,           // keep collecting cards from a search page without a click
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

  const Storage = {
    KEYS,
    DEFAULT_SETTINGS,
    get,
    set,

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
      return merged;
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
       reused verbatim the next time the same question shows up. Scoped by
       profile — "why this role" reads differently from a Frontend Engineer
       profile than a Product Manager one. Shape: { [profileId]: { [q]: {...} } }.
       getAnswers() with no id returns the whole bank, for the data export. */
    async getAnswers(profileId) {
      const bank = await getAnswerBank();
      return profileId ? (bank[profileId] || {}) : bank;
    },
    async rememberAnswer(question, answer, profileId) {
      const bank = await getAnswerBank();
      const id = profileId || (await getProfilesData()).activeId;
      bank[id] = bank[id] || {};
      bank[id][normalizeQuestion(question)] = { answer, at: Date.now() };
      return set(KEYS.ANSWERS, bank);
    },
    async recallAnswer(question, profileId) {
      const bank = await getAnswerBank();
      const id = profileId || (await getProfilesData()).activeId;
      const hit = (bank[id] || {})[normalizeQuestion(question)];
      return hit ? hit.answer : null;
    },

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
