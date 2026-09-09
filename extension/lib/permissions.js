/* CareerOS — permissions
 *
 * The extension asks for almost nothing at install. Job sites are optional
 * permissions, granted when the person turns that platform on.
 *
 * Two reasons this matters more than it looks:
 *
 * A default install prompt reading "read and change your data on linkedin.com,
 * indeed.com and 32 other sites" loses a large share of installs before the
 * person has seen the product, and it is the single thing a Web Store reviewer
 * scrutinises hardest on an auto-apply extension.
 *
 * The second reason is better: most people use three or four job sites. Asking
 * for thirty-four is asking for access we will never use on their machine.
 */
(function (root) {
  'use strict';

  /* Grouped so a person grants a set rather than answering thirty prompts.
     The groups match how people actually think about where they apply. */
  const GROUPS = {
    ats: {
      label: 'Employer application systems',
      description: 'Greenhouse, Lever, Ashby, Workday and the rest. This is where most applications are actually submitted.',
      origins: [
        'https://*.greenhouse.io/*',
        'https://boards-api.greenhouse.io/*',
        'https://*.lever.co/*',
        'https://api.lever.co/*',
        'https://*.ashbyhq.com/*',
        'https://api.ashbyhq.com/*',
        'https://*.myworkdayjobs.com/*',
        'https://*.workable.com/*',
        'https://apply.workable.com/*',
        'https://*.smartrecruiters.com/*',
        'https://api.smartrecruiters.com/*',
        'https://*.icims.com/*',
        'https://*.bamboohr.com/*',
        'https://*.jazz.co/*',
        'https://*.applytojob.com/*',
        'https://*.jobvite.com/*',
        'https://*.taleo.net/*',
        'https://*.recruitee.com/*',
        'https://*.teamtailor.com/*',
      ],
      recommended: true,
    },
    boards: {
      label: 'Job boards',
      description: 'LinkedIn, Indeed, ZipRecruiter, Dice, Glassdoor. CareerOS fills forms here but does not submit them.',
      origins: [
        'https://*.linkedin.com/*',
        'https://*.indeed.com/*',
        'https://smartapply.indeed.com/*',
        'https://*.ziprecruiter.com/*',
        'https://*.dice.com/*',
        'https://*.glassdoor.com/*',
        'https://*.glassdoor.co.in/*',
        'https://*.glassdoor.co.uk/*',
        'https://*.monster.com/*',
      ],
      recommended: false,
    },
    search: {
      label: 'Job search APIs',
      description: 'Only needed if you add your own Adzuna, JSearch or USAJobs keys to find roles automatically.',
      origins: [
        'https://api.adzuna.com/*',
        'https://jsearch.p.rapidapi.com/*',
        'https://data.usajobs.gov/*',
      ],
      recommended: false,
    },
  };

  const Permissions = {
    GROUPS,

    async has(groupKey) {
      const group = GROUPS[groupKey];
      if (!group) return false;
      return chrome.permissions.contains({ origins: group.origins });
    },

    /* Must be called from a user gesture — a click handler. Chrome silently
       refuses a permission request that did not come from one, and the failure
       looks like the user declining. */
    async request(groupKey) {
      const group = GROUPS[groupKey];
      if (!group) return false;
      const granted = await chrome.permissions.request({ origins: group.origins });
      if (granted) await Permissions.registerScripts();
      return granted;
    },

    async revoke(groupKey) {
      const group = GROUPS[groupKey];
      if (!group) return false;
      const removed = await chrome.permissions.remove({ origins: group.origins });
      if (removed) await Permissions.registerScripts();
      return removed;
    },

    async status() {
      const out = {};
      for (const key of Object.keys(GROUPS)) {
        out[key] = await Permissions.has(key);
      }
      return out;
    },

    /* Content scripts cannot be declared in the manifest for optional hosts, so
       they are registered at runtime against whatever the person has granted.
       Called on install, on startup, and after every grant or revoke. */
    async registerScripts() {
      const granted = await chrome.permissions.getAll();
      const origins = (granted.origins || []).filter(
        (o) => !o.includes('careeros.example') && !o.includes('localhost')
      );

      try {
        const existing = await chrome.scripting.getRegisteredContentScripts();
        if (existing.length) {
          await chrome.scripting.unregisterContentScripts({
            ids: existing.map((s) => s.id),
          });
        }
      } catch (err) {
        // Nothing registered yet on first run.
      }

      if (!origins.length) return { registered: 0 };

      await chrome.scripting.registerContentScripts([
        {
          id: 'careeros-agent',
          matches: origins,
          js: [
            'lib/storage.js',
            'lib/profile.js',
            'lib/ats.js',
            'lib/matcher.js',
            'lib/policy.js',
            'lib/careeros-api.js',
            'lib/flows.js',
            'lib/harvest.js',
            'lib/filler.js',
            'content/careeros.js',
          ],
          css: ['content/fields.css'],
          runAt: 'document_idle',
          allFrames: true,
          persistAcrossSessions: true,
        },
      ]);

      return { registered: origins.length };
    },
  };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Permissions = Permissions;
})(typeof self !== 'undefined' ? self : this);
