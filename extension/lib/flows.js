/* CareerOS — platform flows
 *
 * The generic step loop handles employer ATS forms fine. The aggregators each
 * have their own shape and need to be driven on their own terms: LinkedIn is a
 * modal with a progress meter, Indeed hands off to a separate SPA, Dice puts
 * its apply button inside a shadow root.
 *
 * Every flow here drives the page the way a person would: find the visible
 * control, scroll to it, click it, wait for the page to actually respond.
 * Nothing spoofs an event as trusted, nothing touches fingerprinting, nothing
 * answers a captcha. When a flow hits something that needs a human, it says so
 * and stops.
 */
(function (root) {
  'use strict';

  /* Query through shadow roots. Dice's apply button lives in one, and more
     sites are moving this way every year. */
  function deepQuery(selector, node) {
    const scope = node || document;
    const direct = scope.querySelector(selector);
    if (direct) return direct;
    const walker = scope.querySelectorAll('*');
    for (const el of walker) {
      if (el.shadowRoot) {
        const hit = deepQuery(selector, el.shadowRoot);
        if (hit) return hit;
      }
    }
    return null;
  }

  function deepAll(selector, node) {
    const out = [];
    const scope = node || document;
    out.push(...scope.querySelectorAll(selector));
    scope.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) out.push(...deepAll(selector, el.shadowRoot));
    });
    return out;
  }

  function visible(node) {
    if (!node || !node.getClientRects || !node.getClientRects().length) return false;
    const s = getComputedStyle(node);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }

  function byText(phrases, scope) {
    const candidates = deepAll('button, a[role="button"], input[type="submit"], [role="button"]', scope)
      .filter(visible);
    for (const phrase of phrases) {
      const hit = candidates.find((el) => {
        const t = (el.getAttribute('aria-label') || el.value || el.innerText || el.textContent || '')
          .trim().toLowerCase();
        return t && t.length < 60 && t.includes(phrase);
      });
      if (hit) return hit;
    }
    return null;
  }

  async function press(el) {
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    await sleep(180 + Math.random() * 260);
    el.click();
    return true;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function waitFor(predicate, timeout) {
    const deadline = Date.now() + (timeout || 12000);
    while (Date.now() < deadline) {
      const value = predicate();
      if (value) return value;
      await sleep(300);
    }
    return null;
  }

  /* ================= LinkedIn Easy Apply ================= */

  const linkedin = {
    id: 'linkedin',

    /* Only Easy Apply can be completed in place. Anything else sends the
       candidate to the employer's own site, where CareerOS picks it up again. */
    async open() {
      const applyBtn = deepQuery('.jobs-apply-button, button[data-live-test-job-apply-button]')
        || byText(['easy apply']);
      if (!applyBtn) return { error: 'no_apply_button' };

      const label = (applyBtn.getAttribute('aria-label') || applyBtn.innerText || '').toLowerCase();
      if (!/easy apply/.test(label)) return { error: 'external_apply' };

      await press(applyBtn);
      const modal = await waitFor(() =>
        document.querySelector('.jobs-easy-apply-modal, [data-test-modal][role="dialog"]'), 10000);
      return modal ? { root: modal } : { error: 'modal_did_not_open' };
    },

    controls(modal) {
      const scope = modal || document;
      return {
        submit: scope.querySelector('button[aria-label*="Submit application"]')
             || byText(['submit application'], scope),
        review: scope.querySelector('button[aria-label*="Review your application"]')
             || byText(['review your application', 'review'], scope),
        next: scope.querySelector('button[aria-label*="Continue to next step"]')
             || byText(['continue to next step', 'next'], scope)
      };
    },

    /* LinkedIn shows a percentage meter; useful for knowing whether a press
       actually advanced anything. */
    progress(modal) {
      const meter = (modal || document).querySelector('.artdeco-completeness-meter-linear__progress-element, progress');
      if (!meter) return null;
      return meter.getAttribute('value') || meter.value || null;
    },

    /* An abandoned modal blocks the next job in the same tab. */
    async close() {
      const dismiss = document.querySelector('button[aria-label="Dismiss"], button[aria-label="Cancel"]');
      if (dismiss) {
        await press(dismiss);
        await sleep(600);
        const discard = byText(['discard', 'discard application']);
        if (discard) await press(discard);
      }
    },

    isDone() {
      const text = (document.body.innerText || '').slice(0, 4000);
      return /your application was sent|application sent|premium.*applicant|done applying/i.test(text);
    }
  };

  /* ================= Indeed ================= */

  const indeed = {
    id: 'indeed',

    async open() {
      // Already inside the apply SPA.
      if (/smartapply|\/applystart|indeedapply/i.test(location.href)) return { root: document.body };

      const btn = deepQuery('#indeedApplyButton, .ia-IndeedApplyButton, [id*="indeedApplyButton"]')
        || byText(['apply now', 'easily apply', 'apply on company site']);
      if (!btn) return { error: 'no_apply_button' };

      const label = (btn.innerText || btn.textContent || '').toLowerCase();
      if (/company site/.test(label)) return { error: 'external_apply' };

      await press(btn);
      const ready = await waitFor(() =>
        document.querySelector('.ia-BasePage-content, [data-testid="IndeedApplyForm"], form') ||
        /smartapply/i.test(location.href), 12000);
      return ready ? { root: document.body } : { error: 'form_did_not_open' };
    },

    controls(scope) {
      const s = scope || document;
      return {
        submit: byText(['submit your application', 'submit application'], s),
        review: byText(['review your application'], s),
        next: s.querySelector('.ia-continueButton') || byText(['continue', 'next'], s)
      };
    },

    progress() { return null; },
    async close() {},

    isDone() {
      return /your application has been submitted|application submitted|thanks for applying/i
        .test((document.body.innerText || '').slice(0, 4000));
    }
  };

  /* ================= ZipRecruiter ================= */

  const ziprecruiter = {
    id: 'ziprecruiter',

    async open() {
      const btn = deepQuery('button[aria-label*="1-Click Apply"], .job_apply, [data-testid="apply-button"]')
        || byText(['1-click apply', 'apply now', 'quick apply']);
      if (!btn) return { error: 'no_apply_button' };
      await press(btn);
      await sleep(1200);
      return { root: document.body };
    },

    controls(scope) {
      const s = scope || document;
      return {
        submit: byText(['submit application', 'apply now', 'send application'], s),
        review: null,
        next: byText(['continue', 'next'], s)
      };
    },

    progress() { return null; },
    async close() {},

    isDone() {
      return /application (sent|submitted)|you(?:'ve| have) applied|thanks for applying/i
        .test((document.body.innerText || '').slice(0, 4000));
    }
  };

  /* ================= Dice ================= */

  const dice = {
    id: 'dice',

    async open() {
      // Dice wraps its apply control in a web component with a shadow root.
      const host = document.querySelector('apply-button-wc');
      const btn = (host && host.shadowRoot && host.shadowRoot.querySelector('button'))
        || deepQuery('.btn-apply, [data-cy="easy-apply-button"]')
        || byText(['easy apply', 'apply now']);
      if (!btn) return { error: 'no_apply_button' };
      await press(btn);
      const ready = await waitFor(() => deepQuery('form, [class*="applyModal"], [class*="apply-flow"]'), 10000);
      return ready ? { root: document.body } : { error: 'form_did_not_open' };
    },

    controls(scope) {
      const s = scope || document;
      return {
        submit: byText(['submit', 'submit application'], s),
        review: null,
        next: byText(['next', 'continue'], s)
      };
    },

    progress() { return null; },
    async close() {},

    isDone() {
      return /application submitted|you have applied|thanks for applying/i
        .test((document.body.innerText || '').slice(0, 4000));
    }
  };

  /* ================= Glassdoor ================= */

  const glassdoor = {
    id: 'glassdoor',

    async open() {
      const btn = deepQuery('[data-test="applyButton"], .applyButton, button[data-test="easyApply"]')
        || byText(['easy apply', 'apply now']);
      if (!btn) return { error: 'no_apply_button' };

      const label = (btn.innerText || '').toLowerCase();
      // Most Glassdoor postings hand off to the employer, which is the better
      // route anyway.
      if (!/easy apply/.test(label)) return { error: 'external_apply' };

      await press(btn);
      const ready = await waitFor(() => document.querySelector('form, [class*="applyModal"]'), 10000);
      return ready ? { root: document.body } : { error: 'form_did_not_open' };
    },

    controls(scope) {
      const s = scope || document;
      return {
        submit: byText(['submit application', 'submit'], s),
        review: null,
        next: byText(['continue', 'next'], s)
      };
    },

    progress() { return null; },
    async close() {},

    isDone() {
      return /application submitted|thanks for applying|your application was sent/i
        .test((document.body.innerText || '').slice(0, 4000));
    }
  };

  const FLOWS = { linkedin, indeed, ziprecruiter, dice, glassdoor };

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Flows = {
    FLOWS,
    get(id) { return FLOWS[id] || null; },
    deepQuery,
    deepAll,
    byText,
    press,
    waitFor,
    visible
  };
})();
