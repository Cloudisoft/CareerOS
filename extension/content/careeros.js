/* CareerOS — page agent (headless)
 *
 * Nothing is drawn on the host page. The only visible trace is an outline on
 * fields that were filled and on required fields that still need the person.
 * Everything else is driven from the popup and the run dashboard.
 *
 * Two modes on the same code path:
 *   driven   The popup or the engine asks it to read, fill or submit.
 *   auto     The engine opened this tab: fill, advance, submit, report back.
 */
(function () {
  'use strict';

  if (window.__careerosLoaded) return;
  window.__careerosLoaded = true;
  if (window.top !== window.self && document.body && document.body.innerText.length < 200) return;

  const { Storage, Profile, ATS, Matcher, Filler, Policy, Flows, Harvest } = window.CareerOS;

  const state = {
    adapter: null,
    posting: null,
    match: null,
    profile: null,
    settings: null,
    resume: null,
    policy: null,
    ready: false,
    busy: false,
    report: null
  };

  init();

  async function init() {
    state.settings = await Storage.getSettings();
    state.profile = Profile.hydrate(await Storage.getProfile());
    state.resume = await Storage.getResume();
    state.adapter = ATS.detect(location);
    state.policy = Policy.for(state.adapter.id, state.settings);
    state.ready = Profile.isReady(state.profile);
    Filler.setHighlight(state.settings.highlightFields);

    if (!state.ready) return;

    // Ask the worker whether this tab belongs to a run.
    const directive = await send({ type: 'careeros:ready' });
    if (directive && directive.job) {
      runAutomated(directive);
      return;
    }

    scan();
    watchForChanges();
  }

  /* ================= reading the page ================= */

  function scan() {
    const posting = ATS.readPosting(state.adapter, document);
    if (!posting.title || posting.description.length < 200) return;
    if (state.posting && state.posting.title === posting.title && state.posting.url === posting.url) return;

    state.posting = posting;
    state.match = Matcher.score(state.profile, posting);
    state.report = null;
  }

  function watchForChanges() {
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(scan, 800);
    }).observe(document.body, { childList: true, subtree: true });

    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        state.posting = null;
        state.report = null;
        setTimeout(scan, 1200);
      }
    }, 1000);
  }

  /* What the popup renders itself from. */
  function snapshot() {
    const harvest = Harvest.isSearchPage() ? Harvest.collect() : null;
    const permission = Policy.canAutoSubmit(state.adapter.id, state.settings);

    return {
      ok: true,
      ready: state.ready,
      kind: harvest ? 'search' : (state.posting ? 'posting' : 'none'),
      ats: state.adapter.id,
      atsLabel: state.adapter.label,
      policy: state.policy,
      policyLabel: Policy.label(state.policy.mode),
      canSubmit: permission.allowed,
      submitNote: permission.reason,
      posting: state.posting,
      match: state.match,
      report: state.report && summarize(state.report),
      harvest: harvest ? { ats: harvest.ats, count: harvest.jobs.length, easy: harvest.jobs.filter((j) => j.easyApply).length } : null,
      busy: state.busy
    };
  }

  function summarize(report) {
    const needsYou = report.skipped.filter((s) => s.required);
    return {
      total: report.total,
      filled: report.filled.length + report.generated.length,
      generated: report.generated.length,
      needsYou: needsYou.map((n) => n.label).slice(0, 6),
      needsYouCount: needsYou.length
    };
  }

  /* ================= driven by the popup ================= */

  async function doFill() {
    if (state.busy) return { ok: false, error: 'Already filling' };

    const cap = await Storage.appliedToday();
    if (cap >= state.settings.dailyLimit) {
      return { ok: false, error: `Daily cap of ${state.settings.dailyLimit} reached` };
    }

    state.busy = true;
    try {
      const prior = await Storage.alreadyApplied(location.href);
      const form = ATS.findForm(state.adapter, document) || document.body;
      const report = await Filler.fillForm(form, state.profile, buildContext(null));
      state.report = report;

      if (!prior) {
        await Storage.logApplication({
          url: location.href,
          title: (state.posting && state.posting.title) || document.title,
          company: state.posting && state.posting.company,
          ats: state.adapter.id,
          score: state.match ? state.match.score : null,
          filled: report.filled.length + report.generated.length,
          status: 'filled'
        });
      }

      return { ok: true, report: summarize(report), priorApplication: prior ? prior.at : null };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      state.busy = false;
    }
  }

  async function doSubmit() {
    const permission = Policy.canAutoSubmit(state.adapter.id, state.settings);
    if (!permission.allowed) return { ok: false, error: permission.reason };

    const form = ATS.findForm(state.adapter, document) || document;
    const button = ATS.findSubmit(state.adapter, form)
      || Flows.byText(['submit application', 'submit', 'send application']);
    if (!button) return { ok: false, error: 'No submit button on this step' };

    await Flows.press(button);
    const confirmed = await Flows.waitFor(() => isConfirmation(), 8000);

    if (confirmed) {
      const applied = await Storage.alreadyApplied(location.href);
      if (applied) await Storage.updateApplication(applied.id, { status: 'submitted', submittedAt: Date.now() });
    }
    return { ok: true, confirmed: Boolean(confirmed) };
  }

  /* ================= automated run ================= */

  async function runAutomated(directive) {
    try {
      const flowId = Policy.flow(state.adapter.id);
      if (flowId) return report(await runFlow(Flows.get(flowId), directive));

      const gate = await waitForForm();
      if (gate.blocked) return report({ outcome: 'failed', detail: gate.blocked });

      state.posting = ATS.readPosting(state.adapter, document);
      if (!state.posting.title) state.posting.title = directive.job.title;
      if (!state.posting.company) state.posting.company = directive.job.company;

      return report(await stepThrough(directive.directive));
    } catch (err) {
      return report({ outcome: 'failed', detail: err.message });
    }
  }

  /* Aggregator flows: open the apply surface, then work it step by step. */
  async function runFlow(flow, directive) {
    if (!flow) return { outcome: 'failed', detail: 'no flow for this platform' };

    // Score from the page, since a harvested card has no description.
    state.posting = ATS.readPosting(state.adapter, document);
    if (state.posting.description.length > 200) {
      const match = Matcher.score(state.profile, state.posting);
      if (match.blocked) return { outcome: 'skipped', detail: match.blockers[0] };
      if (match.score < state.settings.minMatchScore) {
        return { outcome: 'skipped', detail: `scored ${match.score} once the description loaded` };
      }
      state.match = match;
    }

    const opened = await flow.open();
    if (opened.error === 'external_apply') {
      return { outcome: 'skipped', detail: 'applies on the employer site — queue that instead' };
    }
    if (opened.error) return { outcome: 'failed', detail: opened.error };

    const scope = opened.root || document;
    const context = buildContext(directive.directive.pregenerated, directive.directive);
    let filledTotal = 0;

    for (let step = 0; step < directive.directive.maxSteps; step++) {
      const blocked = detectBlocker();
      if (blocked) { await flow.close(); return { outcome: 'failed', detail: blocked }; }
      if (flow.isDone()) return { outcome: 'submitted', detail: `${filledTotal} fields over ${step} step${step === 1 ? '' : 's'}` };

      const before = { sig: formSignature(scope), progress: flow.progress(scope) };
      const filled = await Filler.fillForm(scope, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;

      const unanswered = filled.skipped.filter((f) => f.required);
      if (unanswered.length) {
        await flow.close();
        return { outcome: 'skipped', detail: `needs you: ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` };
      }

      if (!directive.directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.directive.policyNote}` };
      }

      const c = flow.controls(scope);
      const button = c.submit || c.review || c.next;
      if (!button) {
        await flow.close();
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found nothing to press' }
          : { outcome: 'failed', detail: 'no control on this step' };
      }

      if (!await Flows.press(button)) {
        await flow.close();
        return { outcome: 'skipped', detail: 'the next button was disabled, so something is unanswered' };
      }

      const moved = await Flows.waitFor(() => {
        if (flow.isDone()) return 'done';
        if (flow.progress(scope) !== before.progress) return 'progress';
        if (formSignature(scope) !== before.sig) return 'changed';
        return null;
      }, 14000);

      if (flow.isDone()) {
        return { outcome: 'submitted', detail: `${filledTotal} fields over ${step + 1} step${step ? 's' : ''}` };
      }
      if (!moved) {
        const errors = readFormErrors();
        await flow.close();
        return { outcome: errors ? 'skipped' : 'failed', detail: errors || 'the form did not move' };
      }
    }

    await flow.close();
    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  /* Some flows show the posting first and the form only after a button. */
  async function waitForForm() {
    const deadline = Date.now() + 25000;
    let pressedApply = false;

    while (Date.now() < deadline) {
      const blocked = detectBlocker();
      if (blocked) return { blocked };

      const form = ATS.findForm(state.adapter, document);
      if (form && hasAnswerableFields(form)) return { form };

      if (!pressedApply) {
        const applyBtn = Flows.byText(['apply for this job', 'apply now', 'apply to this job', "i'm interested", 'apply']);
        if (applyBtn) {
          await Flows.press(applyBtn);
          pressedApply = true;
          await sleep(1500);
          continue;
        }
      }
      await sleep(500);
    }
    return { blocked: 'no_form' };
  }

  /* Generic multi-step ATS form. */
  async function stepThrough(directive) {
    const context = buildContext(directive.pregenerated, directive);
    let filledTotal = 0;

    for (let step = 0; step < directive.maxSteps; step++) {
      const blocked = detectBlocker();
      if (blocked) return { outcome: 'failed', detail: blocked };
      if (isConfirmation()) {
        return { outcome: 'submitted', detail: `confirmed after ${step} step${step === 1 ? '' : 's'}` };
      }

      const form = ATS.findForm(state.adapter, document) || document.body;
      const before = formSignature(form);

      const filled = await Filler.fillForm(form, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;

      const unanswered = filled.skipped.filter((s) => s.required);
      if (unanswered.length) {
        return { outcome: 'skipped', detail: `needs you: ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` };
      }

      if (!directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.policyNote}` };
      }

      const button = ATS.findSubmit(state.adapter, form)
        || ATS.findSubmit(state.adapter, document)
        || Flows.byText(['submit application', 'submit', 'send application', 'next', 'continue', 'save and continue', 'review']);

      if (!await Flows.press(button)) {
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found no submit or next button' }
          : { outcome: 'failed', detail: 'nothing to fill and nothing to press' };
      }

      const changed = await waitForChange(before);
      if (isConfirmation()) {
        return { outcome: 'submitted', detail: `${filledTotal} fields over ${step + 1} step${step ? 's' : ''}` };
      }
      if (!changed) {
        const errors = readFormErrors();
        return { outcome: errors ? 'skipped' : 'failed', detail: errors || 'the form did not move after submit' };
      }
    }
    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  function report(result) {
    return send({ type: 'careeros:result', result });
  }

  /* ================= page signals ================= */

  function detectBlocker() {
    if (document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .h-captcha, .g-recaptcha, [class*="cf-turnstile"]')) {
      return 'captcha';
    }
    const pw = document.querySelector('input[type="password"]');
    if (pw && Flows.visible(pw)) return 'needs_login';
    const text = bodyText();
    if (/sign in to (continue|apply)|log ?in to apply|please sign in/i.test(text)) return 'needs_login';
    if (/no longer accepting applications|this (job|position) (is|has) (closed|expired|been filled)/i.test(text)) return 'closed';
    return null;
  }

  function isConfirmation() {
    return /thank you for (applying|your application)|application (was |has been )?(received|submitted|sent)|we(?:'ve| have) received your application|successfully applied|your application is (in|complete)/i
      .test(bodyText());
  }

  function readFormErrors() {
    const nodes = Array.from(document.querySelectorAll(
      '[role="alert"], .error, .field-error, [class*="errorMessage"], [aria-invalid="true"]'
    )).filter(Flows.visible);
    if (!nodes.length) return null;
    const msgs = nodes
      .map((n) => (n.getAttribute('aria-label') || n.textContent || '').trim())
      .filter((t) => t && t.length < 160);
    return msgs.length ? `form rejected it: ${msgs.slice(0, 2).join('; ')}` : null;
  }

  function hasAnswerableFields(form) {
    return form.querySelectorAll('input:not([type="hidden"]), select, textarea').length >= 2;
  }

  function formSignature(scope) {
    const fields = Array.from(scope.querySelectorAll('input, select, textarea'))
      .map((f) => f.name || f.id || f.type).join('|');
    return `${location.href}::${fields.length}::${fields.slice(0, 400)}`;
  }

  async function waitForChange(before) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      await sleep(400);
      if (isConfirmation()) return true;
      const current = ATS.findForm(state.adapter, document);
      if (!current) return true;
      if (formSignature(current) !== before) return true;
    }
    return false;
  }

  function bodyText() {
    return (document.body.innerText || '').slice(0, 8000);
  }

  /* ================= shared ================= */

  function buildContext(pregenerated, tailored) {
    /* When a tailored package exists, the form is filled from the resume
       written for this specific posting rather than the base profile. That
       distinction is the whole product: a spray tool sends one resume
       everywhere, this sends the one written for this role. */
    const profileForFill = tailored?.resume
      ? Profile.hydrate(Object.assign({}, state.profile, tailored.resume))
      : state.profile;

    return {
      profileOverride: profileForFill,
      resume: state.resume,

      async answerQuestion(question) {
        /* An answer approved for this specific role wins over the bank, because
           the person reviewed it against this posting. */
        const approved = (tailored?.screeningAnswers || []).find(
          (a) => normalizeQuestion(a.question) === normalizeQuestion(question)
        );
        if (approved && approved.confidence === 'high') return approved.answer;

        const remembered = await Storage.recallAnswer(question);
        if (remembered) return remembered;
        if (!state.settings.tailorScreeningAnswers) return null;
        const answer = await ask('answerQuestion', { question });
        if (answer) await Storage.rememberAnswer(question, answer);
        return answer;
      },

      async generate(kind) {
        if (kind === 'coverLetter' && pregenerated) return pregenerated;
        if (kind === 'coverLetter' && !state.settings.tailorCoverLetter) return '';
        return ask(kind, {});
      }
    };
  }

  function ask(kind, payload) {
    return send({
      type: 'careeros:generate',
      kind,
      payload,
      posting: state.posting || {},
      match: state.match || {}
    }).then((res) => (res && res.ok ? res.text : null));
  }

  function send(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (res) => {
          void chrome.runtime.lastError;
          resolve(res);
        });
      } catch (err) {
        resolve(null);
      }
    });
  }

  function normalizeQuestion(q) {
    return String(q || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* ================= popup protocol ================= */

  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'careeros:ping') { respond(snapshot()); return true; }
    if (msg.type === 'careeros:fill') { doFill().then(respond); return true; }
    if (msg.type === 'careeros:submit') { doSubmit().then(respond); return true; }
    if (msg.type === 'careeros:harvest') {
      const collected = Harvest.collect();
      respond({ ok: true, ats: collected.ats, jobs: collected.jobs });
      return true;
    }
    return false;
  });
})();
