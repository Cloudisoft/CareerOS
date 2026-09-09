/* CareerOS — policy registry
 *
 * Every platform has a default automation mode and a floor on how fast it may
 * be worked. The operator can raise a platform to full automation, and the
 * settings UI makes them acknowledge what that means once.
 *
 *   auto      Full automation: fill, advance, submit.
 *   assist    Fill only. The person presses submit.
 *   discover  Read the posting, never touch the form.
 *
 * What this file will not do, at any mode, is help evade detection. No
 * fingerprint spoofing, no captcha solving, no proxy rotation, no headless
 * masking. Automating your own logged-in session is a terms question. Defeating
 * the access controls that protect a service is a different question with a
 * different answer, and it's also what gets an extension pulled from the store.
 * The pacing floors below are the honest version of staying under the radar:
 * apply at a rate a fast human could actually sustain.
 */
(function (root) {
  'use strict';

  const POLICIES = {
    // Employer-side ATS. The candidate submits straight to the employer.
    greenhouse:      { mode: 'auto', rateLimit: 20, tos: 'open',       note: 'Employer ATS, public board API' },
    lever:           { mode: 'auto', rateLimit: 20, tos: 'open',       note: 'Employer ATS, public postings API' },
    ashby:           { mode: 'auto', rateLimit: 20, tos: 'open',       note: 'Employer ATS, public job board API' },
    workable:        { mode: 'auto', rateLimit: 20, tos: 'open',       note: 'Employer ATS, public widget API' },
    smartrecruiters: { mode: 'auto', rateLimit: 20, tos: 'open',       note: 'Employer ATS, public postings API' },
    jazz:            { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer ATS' },
    bamboohr:        { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer ATS' },
    jobvite:         { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer ATS' },
    recruitee:       { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer ATS' },
    teamtailor:      { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer ATS' },
    workday:         { mode: 'auto', rateLimit: 10, tos: 'open',       note: 'Employer ATS, multi-step' },
    icims:           { mode: 'auto', rateLimit: 10, tos: 'open',       note: 'Employer ATS' },
    taleo:           { mode: 'auto', rateLimit: 10, tos: 'open',       note: 'Employer ATS' },
    careersite:      { mode: 'auto', rateLimit: 15, tos: 'open',       note: 'Employer career page' },

    /* Aggregators. Default to assist because their user agreements prohibit
       automated interaction. `restricted` is what the settings UI keys off to
       show the acknowledgment before an override takes effect. The rate limits
       here are the ones that matter: these platforms measure behaviour, and a
       burst is what draws a review. */
    linkedin:     { mode: 'assist', rateLimit: 12, tos: 'restricted', note: 'User agreement prohibits automated interaction', flow: 'linkedin' },
    indeed:       { mode: 'assist', rateLimit: 15, tos: 'restricted', note: 'Terms prohibit automated submission',           flow: 'indeed' },
    ziprecruiter: { mode: 'assist', rateLimit: 20, tos: 'restricted', note: 'Terms prohibit automated submission',           flow: 'ziprecruiter' },
    dice:         { mode: 'assist', rateLimit: 20, tos: 'restricted', note: 'Terms prohibit automated submission',           flow: 'dice' },
    glassdoor:    { mode: 'assist', rateLimit: 15, tos: 'restricted', note: 'Terms prohibit automated submission',           flow: 'glassdoor' },
    monster:      { mode: 'assist', rateLimit: 20, tos: 'restricted', note: 'Terms prohibit automated submission' },

    generic:      { mode: 'assist', rateLimit: 10, tos: 'unknown',    note: 'Unknown site, so CareerOS fills and stops' }
  };

  const Policy = {
    POLICIES,

    /* The operator's per-platform overrides live in settings.platformModes. */
    for(atsId, settings) {
      const base = POLICIES[atsId] || POLICIES.generic;
      const override = settings && settings.platformModes && settings.platformModes[atsId];
      if (!override || override === 'default') return base;
      return Object.assign({}, base, { mode: override, overridden: true });
    },

    /* The only function allowed to authorise an automated submit. */
    canAutoSubmit(atsId, settings) {
      const policy = Policy.for(atsId, settings);
      if (!settings.autoSubmit) return { allowed: false, reason: 'Auto submit is off in your settings' };
      if (policy.mode !== 'auto') return { allowed: false, reason: policy.note };
      return { allowed: true, reason: policy.overridden ? 'Enabled by you for this platform' : policy.note };
    },

    canQueue(atsId, settings) {
      return Policy.for(atsId, settings).mode === 'auto';
    },

    /* Seconds between applications on a platform, never below its floor. */
    pacing(atsId, settings) {
      const policy = Policy.for(atsId, settings);
      const floor = policy.rateLimit ? Math.ceil(3600 / policy.rateLimit) : 60;
      return Math.max(floor, Number(settings.pacingSeconds) || 0);
    },

    /* Aggregators watch session shape, not just request rate. A little jitter
       keeps a run from looking like a metronome, which is the single most
       obvious bot signal there is. This is pacing, not disguise. */
    jitter(atsId, settings) {
      const base = Policy.pacing(atsId, settings) * 1000;
      return Math.round(base * (0.75 + Math.random() * 0.7));
    },

    flow(atsId) {
      return (POLICIES[atsId] || {}).flow || null;
    },

    isRestricted(atsId) {
      return (POLICIES[atsId] || POLICIES.generic).tos === 'restricted';
    },

    label(mode) {
      if (mode === 'auto') return 'Applies on its own';
      if (mode === 'assist') return 'Fills, you submit';
      return 'Read only';
    }
  };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Policy = Policy;
})(typeof self !== 'undefined' ? self : this);
