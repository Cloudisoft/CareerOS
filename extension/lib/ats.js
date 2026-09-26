/* CareerOS — ATS layer
 * Detects which applicant tracking system a page belongs to, pulls the posting
 * out of it, and describes where the apply form and submit button live.
 */
(function (root) {
  'use strict';

  const ADAPTERS = [
    {
      id: 'greenhouse',
      label: 'Greenhouse',
      match: (h, u) => /greenhouse\.io/.test(h) || /boards\.greenhouse/.test(u),
      form: '#application_form, form#application-form, form[action*="applications"]',
      submit: 'input[type="submit"], button[type="submit"], #submit_app',
      title: '.app-title, h1.section-header, h1',
      company: '.company-name, [class*="company"]',
      description: '#content, .job__description, [class*="job-description"]'
    },
    {
      id: 'lever',
      label: 'Lever',
      match: (h) => /lever\.co/.test(h),
      form: 'form.application-form, form[action*="apply"]',
      submit: 'button[type="submit"], .postings-btn[type="submit"]',
      title: '.posting-headline h2, h2',
      company: '.main-header-logo img[alt], .posting-categories',
      description: '.section-wrapper .section, [data-qa="job-description"]'
    },
    {
      id: 'ashby',
      label: 'Ashby',
      match: (h) => /ashbyhq\.com/.test(h),
      form: 'form',
      submit: 'button[type="submit"]',
      title: 'h1, [class*="jobTitle"]',
      company: '[class*="companyName"], header img[alt]',
      description: '[class*="jobDescription"], main'
    },
    {
      id: 'workday',
      label: 'Workday',
      match: (h) => /myworkdayjobs\.com|workday\.com/.test(h),
      form: 'form, [data-automation-id="jobApplication"]',
      submit: '[data-automation-id="bottom-navigation-next-button"], button[type="submit"]',
      title: '[data-automation-id="jobPostingHeader"], h1',
      company: '[data-automation-id="company"], header',
      description: '[data-automation-id="jobPostingDescription"]'
    },
    {
      id: 'workable',
      label: 'Workable',
      match: (h) => /workable\.com/.test(h),
      form: 'form[data-ui="application-form"], form',
      submit: 'button[type="submit"], [data-ui="submit-application"]',
      title: 'h1, [data-ui="job-title"]',
      company: '[data-ui="company-name"]',
      description: '[data-ui="job-description"], .job-description'
    },
    {
      id: 'smartrecruiters',
      label: 'SmartRecruiters',
      match: (h) => /smartrecruiters\.com/.test(h),
      form: 'form',
      submit: 'button[type="submit"], #submit-application',
      title: 'h1, .job-title',
      company: '.company-name',
      description: '.job-sections, [itemprop="description"]'
    },
    {
      id: 'icims',
      label: 'iCIMS',
      match: (h) => /icims\.com/.test(h),
      form: 'form',
      submit: 'input[type="submit"], button[type="submit"]',
      title: '.iCIMS_Header, h1',
      company: '.iCIMS_JobHeaderRow',
      description: '.iCIMS_JobContent, .iCIMS_InfoMsg'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn Easy Apply',
      match: (h) => /linkedin\.com/.test(h),
      form: '.jobs-easy-apply-modal form, form.jobs-easy-apply-form',
      submit: 'button[aria-label*="Submit application"], button[aria-label*="Review"], footer button[type="button"]',
      title: '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1',
      company: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name',
      description: '.jobs-description__content, #job-details',
      multiStep: true
    },
    {
      id: 'indeed',
      label: 'Indeed',
      match: (h) => /indeed\.com/.test(h),
      form: 'form, .ia-BasePage-content form',
      submit: 'button[type="submit"], .ia-continueButton',
      title: '.jobsearch-JobInfoHeader-title, h1',
      company: '[data-company-name], .jobsearch-InlineCompanyRating div',
      description: '#jobDescriptionText',
      multiStep: true
    },
    {
      /* Oracle Taleo — an older platform, still common at large enterprises.
       * Taleo Enterprise Edition (careersection.*) and Business Edition
       * (tbe.taleo.net) render fairly plain server-rendered forms rather than
       * a SPA, but both put the form fields under an iframe/panel with
       * `id`s prefixed by the requisition flow rather than stable class
       * names. The selectors below follow Taleo's documented DOM patterns
       * (form#req_wizard / .taleo-* classes on TBE, requisitionDescription*
       * ids on TEE) but have NOT been verified against a live posting — no
       * Taleo instance was reachable to test against in this environment.
       * Verify against a real posting before relying on this in production;
       * until then the generic adapter below is the actual fallback if any
       * of these miss. */
      id: 'taleo',
      label: 'Taleo',
      match: (h) => /taleo\.net/.test(h),
      form: 'form#req_wizard, form[name="reqDataForm"], .taleo-form, form',
      submit: 'input[name="submit"], input[type="submit"], button[type="submit"], .taleo-button-primary, #save_button',
      title: '.taleo-requisition-title, #requisitionDescriptionInterface\\.reqTitleLabel, h1, h2.title',
      company: '.taleo-company-name, [class*="company"]',
      description: '#requisitionDescriptionInterface\\.reqDescription, .taleo-job-description, [class*="description"], #content'
    },
    {
      id: 'ziprecruiter',
      label: 'ZipRecruiter',
      match: (h) => /ziprecruiter\.com/.test(h),
      form: 'form',
      submit: 'button[type="submit"]',
      title: 'h1',
      company: '[class*="company"]',
      description: '[class*="jobDescription"], .job_description'
    },
    {
      id: 'generic',
      label: 'this site',
      match: () => true,
      form: 'form',
      submit: 'button[type="submit"], input[type="submit"]',
      title: 'h1',
      company: '[class*="company"]',
      description: 'main, article, body'
    }
  ];

  /* Field patterns: ordered, first match wins. Each maps a normalized label to
     a path in the profile, or a resolver that computes the value. */
  const FIELD_PATTERNS = [
    { key: 'firstName',  re: /\b(first|given|fore)\s*name\b|^fname$/,                     path: 'identity.firstName' },
    { key: 'lastName',   re: /\b(last|family|sur)\s*name\b|^lname$/,                      path: 'identity.lastName' },
    { key: 'fullName',   re: /\b(full\s*name|your name|candidate name)\b|^name$/,         resolve: (p, P) => P.fullName(p) },
    { key: 'preferred',  re: /\bpreferred (first )?name\b|\bnickname\b/,                  path: 'identity.preferredName' },
    { key: 'email',      re: /\b(e-?mail)\b/,                                             path: 'identity.email' },
    { key: 'phone',      re: /\b(phone|mobile|cell|telephone|contact number)\b/,          path: 'identity.phone' },
    { key: 'linkedin',   re: /\blinked\s?in\b/,                                           path: 'identity.linkedin' },
    { key: 'github',     re: /\bgit\s?hub\b/,                                             path: 'identity.github' },
    { key: 'portfolio',  re: /\b(portfolio|website|personal site|web ?site|url)\b/,       path: 'identity.portfolio' },
    { key: 'address',    re: /\b(street|address ?(line)? ?1|mailing address)\b/,          path: 'identity.addressLine1' },
    { key: 'city',       re: /\b(city|town|current city)\b/,                              path: 'identity.city' },
    { key: 'state',      re: /\b(state|province|region)\b/,                               path: 'identity.state' },
    { key: 'postal',     re: /\b(zip|postal|pin ?code)\b/,                                path: 'identity.postalCode' },
    // Deliberately not a bare \bcountry\b: "are you authorized to work in
    // this country" and "willing to relocate to another country" both
    // contain that word too, and would otherwise shadow the workAuth/
    // sponsorship/relocate patterns below since classify() takes the first
    // match. Anchoring to the phrasing an address/identity field actually
    // uses avoids that collision.
    { key: 'country',    re: /\bcountry\s*(of (residence|citizenship))?\s*\??$|^country$|\bcurrent country\b|\bcountry\/region\b/, path: 'identity.country' },
    { key: 'location',   re: /\b(location|where are you based|current location)\b/,       resolve: (p, P) => P.locationLine(p) },

    { key: 'currentTitle',   re: /\b(current|present|most recent)\s*(job )?title\b|\bcurrent role\b/, path: 'experience.currentTitle' },
    { key: 'currentCompany', re: /\b(current|present|most recent)\s*(employer|company)\b/,           path: 'experience.currentCompany' },
    { key: 'years',          re: /\b(years|yrs)\b.*\bexperience\b|\bexperience\b.*\b(years|yrs)\b/,  resolve: (p) => String(p.experience.totalYears || '') },
    { key: 'notice',         re: /\bnotice period\b|\bhow soon can you (start|join)\b/,              path: 'experience.noticePeriod' },
    { key: 'availableFrom',  re: /\b(available|start date|earliest start)\b/,                        path: 'narrative.availableFrom' },
    { key: 'salary',         re: /\b(salary|compensation|expected pay|rate)\b/,                      resolve: (p) => p.targeting.minSalary ? String(p.targeting.minSalary) : '' },
    { key: 'skills',         re: /\b(skills|technolog|tech stack|proficienc)\w*\b/,                  resolve: (p, P) => P.allSkills(p).join(', ') },
    { key: 'summary',        re: /\b(summary|about you|tell us about|profile|bio)\b/,                path: 'narrative.summary' },
    { key: 'coverLetter',    re: /\b(cover letter|why (do you want|are you interested)|motivation)\b/, generated: 'coverLetter' },
    { key: 'whyCompany',     re: /\bwhy (this )?(company|us|role|position)\b/,                       generated: 'whyCompany' },

    // \w*\b (same fix as 'relocate' below) rather than a bare trailing \b:
    // without it this only ever matched the literal token "authoriz"/
    // "authoris", never "authorized"/"authorised" — the word every real
    // "are you authorized to work" question actually uses.
    { key: 'workAuth',    re: /\b(authoriz|authoris|eligible to work|legally (able|entitled) to work|right to work)\w*\b/, resolve: (p) => p.workAuth.needsSponsorship ? 'No' : 'Yes' },
    { key: 'sponsorship', re: /\b(sponsor|visa (support|sponsorship)|h-?1b)\b/,                      resolve: (p) => p.workAuth.needsSponsorship ? 'Yes' : 'No' },
    { key: 'relocate',    re: /\b(relocat|willing to move)\w*\b/,                                    resolve: (p) => p.workAuth.willingToRelocate ? 'Yes' : 'No' },
    { key: 'remote',      re: /\b(remote|hybrid|on-?site|work from)\b/,                              resolve: (p) => (p.targeting.workModes || [])[0] || '' },

    { key: 'gender',     re: /\bgender\b/,                    path: 'voluntary.gender' },
    { key: 'race',       re: /\b(race|ethnic)\w*\b/,          path: 'voluntary.race' },
    { key: 'veteran',    re: /\bveteran\b/,                   path: 'voluntary.veteran' },
    { key: 'disability', re: /\bdisabilit\w*\b/,              path: 'voluntary.disability' },

    { key: 'school',     re: /\b(school|university|college|institution)\b/, resolve: (p) => (p.education[0] || {}).school || '' },
    { key: 'degree',     re: /\bdegree\b/,                                 resolve: (p) => (p.education[0] || {}).degree || '' },
    { key: 'fieldOfStudy', re: /\b(field of study|major|discipline)\b/,     resolve: (p) => (p.education[0] || {}).field || '' },
    { key: 'gradYear',   re: /\b(graduation|grad year|year of passing)\b/,  resolve: (p) => String((p.education[0] || {}).year || '') },

    { key: 'resume',     re: /\b(resume|cv|upload your resume)\b/,          file: 'resume' },
    { key: 'source',     re: /\bhow did you (hear|find)\b|\bsource\b/,      resolve: () => 'Company website' }
  ];

  /* Remote overrides, patched in from the CareerOS backend (see
     Api.getSelectorOverrides / Storage.getCachedSelectorOverrides and
     careeros.js's refreshSelectorOverrides()). Shape matches an adapter's own
     selector fields: { [atsId]: { form?, submit?, title?, company?, description? } }.
     A DOM change on some ATS can then be patched from the backend without a
     store release — this module always still works from ADAPTERS alone if
     nothing has ever been fetched, or the fetch fails. */
  let overridesByAdapter = {};

  const OVERRIDABLE_KEYS = ['form', 'submit', 'title', 'company', 'description'];

  function withOverrides(adapter) {
    const patch = overridesByAdapter[adapter.id];
    if (!patch) return adapter;
    const merged = Object.assign({}, adapter);
    OVERRIDABLE_KEYS.forEach((k) => {
      if (patch[k]) merged[k] = patch[k];
    });
    return merged;
  }

  const ATS = {
    ADAPTERS,
    FIELD_PATTERNS,

    /* Replaces the whole override set (this is what a fetch returns — not a
       merge of merges, so a selector removed on the backend actually goes
       away here too). Safe to call with null/undefined to clear it. */
    applyOverrides(overrides) {
      overridesByAdapter = (overrides && typeof overrides === 'object') ? overrides : {};
    },

    detect(loc) {
      const l = loc || (typeof location !== 'undefined' ? location : { hostname: '', href: '' });
      const adapter = ADAPTERS.find((a) => a.match(l.hostname || '', l.href || '')) || ADAPTERS[ADAPTERS.length - 1];
      return withOverrides(adapter);
    },

    /* Pull the posting off the page so the matcher has something to score. */
    readPosting(adapter, doc) {
      const d = doc || document;
      const text = (sel) => {
        if (!sel) return '';
        for (const s of sel.split(',')) {
          const el = d.querySelector(s.trim());
          if (el) {
            const v = (el.getAttribute && el.getAttribute('alt')) || el.innerText || el.textContent || '';
            if (v.trim()) return v.trim().replace(/\s+/g, ' ');
          }
        }
        return '';
      };
      const description = text(adapter.description).slice(0, 12000);
      return {
        ats: adapter.id,
        atsLabel: adapter.label,
        title: text(adapter.title),
        company: text(adapter.company),
        description,
        url: d.location ? d.location.href : '',
        capturedAt: Date.now()
      };
    },

    findForm(adapter, doc) {
      const d = doc || document;
      for (const s of (adapter.form || 'form').split(',')) {
        const el = d.querySelector(s.trim());
        if (el) return el;
      }
      return d.querySelector('form');
    },

    findSubmit(adapter, scope) {
      const root = scope || document;
      for (const s of (adapter.submit || '').split(',')) {
        if (!s.trim()) continue;
        const el = root.querySelector(s.trim());
        if (el && !el.disabled) return el;
      }
      return null;
    }
  };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.ATS = ATS;
})(typeof self !== 'undefined' ? self : this);
