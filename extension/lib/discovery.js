/* CareerOS — discovery
 *
 * Finds postings from company ATS boards the person is specifically
 * watching. Nothing here scrapes a job board's HTML — this hits the same
 * public, documented board APIs the company's own careers page uses.
 *
 * Broader keyword/location search across the whole market (Adzuna, JSearch)
 * runs server-side against CareerOS's own account — see
 * CareerOS.Api.getJobs() in careeros-api.js — never with keys in the
 * browser, so there's nothing to configure here for that.
 */
(function (root) {
  'use strict';

  const Discovery = {
    /* Run every watched company board and return a deduplicated, scored list. */
    async search(profile, settings, sources) {
      const jobs = [];
      const errors = [];

      const runs = (sources.boards || []).map((b) => board(b));

      const settled = await Promise.allSettled(runs);
      settled.forEach((r) => {
        if (r.status === 'fulfilled') jobs.push(...r.value);
        else errors.push(r.reason.message);
      });

      return { jobs: dedupe(jobs), errors };
    },

    /* Follow a result through to the employer's own ATS, so the
       application happens where automation is allowed. */
    resolveApplyUrl(job) {
      const url = job.applyUrl || job.url || '';
      const ats = classifyUrl(url);
      return { url, ats, direct: ats !== 'generic' };
    },

    classifyUrl
  };

  /* ---------------- per-company ATS boards ---------------- */

  const BOARD_FETCHERS = {
    async greenhouse(token) {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
      if (!res.ok) throw new Error(`Greenhouse board "${token}" returned ${res.status}`);
      const data = await res.json();
      return (data.jobs || []).map((j) => ({
        source: 'greenhouse',
        externalId: `greenhouse:${j.id}`,
        title: j.title,
        company: token,
        location: (j.location || {}).name || '',
        description: stripTags(decodeEntities(j.content || '')),
        url: j.absolute_url,
        applyUrl: j.absolute_url,
        ats: 'greenhouse',
        postedAt: Date.parse(j.updated_at) || Date.now()
      }));
    },

    async lever(token) {
      const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`);
      if (!res.ok) throw new Error(`Lever board "${token}" returned ${res.status}`);
      const data = await res.json();
      return (data || []).map((j) => ({
        source: 'lever',
        externalId: `lever:${j.id}`,
        title: j.text,
        company: token,
        location: (j.categories || {}).location || '',
        description: stripTags(j.descriptionPlain || j.description || ''),
        url: j.hostedUrl,
        applyUrl: j.applyUrl || `${j.hostedUrl}/apply`,
        ats: 'lever',
        postedAt: j.createdAt || Date.now()
      }));
    },

    async ashby(token) {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`);
      if (!res.ok) throw new Error(`Ashby board "${token}" returned ${res.status}`);
      const data = await res.json();
      return (data.jobs || []).map((j) => ({
        source: 'ashby',
        externalId: `ashby:${j.id}`,
        title: j.title,
        company: token,
        location: j.location || '',
        description: stripTags(j.descriptionPlain || ''),
        url: j.jobUrl,
        applyUrl: j.applyUrl || j.jobUrl,
        ats: 'ashby',
        postedAt: Date.parse(j.publishedAt) || Date.now()
      }));
    },

    async workable(token) {
      const res = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${token}?details=true`);
      if (!res.ok) throw new Error(`Workable board "${token}" returned ${res.status}`);
      const data = await res.json();
      return (data.jobs || []).map((j) => ({
        source: 'workable',
        externalId: `workable:${j.shortcode}`,
        title: j.title,
        company: data.name || token,
        location: [j.city, j.country].filter(Boolean).join(', '),
        description: stripTags(j.description || ''),
        url: j.url,
        applyUrl: j.application_url || j.url,
        ats: 'workable',
        postedAt: Date.parse(j.published_on) || Date.now()
      }));
    },

    async smartrecruiters(token) {
      const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=100`);
      if (!res.ok) throw new Error(`SmartRecruiters board "${token}" returned ${res.status}`);
      const data = await res.json();
      return (data.content || []).map((j) => ({
        source: 'smartrecruiters',
        externalId: `smartrecruiters:${j.id}`,
        title: j.name,
        company: (j.company || {}).name || token,
        location: [(j.location || {}).city, (j.location || {}).country].filter(Boolean).join(', '),
        description: '',
        url: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
        applyUrl: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
        ats: 'smartrecruiters',
        postedAt: Date.parse(j.releasedDate) || Date.now()
      }));
    }
  };

  async function board(entry) {
    const fetcher = BOARD_FETCHERS[entry.ats];
    if (!fetcher) throw new Error(`No fetcher for ${entry.ats}`);
    return fetcher(entry.token);
  }

  Discovery.BOARD_FETCHERS = BOARD_FETCHERS;

  /* ---------------- helpers ---------------- */

  function classifyUrl(url) {
    const u = String(url || '');
    if (/greenhouse\.io/.test(u)) return 'greenhouse';
    if (/lever\.co/.test(u)) return 'lever';
    if (/ashbyhq\.com/.test(u)) return 'ashby';
    if (/workable\.com/.test(u)) return 'workable';
    if (/smartrecruiters\.com/.test(u)) return 'smartrecruiters';
    if (/myworkdayjobs\.com/.test(u)) return 'workday';
    if (/icims\.com/.test(u)) return 'icims';
    if (/jobvite\.com/.test(u)) return 'jobvite';
    if (/bamboohr\.com/.test(u)) return 'bamboohr';
    if (/applytojob\.com|jazz\.co/.test(u)) return 'jazz';
    if (/taleo\.net/.test(u)) return 'taleo';
    if (/linkedin\.com/.test(u)) return 'linkedin';
    if (/indeed\.com/.test(u)) return 'indeed';
    if (/ziprecruiter\.com/.test(u)) return 'ziprecruiter';
    if (/glassdoor\./.test(u)) return 'glassdoor';
    if (/dice\.com/.test(u)) return 'dice';
    if (/monster\./.test(u)) return 'monster';
    return 'generic';
  }

  function dedupe(jobs) {
    const seen = new Set();
    const out = [];
    jobs.forEach((j) => {
      const key = `${norm(j.title)}|${norm(j.company)}`;
      const urlKey = (j.applyUrl || j.url || '').split('?')[0];
      if (seen.has(key) || seen.has(urlKey)) return;
      seen.add(key);
      if (urlKey) seen.add(urlKey);
      if (!j.ats) j.ats = classifyUrl(j.applyUrl || j.url);
      out.push(j);
    });
    return out;
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function stripTags(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function decodeEntities(s) {
    return String(s || '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Discovery = Discovery;
})(typeof self !== 'undefined' ? self : this);
