/* CareerOS — discovery
 *
 * Finds live postings through documented, public APIs. Nothing here scrapes a
 * job board's HTML, which is both the compliant route and the fast one: a board
 * API returns fifty structured postings in one request where scraping needs
 * fifty page loads.
 *
 * Two kinds of source:
 *   aggregators   Location and keyword search across the whole market.
 *                 Adzuna, JSearch and USAJobs all publish free-tier APIs.
 *   boards        Per-company ATS feeds. Exact, current, and they hand you the
 *                 direct apply URL, which is what the engine actually needs.
 */
(function (root) {
  'use strict';

  const Discovery = {
    /* Run every configured source and return a deduplicated, scored list. */
    async search(profile, settings, sources) {
      const jobs = [];
      const errors = [];

      const runs = [];
      if (sources.adzuna && sources.adzuna.appId) runs.push(adzuna(profile, settings, sources.adzuna));
      if (sources.jsearch && sources.jsearch.key) runs.push(jsearch(profile, settings, sources.jsearch));
      if (sources.usajobs && sources.usajobs.email) runs.push(usajobs(profile, settings, sources.usajobs));
      (sources.boards || []).forEach((b) => runs.push(board(b)));

      const settled = await Promise.allSettled(runs);
      settled.forEach((r) => {
        if (r.status === 'fulfilled') jobs.push(...r.value);
        else errors.push(r.reason.message);
      });

      return { jobs: dedupe(jobs), errors };
    },

    /* Follow an aggregator result through to the employer's own ATS, so the
       application happens where automation is allowed. */
    resolveApplyUrl(job) {
      const url = job.applyUrl || job.url || '';
      const ats = classifyUrl(url);
      return { url, ats, direct: ats !== 'generic' };
    },

    classifyUrl
  };

  /* ---------------- aggregators ---------------- */

  async function adzuna(profile, settings, cfg) {
    const country = (cfg.country || 'in').toLowerCase();
    const what = (profile.targeting.titles || []).slice(0, 3).join(' ') || profile.experience.currentTitle;
    const where = (profile.targeting.locations || [])[0] || profile.identity.city || '';

    const params = new URLSearchParams({
      app_id: cfg.appId,
      app_key: cfg.appKey,
      results_per_page: String(cfg.perPage || 50),
      what: what,
      max_days_old: String(cfg.maxDaysOld || 7),
      content_type: 'application/json'
    });
    if (where) params.set('where', where);

    // Adzuna's salary filter drops every posting that doesn't publish a range,
    // which in some markets is most of them. The matcher applies the floor
    // afterwards against what the description actually says.
    if (profile.targeting.minSalary && cfg.filterSalary) {
      params.set('salary_min', String(profile.targeting.minSalary));
    }
    if ((profile.targeting.workModes || []).includes('remote') && !where) {
      params.set('what_or', `${what} remote`);
    }

    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Adzuna rejected the credentials — check the App ID and App key are the right way round.');
    }
    if (!res.ok) throw new Error(`Adzuna returned ${res.status}`);
    const data = await res.json();

    return (data.results || []).map((j) => ({
      source: 'adzuna',
      externalId: `adzuna:${j.id}`,
      title: j.title,
      company: (j.company || {}).display_name || '',
      location: (j.location || {}).display_name || '',
      description: stripTags(j.description || ''),
      url: j.redirect_url,
      applyUrl: j.redirect_url,
      postedAt: Date.parse(j.created) || Date.now(),
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      remote: /remote/i.test(`${j.title} ${j.description}`)
    }));
  }

  async function jsearch(profile, settings, cfg) {
    const query = [
      (profile.targeting.titles || [])[0] || profile.experience.currentTitle,
      (profile.targeting.locations || [])[0] || profile.identity.city
    ].filter(Boolean).join(' in ');

    const params = new URLSearchParams({
      query,
      page: '1',
      num_pages: String(cfg.pages || 2),
      date_posted: cfg.datePosted || 'week'
    });
    if (cfg.country) params.set('country', String(cfg.country).toLowerCase());
    if ((profile.targeting.workModes || []).includes('remote')) params.set('remote_jobs_only', 'true');

    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'X-RapidAPI-Key': cfg.key,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('RapidAPI rejected the key — check it is subscribed to JSearch, not just created.');
    }
    if (res.status === 429) {
      throw new Error('RapidAPI quota is used up for this period. Reduce pages per search, or upgrade the plan.');
    }
    if (!res.ok) throw new Error(`JSearch returned ${res.status}`);
    const data = await res.json();

    return (data.data || []).map((j) => ({
      source: 'jsearch',
      externalId: `jsearch:${j.job_id}`,
      title: j.job_title,
      company: j.employer_name,
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
      description: j.job_description || '',
      url: j.job_apply_link,
      // JSearch tells you when a link goes straight to the employer's ATS.
      applyUrl: j.job_apply_link,
      direct: j.job_apply_is_direct === true,
      postedAt: (j.job_posted_at_timestamp || 0) * 1000 || Date.now(),
      salaryMin: j.job_min_salary,
      salaryMax: j.job_max_salary,
      remote: j.job_is_remote === true
    }));
  }

  async function usajobs(profile, settings, cfg) {
    const params = new URLSearchParams({
      Keyword: (profile.targeting.titles || [])[0] || '',
      LocationName: (profile.targeting.locations || [])[0] || profile.identity.city || '',
      ResultsPerPage: '50'
    });
    const res = await fetch(`https://data.usajobs.gov/api/search?${params}`, {
      headers: {
        Host: 'data.usajobs.gov',
        'User-Agent': cfg.email,
        'Authorization-Key': cfg.key || ''
      }
    });
    if (!res.ok) throw new Error(`USAJobs returned ${res.status}`);
    const data = await res.json();

    return ((data.SearchResult || {}).SearchResultItems || []).map((item) => {
      const d = item.MatchedObjectDescriptor || {};
      return {
        source: 'usajobs',
        externalId: `usajobs:${item.MatchedObjectId}`,
        title: d.PositionTitle,
        company: d.OrganizationName,
        location: (d.PositionLocationDisplay || ''),
        description: ((d.UserArea || {}).Details || {}).JobSummary || d.QualificationSummary || '',
        url: d.PositionURI,
        applyUrl: (d.ApplyURI || [])[0] || d.PositionURI,
        postedAt: Date.parse(d.PublicationStartDate) || Date.now()
      };
    });
  }

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
