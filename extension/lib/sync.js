/* CareerOS — two-way sync with the Career OS website
 *
 * The profile and run settings live in two places: the website (Career Profile, Auto Apply page) and this
 * browser (the options page). Each sync keeps a copy of what the server last said. With that copy, a
 * field changed on the website (server differs from the copy) comes down, and a field changed here
 * (server still equals the copy) is kept and sent up. Without it, every sync would throw away what the
 * person just changed in the extension.
 */
(function (root) {
  'use strict';

  /* Settings the website also edits. The rest (daily limit, countdown, outlines…) belong to this browser. */
  const SYNCED_SETTINGS = ['minMatchScore', 'pacingSeconds', 'concurrency', 'autoSubmit', 'platformModes'];

  /* Profile fields that have a home in the Career Profile (see extensionProfileSchema on the server). The
     rest (roles, education, skills, self-identification, address…) are merged the same way but stay here. */
  const PUSHED_PROFILE = [
    'identity.firstName', 'identity.lastName', 'identity.phone', 'identity.city', 'identity.state',
    'identity.country', 'identity.linkedin', 'identity.github', 'identity.portfolio',
    'targeting.titles', 'targeting.locations', 'targeting.workModes', 'targeting.minSalary', 'targeting.salaryCurrency',
    'experience.currentTitle', 'experience.currentCompany', 'experience.totalYears', 'experience.noticePeriod',
    'workAuth.authorizedIn', 'workAuth.needsSponsorship', 'workAuth.willingToRelocate',
    'narrative.summary'
  ];

  function isObj(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }
  function isEmpty(v) {
    return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
  }
  function same(a, b) {
    return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
  }
  function read(obj, path) {
    return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);
  }
  function write(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((a, k) => (isObj(a[k]) ? a[k] : (a[k] = {})), obj)[last] = value;
  }

  /* Field by field (lists count as one field): local = this browser, server = now, base = server last time. */
  function mergeProfile(local, server, base) {
    const out = Object.assign({}, isObj(local) ? local : {});
    Object.keys(server || {}).forEach((k) => {
      const v = server[k];
      const l = out[k];
      const b = isObj(base) ? base[k] : undefined;
      const known = isObj(base) && k in base;

      if (isObj(v)) {
        out[k] = mergeProfile(isObj(l) ? l : {}, v, isObj(b) ? b : undefined);
        return;
      }
      if (k === 'voluntary' || /^(gender|race|veteran|disability)$/.test(k)) {
        // The server only sends "decline" defaults for self-identification; keep anything chosen here.
        out[k] = isEmpty(l) ? v : l;
        return;
      }
      if (known && same(v, b) && l !== undefined) return;        // unchanged on the website: keep this browser's value
      if (isEmpty(v) && !(known && !isEmpty(b))) {                 // empty, and not because the website cleared it
        if (l === undefined) out[k] = v;
        return;
      }
      out[k] = v;                                                  // changed on the website: it wins
    });
    return out;
  }

  /* The synced run settings: same rule, keyed flat. */
  function mergeSettings(local, server, base) {
    const out = {};
    SYNCED_SETTINGS.forEach((k) => {
      if (!(k in (server || {}))) return;
      const v = server[k];
      const keepLocal = isObj(base) && k in base && same(v, base[k]) && local && local[k] !== undefined;
      out[k] = keepLocal ? local[k] : (k === 'platformModes' ? (v || {}) : v);
    });
    return out;
  }

  /* What this browser has that the server doesn't yet, ready to send. Only once a sync has happened: the
     first sync after an install or update takes the website's profile rather than overwriting it. */
  function profileChanges(local, base) {
    if (!isObj(base)) return null;
    const patch = {};
    let any = false;
    PUSHED_PROFILE.forEach((path) => {
      const l = read(local, path);
      if (l === undefined || same(l, read(base, path))) return;
      write(patch, path, l);
      any = true;
    });
    return any ? patch : null;
  }

  function settingsChanges(local, base) {
    if (!isObj(base)) return null;
    const patch = {};
    let any = false;
    SYNCED_SETTINGS.forEach((k) => {
      if (local[k] === undefined || same(local[k], base[k])) return;
      patch[k] = local[k];
      any = true;
    });
    return any ? patch : null;
  }

  /* After a successful push the server holds these values: fold them into the copy. */
  function applyToBase(base, patch) {
    const out = JSON.parse(JSON.stringify(base || {}));
    (function walk(target, src) {
      Object.keys(src).forEach((k) => {
        if (isObj(src[k])) walk(isObj(target[k]) ? target[k] : (target[k] = {}), src[k]);
        else target[k] = src[k];
      });
    })(out, patch);
    return out;
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Sync = {
    SYNCED_SETTINGS, PUSHED_PROFILE,
    mergeProfile, mergeSettings, profileChanges, settingsChanges, applyToBase
  };
})(typeof self !== 'undefined' ? self : this);
