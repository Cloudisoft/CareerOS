/* CareerOS — search URL builders
 *
 * One place that turns a profile + settings into an aggregator search URL,
 * so the string concatenation for "search this position/role elsewhere"
 * buttons (popup.js's idle state today, anywhere else later) doesn't get
 * scattered across files. Building a URL here never fetches, submits or
 * automates anything on the aggregator — it just opens a normal search tab
 * the person then browses like anyone else.
 */
(function (root) {
  'use strict';

  /* LinkedIn's own encoding for "date posted" (f_TPR). Not derivable from
     anything already in the profile, so it's the one setting this adds —
     Storage.DEFAULT_SETTINGS.searchDatePosted, picked in options.html. */
  const LINKEDIN_DATE_POSTED = {
    '24h': 'r86400',
    week: 'r604800',
    month: 'r2592000'
    // 'any' (or anything else) omits f_TPR entirely — LinkedIn's own default.
  };

  /* LinkedIn's work-type codes (f_WT). Derived from targeting.workModes
     rather than a new setting — someone who already said "remote, hybrid"
     shouldn't have to say it again for a search URL. */
  const LINKEDIN_WORK_TYPE = { onsite: '1', remote: '2', hybrid: '3' };

  /* LinkedIn's experience-level codes (f_E). Derived from targeting.seniority.
     Our own seniority scale (see options.html) is coarser than LinkedIn's six
     bands, so 'lead' rides along with 'senior' under "Mid-Senior level" (4) —
     the closest real LinkedIn band rather than a made-up one. */
  const LINKEDIN_EXPERIENCE = {
    intern: '1',
    junior: '2',
    mid: '3',
    senior: '4',
    lead: '4',
    director: '5'
  };

  /* Indeed's per-country domain prefixes (documented in Indeed's own
   * publisher docs). US has no prefix. Not exhaustive, but covers the
   * markets CareerOS's own targeting.locations/workAuth.authorizedIn
   * realistically point at. */
  const INDEED_COUNTRY_DOMAINS = {
    us: 'www.indeed.com',
    gb: 'uk.indeed.com',
    uk: 'uk.indeed.com',
    ca: 'ca.indeed.com',
    in: 'in.indeed.com',
    de: 'de.indeed.com',
    fr: 'fr.indeed.com',
    au: 'au.indeed.com',
    nz: 'nz.indeed.com',
    ie: 'ie.indeed.com',
    sg: 'sg.indeed.com',
    ae: 'ae.indeed.com',
    za: 'za.indeed.com',
    nl: 'nl.indeed.com',
    es: 'es.indeed.com',
    it: 'it.indeed.com',
    br: 'br.indeed.com',
    mx: 'mx.indeed.com',
    jp: 'jp.indeed.com',
    ph: 'ph.indeed.com',
    pk: 'pk.indeed.com',
    se: 'se.indeed.com',
    ch: 'ch.indeed.com',
    at: 'at.indeed.com',
    be: 'be.indeed.com',
    pl: 'pl.indeed.com'
  };

  const SearchUrls = {
    LINKEDIN_DATE_POSTED,
    LINKEDIN_WORK_TYPE,
    LINKEDIN_EXPERIENCE,
    INDEED_COUNTRY_DOMAINS,

    /* A full LinkedIn jobs-search URL: keywords/location/distance (already
       there before this), plus f_AL (Easy Apply only — the only kind
       CareerOS can actually finish for LinkedIn), f_TPR (date posted, from
       settings), f_WT (work type, from targeting.workModes) and f_E
       (experience level, from targeting.seniority). */
    linkedin(profile, settings, opts) {
      const targeting = (profile && profile.targeting) || {};
      const title = (opts && opts.title) || (targeting.titles || [])[0] || '';
      const place = (opts && opts.location) || (targeting.locations || [])[0] || '';
      const radius = targeting.radiusMiles;

      const params = new URLSearchParams();
      if (title) params.set('keywords', title);
      if (place) params.set('location', place);
      if (radius) params.set('distance', String(radius));

      params.set('f_AL', 'true');

      const datePosted = LINKEDIN_DATE_POSTED[(settings && settings.searchDatePosted) || ''];
      if (datePosted) params.set('f_TPR', datePosted);

      const workTypes = (targeting.workModes || [])
        .map((m) => LINKEDIN_WORK_TYPE[String(m).toLowerCase()])
        .filter(Boolean);
      if (workTypes.length) params.set('f_WT', Array.from(new Set(workTypes)).join(','));

      const experience = LINKEDIN_EXPERIENCE[String(targeting.seniority || '').toLowerCase()];
      if (experience) params.set('f_E', experience);

      return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    },

    /* Indeed's own docs (https://opensource.indeedeng.io/api-documentation/
       and the country-domain list they publish) put q/l on the country's own
       subdomain rather than a query param — searching "from wherever the
       person happens to be" otherwise silently returns results local to
       whatever indeed.* domain the browser was last on. countryCode defaults
       to targeting.country / identity.country when the caller doesn't pass
       one explicitly. */
    indeed(profile, settings, opts) {
      const identity = (profile && profile.identity) || {};
      const targeting = (profile && profile.targeting) || {};
      const title = (opts && opts.title) || (targeting.titles || [])[0] || '';
      const place = (opts && opts.location) || (targeting.locations || [])[0] || identity.city || '';
      const countryCode = String(
        (opts && opts.countryCode) || targeting.country || identity.country || 'us'
      ).toLowerCase().slice(0, 2);

      const domain = INDEED_COUNTRY_DOMAINS[countryCode] || INDEED_COUNTRY_DOMAINS.us;

      const params = new URLSearchParams();
      if (title) params.set('q', title);
      if (place) params.set('l', place);

      return `https://${domain}/jobs?${params.toString()}`;
    }
  };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.SearchUrls = SearchUrls;
})(typeof self !== 'undefined' ? self : this);
