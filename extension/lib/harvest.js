/* CareerOS — harvest
 *
 * The aggregators don't publish a job-search API, so the only way their
 * postings reach the queue is off a results page. This runs when you're already
 * looking at your own search results, on your own session, and only when you
 * press the button: it reads the cards that are on screen and queues them.
 *
 * It doesn't paginate on its own, doesn't run in the background, and doesn't
 * fetch anything you weren't already looking at. Set your filters the way you
 * want them, scroll as far as you care to, then collect what's there.
 */
(function (root) {
  'use strict';

  const READERS = {
    linkedin: {
      test: () => /linkedin\.com\/jobs/.test(location.href),
      cards: () => document.querySelectorAll(
        '.jobs-search-results__list-item, .job-card-container, li[data-occludable-job-id]'
      ),
      read(card) {
        const link = card.querySelector('a.job-card-list__title, a.job-card-container__link, a[href*="/jobs/view/"]');
        if (!link) return null;
        const id = (link.getAttribute('href') || '').match(/\/jobs\/view\/(\d+)/);
        return {
          id: id ? `linkedin:${id[1]}` : null,
          title: text(link),
          company: text(card.querySelector('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle, [class*="subtitle"]')),
          location: text(card.querySelector('.job-card-container__metadata-item, [class*="metadata"]')),
          url: id ? `https://www.linkedin.com/jobs/view/${id[1]}/` : absolute(link.getAttribute('href')),
          easyApply: /easy apply/i.test(card.innerText || '')
        };
      }
    },

    indeed: {
      test: () => /indeed\.com\/(jobs|q-|m\/jobs)/.test(location.href),
      cards: () => document.querySelectorAll('.job_seen_beacon, [data-testid="slider_item"], .result'),
      read(card) {
        const link = card.querySelector('a.jcs-JobTitle, h2 a, a[data-jk]');
        if (!link) return null;
        const jk = link.getAttribute('data-jk')
          || (link.getAttribute('href') || '').match(/[?&]jk=([a-z0-9]+)/i);
        const key = typeof jk === 'string' ? jk : (jk && jk[1]);
        return {
          id: key ? `indeed:${key}` : null,
          title: text(card.querySelector('h2 span[title], h2')),
          company: text(card.querySelector('[data-testid="company-name"], .companyName')),
          location: text(card.querySelector('[data-testid="text-location"], .companyLocation')),
          url: key ? `https://www.indeed.com/viewjob?jk=${key}` : absolute(link.getAttribute('href')),
          easyApply: /easily apply/i.test(card.innerText || '')
        };
      }
    },

    ziprecruiter: {
      test: () => /ziprecruiter\.com\/(jobs|candidate|Jobs)/.test(location.href),
      cards: () => document.querySelectorAll('article.job_result, [data-testid="job-card"], .job_content'),
      read(card) {
        const link = card.querySelector('a.job_link, a[href*="/jobs/"], h2 a');
        if (!link) return null;
        return {
          id: `zip:${hash(link.getAttribute('href') || '')}`,
          title: text(link),
          company: text(card.querySelector('[data-testid="job-card-company"], .company_name, .hiring_company')),
          location: text(card.querySelector('[data-testid="job-card-location"], .location, .job_location')),
          url: absolute(link.getAttribute('href')),
          easyApply: /1-click|quick apply/i.test(card.innerText || '')
        };
      }
    },

    dice: {
      test: () => /dice\.com\/(jobs|job-detail)/.test(location.href),
      cards: () => document.querySelectorAll('dhi-search-card, [data-cy="search-card"], .search-card'),
      read(card) {
        const link = card.querySelector('a[data-cy="card-title-link"], a[href*="/job-detail/"], h5 a');
        if (!link) return null;
        return {
          id: `dice:${hash(link.getAttribute('href') || '')}`,
          title: text(link),
          company: text(card.querySelector('[data-cy="search-result-company-name"], a[href*="/company/"]')),
          location: text(card.querySelector('[data-cy="search-result-location"], .search-result-location')),
          url: absolute(link.getAttribute('href')),
          easyApply: /easy apply/i.test(card.innerText || '')
        };
      }
    },

    glassdoor: {
      test: () => /glassdoor\.[a-z.]+\/(Job|Search)/i.test(location.href),
      cards: () => document.querySelectorAll('li[data-test="jobListing"], .react-job-listing'),
      read(card) {
        const link = card.querySelector('a[data-test="job-link"], a.jobLink, a[href*="/job-listing/"]');
        if (!link) return null;
        return {
          id: `glassdoor:${hash(link.getAttribute('href') || '')}`,
          title: text(link),
          company: text(card.querySelector('[data-test="employer-short-name"], .employerName, [class*="employer"]')),
          location: text(card.querySelector('[data-test="emp-location"], [class*="location"]')),
          url: absolute(link.getAttribute('href')),
          easyApply: /easy apply/i.test(card.innerText || '')
        };
      }
    }
  };

  const Harvest = {
    /* Which reader, if any, matches this page. */
    reader() {
      return Object.keys(READERS).find((k) => READERS[k].test()) || null;
    },

    isSearchPage() {
      const key = Harvest.reader();
      if (!key) return false;
      return READERS[key].cards().length >= 3;
    },

    /* Read every card currently rendered. */
    collect() {
      const key = Harvest.reader();
      if (!key) return { ats: null, jobs: [] };

      const reader = READERS[key];
      const seen = new Set();
      const jobs = [];

      reader.cards().forEach((card) => {
        let job;
        try {
          job = reader.read(card);
        } catch (err) {
          return;
        }
        if (!job || !job.title || !job.url) return;
        const id = job.id || `${key}:${hash(job.url)}`;
        if (seen.has(id)) return;
        seen.add(id);

        jobs.push({
          id,
          title: job.title,
          company: job.company || '',
          location: job.location || '',
          url: job.url,
          ats: key,
          easyApply: Boolean(job.easyApply),
          description: '',
          postedAt: Date.now(),
          state: 'queued'
        });
      });

      return { ats: key, jobs };
    },

    READERS
  };

  function text(node) {
    if (!node) return '';
    return (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  }

  function absolute(href) {
    if (!href) return '';
    try {
      return new URL(href, location.origin).href;
    } catch (err) {
      return href;
    }
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Harvest = Harvest;
})(typeof self !== 'undefined' ? self : this);
