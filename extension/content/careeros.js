/* CareerOS — page agent (headless)
 *
 * Nothing is drawn on the host page. The only visible trace is an outline on fields that were filled and on
 * required fields that still need the person. Everything else is driven from the popup and the run dashboard.
 *
 * Two modes on the same code path:
 *   driven   The popup or the engine asks it to read, fill or submit.
 *   auto     The engine opened this tab: fill, advance, submit, report back. When something needs the
 *            person (a visible CAPTCHA, a sign-in, a question only they can answer) the application waits
 *            in its tab for them, then carries on by itself; the rest of the run keeps going meanwhile.
 */
(function () {
  'use strict';

  if (window.__careerosLoaded) return;
  window.__careerosLoaded = true;
  if (window.top !== window.self && document.body && document.body.innerText.length < 200) return;

  const { Storage, Profile, ATS, Matcher, Filler, Policy, Flows, Harvest, Answers } = window.CareerOS;

  /* Stop typing/clicking for this long and CareerOS continues: it never submits mid-answer. */
  const IDLE_MS = 4000;

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
    report: null,
    pressedSubmit: false
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

    // Ask the worker whether this tab belongs to a run.
    const directive = await send({ type: 'careeros:ready' });
    if (directive && directive.job) {
      if (!state.ready) {
        return report({ outcome: 'failed', detail: 'Your profile needs a name, email and phone number. Open CareerOS settings to finish it.' });
      }
      runAutomated(directive);
      return;
    }
    if (!state.ready) return;

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

    state.busy = true;
    try {
      const prior = await Storage.alreadyApplied(location.href);
      // LinkedIn Easy Apply and Indeed Apply keep the form in their own window: open it first, then fill
      // each step as the person moves through it. CareerOS never presses submit here.
      const flowId = Policy.flow(state.adapter.id);
      if (flowId) {
        const flow = Flows.get(flowId);
        const opened = await flow.open();
        if (opened.error === 'external_apply') {
          return { ok: false, error: 'This job applies on the employer\'s own site. Press Apply, then use Fill on that page.' };
        }
        if (opened.error) return { ok: false, error: 'Couldn\'t open the application form on this page.' };
        const report = await Filler.fillForm(opened.root, state.profile, buildContext(null, null, { skipOptionalUploads: true }));
        state.report = report;
        followSteps(flow, opened.root);
        return { ok: true, report: summarize(report), priorApplication: prior ? prior.at : null };
      }
      const form = ATS.findForm(state.adapter, document) || document.body;
      const report = await Filler.fillForm(form, state.profile, buildContext(null));
      state.report = report;
      // Filling isn't applying: nothing is logged until it is submitted, so this job stays eligible for a run.
      return { ok: true, report: summarize(report), priorApplication: prior ? prior.at : null };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      state.busy = false;
    }
  }

  /* After a Fill on LinkedIn / Indeed: when the person presses Next, fill the new step too (only empty fields,
     never a button). Stops when the application is sent or its window is closed. */
  let following = null;
  function followSteps(flow, root) {
    if (following) following.disconnect();
    let last = formSignature(root);
    let timer = null;
    const started = Date.now();
    following = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const scope = flow.isOpen && flow.isOpen() ? (document.contains(root) ? root : document.body) : null;
        if (!scope || flow.isDone() || Date.now() - started > 30 * 60 * 1000) {
          following.disconnect();
          following = null;
          return;
        }
        const sig = formSignature(scope);
        if (sig === last || state.busy) return;
        last = sig;
        state.busy = true;
        try {
          state.report = await Filler.fillForm(scope, state.profile, buildContext(null, null, { skipOptionalUploads: true }));
        } finally {
          state.busy = false;
        }
      }, 700);
    });
    following.observe(document.body, { childList: true, subtree: true });
  }

  async function doSubmit() {
    const permission = Policy.canAutoSubmit(state.adapter.id, state.settings);
    if (!permission.allowed) return { ok: false, error: permission.reason };

    const form = ATS.findForm(state.adapter, document) || document;
    const button = ATS.findSubmit(state.adapter, form)
      || Flows.byText(['submit application', 'submit', 'send application']);
    if (!button) return { ok: false, error: 'No submit button on this step' };

    const record = await Storage.logApplication({
      url: location.href,
      title: (state.posting && state.posting.title) || document.title,
      company: state.posting && state.posting.company,
      ats: state.adapter.id,
      score: state.match ? state.match.score : null,
      status: 'submitting'
    });
    await Flows.press(button);
    const confirmed = await Flows.waitFor(() => isConfirmation(), 8000);
    if (confirmed) await Storage.updateApplication(record.id, { status: 'submitted', submittedAt: Date.now() });
    return { ok: true, confirmed: Boolean(confirmed) };
  }

  /* ================= automated run ================= */

  async function runAutomated(directive) {
    try {
      // The page we land on after a submit (or after the person submitted it themselves while we waited).
      if (directive.directive.submitPressed) {
        await sleep(1500);
        if (isConfirmation()) return report({ outcome: 'submitted', detail: 'confirmation page' });
        state.pressedSubmit = true;
      }

      const flowId = Policy.flow(state.adapter.id);
      if (flowId) {
        const result = await runFlow(Flows.get(flowId), directive);
        if (result !== HANDED_OFF) report(result);
        return;
      }

      const gate = await waitForForm();
      if (gate.closed) return report({ outcome: 'skipped', detail: 'This job is no longer accepting applications' });
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

    await clearBlockers();
    // Indeed Apply (and some employers' links) continue in a new tab: let the run follow it there.
    await send({ type: 'careeros:expectTab' });
    const opened = await flow.open();
    if (opened.error === 'external_apply') {
      // "Apply on company site": follow it to the employer's own form and apply there. The run moves to
      // the page that opens (same tab or a new one) and fills it like any other application.
      await send({ type: 'careeros:handoff', url: opened.href ? new URL(opened.href, location.href).href : null });
      if (opened.href && !/^javascript:/i.test(opened.href)) location.href = new URL(opened.href, location.href).href;
      else await Flows.press(opened.button);
      return HANDED_OFF;
    }
    if (opened.error) return { outcome: 'failed', detail: opened.error };

    const scope = opened.root || document;
    const context = buildContext(directive.directive.pregenerated, directive.directive, { skipOptionalUploads: true });
    let filledTotal = 0;

    for (let step = 0; step < directive.directive.maxSteps; step++) {
      await clearBlockers();
      if (flow.isDone()) return { outcome: 'submitted', detail: `${filledTotal} fields over ${step} step${step === 1 ? '' : 's'}` };

      const before = { sig: formSignature(scope), progress: flow.progress(scope) };
      const filled = await Filler.fillForm(scope, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;

      if (Filler.missingRequired(scope).length) {
        const waited = await waitForPersonAnswers(scope);
        if (waited.submittedByPerson) return { outcome: 'submitted', detail: 'you submitted it' };
      }

      if (!directive.directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.directive.policyNote}` };
      }

      const c = flow.controls(scope);
      const button = c.submit || c.review || c.next;
      if (!button) {
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found nothing to press' }
          : { outcome: 'failed', detail: 'no control on this step' };
      }

      if (c.submit) {
        const hold = await holdBeforeSubmit(c.submit);
        if (hold === 'cancelled') return { outcome: 'assisted', detail: 'you cancelled the automatic submit' };
        if (hold === 'person') {
          const done = await Flows.waitFor(() => flow.isDone() || null, 14000);
          return done ? { outcome: 'submitted', detail: 'you submitted it' } : { outcome: 'assisted', detail: 'you pressed submit; no confirmation seen yet' };
        }
        await announceSubmit();
      }
      if (!await Flows.press(button)) {
        return { outcome: 'assisted', detail: 'the next button was disabled, so something is unanswered' };
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
        return { outcome: errors ? 'assisted' : 'failed', detail: errors || 'the form did not move' };
      }
    }

    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  /* Some flows show the posting first and the form only after a button. */
  async function waitForForm() {
    const deadline = Date.now() + 25000;
    let pressedApply = false;

    while (Date.now() < deadline) {
      await clearBlockers();
      if (isClosed()) return { closed: true };

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
    return { blocked: 'no application form found on this page' };
  }

  /* Generic multi-step ATS form. */
  async function stepThrough(directive) {
    const context = buildContext(directive.pregenerated, directive);
    let filledTotal = 0;

    for (let step = 0; step < directive.maxSteps; step++) {
      // A confirmation only counts after we (or the person) pressed submit: job descriptions often say
      // "thank you for applying" too.
      if (state.pressedSubmit && isConfirmation()) {
        return { outcome: 'submitted', detail: `confirmed after ${step} step${step === 1 ? '' : 's'}` };
      }
      await clearBlockers();

      const form = ATS.findForm(state.adapter, document) || document.body;
      const before = formSignature(form);

      const filled = await Filler.fillForm(form, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;

      if (Filler.missingRequired(form).length) {
        const waited = await waitForPersonAnswers(form);
        if (waited.submittedByPerson) {
          const ok = await Flows.waitFor(() => isConfirmation(), 15000);
          return ok ? { outcome: 'submitted', detail: 'you submitted it' } : { outcome: 'assisted', detail: 'you pressed submit; no confirmation seen yet' };
        }
      }

      if (!directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.policyNote}` };
      }

      const submit = ATS.findSubmit(state.adapter, form) || ATS.findSubmit(state.adapter, document);
      const button = submit || Flows.byText(['submit application', 'submit', 'send application', 'next', 'continue', 'save and continue', 'review']);
      if (!button) {
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found no submit or next button' }
          : { outcome: 'failed', detail: 'nothing to fill and nothing to press' };
      }

      // A "tick the box" CAPTCHA sits next to the submit button: the person ticks it, then we submit.
      if (challenge() === 'checkbox') await park('captcha', 'Tick the "I\'m not a robot" check, then CareerOS submits for you.', () => !challenge());

      const isSubmit = /submit|send|apply/i.test(button.textContent || button.value || '') || button === submit;
      if (isSubmit) {
        const hold = await holdBeforeSubmit(button);
        if (hold === 'cancelled') return { outcome: 'assisted', detail: 'you cancelled the automatic submit' };
        if (hold === 'person') {
          const ok = await Flows.waitFor(() => isConfirmation() || null, 15000);
          return ok ? { outcome: 'submitted', detail: 'you submitted it' } : { outcome: 'assisted', detail: 'you pressed submit; no confirmation seen yet' };
        }
        await announceSubmit();
      }
      if (!await Flows.press(button)) {
        const waited = await waitForPersonAnswers(form);
        if (waited.submittedByPerson) return { outcome: 'submitted', detail: 'you submitted it' };
        continue;
      }

      let changed = await waitForChange(before);
      // An invisible CAPTCHA can escalate to a puzzle once submit is pressed.
      if (!changed && challenge()) {
        await clearBlockers();
        changed = await waitForChange(before);
      }
      if (state.pressedSubmit && isConfirmation()) {
        return { outcome: 'submitted', detail: `${filledTotal} fields over ${step + 1} step${step ? 's' : ''}` };
      }
      if (!changed) {
        // The form rejected something: show the person, wait for them to fix it, then go round again.
        if (readFormErrors() || Filler.missingRequired(form).length) {
          const waited = await waitForPersonAnswers(form, { force: true });
          if (waited.submittedByPerson) return { outcome: 'submitted', detail: 'you submitted it' };
          continue;
        }
        return { outcome: 'failed', detail: 'the form did not move after submit' };
      }
    }
    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  /* runFlow handed the application to the employer's site: the page that opens reports the outcome. */
  const HANDED_OFF = { handedOff: true };

  function report(result) {
    hideBanner();
    return send({ type: 'careeros:result', result });
  }

  /* "Seconds to cancel before an auto submit" (settings): CareerOS waits that long before pressing submit.
     Working on the page restarts the wait, Escape cancels it (the application stays in this tab for the
     person), and if the person presses submit themselves CareerOS never presses it a second time. */
  async function holdBeforeSubmit(button) {
    const seconds = Math.max(0, Math.min(60, Number(state.settings.reviewCountdown) || 0));
    if (!seconds) return 'go';
    let last = Date.now();
    let result = null;
    const touch = () => { last = Date.now(); };
    const onKey = (e) => { if (e.key === 'Escape') result = 'cancelled'; else touch(); };
    const onPress = (e) => {
      if (e.isTrusted && button && (e.type === 'submit' || button.contains(e.target))) {
        result = 'person';
        state.pressedSubmit = true;
        send({ type: 'careeros:submitting' });
      }
    };
    const events = ['input', 'change', 'mousedown', 'pointerdown', 'wheel', 'touchstart'];
    events.forEach((ev) => document.addEventListener(ev, touch, { capture: true, passive: true }));
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onPress, true);
    document.addEventListener('submit', onPress, true);
    try {
      while (!result && Date.now() - last < seconds * 1000) await sleep(250);
    } finally {
      events.forEach((ev) => document.removeEventListener(ev, touch, { capture: true }));
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onPress, true);
      document.removeEventListener('submit', onPress, true);
    }
    return result || 'go';
  }

  /* Tell the worker a submit is being pressed, so a reload onto the confirmation page is recognised
     and a lost tab is never retried into a duplicate application. */
  async function announceSubmit() {
    state.pressedSubmit = true;
    await send({ type: 'careeros:submitting' });
  }

  /* ================= waiting for the person ================= */

  /* Something only the person can do. The application waits in this tab (the rest of the run carries on),
     the person is notified, and this continues by itself once `resolved()` is true. */
  async function park(reason, message, resolved) {
    await send({ type: 'careeros:needsYou', reason, message });
    showBanner(message);
    while (!resolved()) await sleep(1000);
    hideBanner();
    await send({ type: 'careeros:resumed' });
  }

  async function clearBlockers() {
    const ch = challenge();
    if (ch === 'puzzle' || ch === 'interstitial') {
      await park('captcha', 'Complete the verification on this page. CareerOS carries on by itself afterwards.', () => {
        const c = challenge();
        return c !== 'puzzle' && c !== 'interstitial';
      });
      await sleep(800);
    }
    if (needsLogin()) {
      await park('login', 'Sign in or create an account on this page. CareerOS fills the application once the form appears.', () => !needsLogin());
      await sleep(800);
    }
  }

  /* Required questions CareerOS couldn't answer: highlight them, then only watch the page (never type,
     focus or scroll while the person works). Once every required answer is in and they've paused, their
     answers are saved for next time and the run continues. If they press submit themselves, that counts. */
  async function waitForPersonAnswers(scope, opts) {
    let missing = Filler.missingRequired(scope);
    if (!missing.length && !(opts && opts.force)) return {};
    const asked = missing.slice();
    // What the form says now: anything the person changes while we wait (correcting one of our answers)
    // is learned too, not just the questions we asked.
    const before = new Map(Filler.collectFields(scope).map((f) => [f.node, Filler.valueOf(f)]));
    let lastTouch = Date.now();
    let submittedByPerson = false;
    const touch = () => { lastTouch = Date.now(); };
    const events = ['keydown', 'input', 'change', 'mousedown', 'pointerdown', 'wheel', 'touchstart'];
    const onSubmit = (e) => {
      if (submittedByPerson) return;
      if (e.type === 'click') {
        const btn = ATS.findSubmit(state.adapter, document);
        if (!btn || !btn.contains(e.target) || Filler.missingRequired(scope).length) return;
      }
      submittedByPerson = true;
      state.pressedSubmit = true;
      learn(asked, scope, before);
      send({ type: 'careeros:submitting' });
    };
    events.forEach((e) => document.addEventListener(e, touch, { capture: true, passive: true }));
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('click', onSubmit, true);

    const labels = missing.map((f) => f.label).filter(Boolean).slice(0, 4).join('; ');
    const what = missing.length
      ? `${missing.length} question${missing.length === 1 ? ' needs' : 's need'} your answer${labels ? `: ${labels}` : ''}.`
      : 'The form needs a correction (see the highlighted message).';
    await send({ type: 'careeros:needsYou', reason: 'questions', message: what });
    showBanner(`${what} Answer in this tab; when you stop typing, CareerOS saves your answers and continues.`);
    missing.forEach((f) => Filler.markAttention(f.kind === 'radio' || f.kind === 'choice' ? (f.node.closest('fieldset') || f.node.parentElement) : f.node));
    const first = missing[0] && missing[0].node;
    if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' });

    try {
      for (;;) {
        await sleep(1000);
        if (submittedByPerson) return { submittedByPerson: true };
        missing = Filler.missingRequired(scope);
        if (missing.length || Date.now() - lastTouch < IDLE_MS) continue;
        if (opts && opts.force && readFormErrors() && Date.now() - lastTouch < IDLE_MS * 2) continue;
        learn(asked, scope, before);
        return {};
      }
    } finally {
      events.forEach((e) => document.removeEventListener(e, touch, { capture: true }));
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('click', onSubmit, true);
      Filler.clearAttention(document);
      hideBanner();
      send({ type: 'careeros:resumed' });
    }
  }

  /* Save what the person entered for the questions CareerOS asked them, on this device and the server. */
  function learn(asked, scope, before) {
    const answers = [];
    const changed = before
      ? Filler.collectFields(scope || document).filter((f) => before.has(f.node) && before.get(f.node) !== Filler.valueOf(f) && !asked.some((a) => a.node === f.node))
      : [];
    asked.concat(changed).forEach((f) => {
      const fresh = Filler.collectFields(document).find((x) => x.node === f.node || (x.label === f.label && x.kind === f.kind)) || f;
      const answer = Filler.valueOf(fresh);
      const question = String(f.label || '').replace(/\s*\*\s*$/, '').trim();
      if (!question || !answer || answer.length > 5000 || f.kind === 'file') return;
      answers.push({ question, answer });
      const meaning = Answers.meaningOf(question, answer);
      if (meaning) answers.push({ question, answer: meaning.value, key: meaning.key });
    });
    if (answers.length) send({ type: 'careeros:learn', answers });
  }

  /* The extension's look is unchanged: nothing is drawn on the host page except field outlines. The person
     is told what's needed through the notification and the extension badge. */
  function showBanner() {}
  function hideBanner() {}

  /* ================= page signals ================= */

  /* A verification the person must deal with. Invisible reCAPTCHA (the corner badge) and score-based checks
     are on most application pages and never need anyone, so they don't count.
       'puzzle'        a challenge window is open
       'interstitial'  the whole page is a "verify you are human" check
       'checkbox'      an "I'm not a robot" box that hasn't been ticked yet */
  function challenge() {
    const big = (el) => {
      if (!el || !Flows.visible(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 30 && r.height > 30;
    };
    const popup = Array.from(document.querySelectorAll('iframe[src*="recaptcha"][src*="bframe"], iframe[src*="hcaptcha"][src*="challenge"], iframe[title*="challenge" i]')).find(big);
    if (popup) return 'puzzle';
    const text = `${document.title} ${bodyText().slice(0, 1500)}`;
    const formPresent = !!ATS.findForm(state.adapter, document);
    if (!formPresent && /verify (that )?you are (a )?human|checking (if the site connection is secure|your browser)|are you a robot|security check/i.test(text)) return 'interstitial';
    const widgets = Array.from(document.querySelectorAll(
      '.g-recaptcha:not([data-size="invisible"]), .h-captcha:not([data-size="invisible"]), .cf-turnstile, iframe[src*="recaptcha"][src*="anchor"], iframe[src*="hcaptcha.com"][src*="checkbox"], iframe[src*="challenges.cloudflare.com"]'
    )).filter((w) => !w.closest('.grecaptcha-badge') && !/size=invisible/.test(w.getAttribute('src') || '') && big(w));
    if (widgets.length && !captchaTokenPresent()) return 'checkbox';
    return null;
  }

  function captchaTokenPresent() {
    return Array.from(document.querySelectorAll('textarea[name="g-recaptcha-response"], textarea[name="h-captcha-response"], input[name="cf-turnstile-response"]'))
      .some((t) => (t.value || '').length > 20);
  }

  /* A sign-in wall: a password box and no application form, or an explicit "sign in to apply". */
  function needsLogin() {
    const pw = Array.from(document.querySelectorAll('input[type="password"]')).find((n) => Flows.visible(n));
    const form = ATS.findForm(state.adapter, document);
    const appFields = form ? form.querySelectorAll('input:not([type="hidden"]):not([type="password"]), select, textarea').length : 0;
    if (pw && appFields < 4) return true;
    return !form && /sign in to (continue|apply)|log ?in to apply|create an account to apply/i.test(bodyText().slice(0, 3000));
  }

  function isClosed() {
    return /no longer accepting applications|this (job|position|posting) (is|has) (closed|expired|been filled)|job not found/i.test(bodyText().slice(0, 4000));
  }

  function isConfirmation() {
    return /thank you for (applying|your application|your interest)|application (was |has been )?(received|submitted|sent)|we(?:'ve| have) received your application|successfully (applied|submitted)|your application is (in|complete)/i
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
    return ((document.body && document.body.innerText) || '').slice(0, 8000);
  }

  /* ================= shared ================= */

  function buildContext(pregenerated, tailored, opts) {
    /* When a tailored package exists, the form is filled from the resume written for this posting rather
       than the base profile. Only narrative.summary is overridden, merged one level into narrative. */
    const profileForFill = tailored && tailored.tailoredResume
      ? Profile.hydrate(
          Object.assign({}, state.profile, {
            narrative: Object.assign({}, state.profile.narrative, tailored.tailoredResume.narrative)
          })
        )
      : state.profile;

    return {
      profileOverride: profileForFill,
      resume: state.resume,
      // LinkedIn / Indeed keep the resume you used last; don't upload a new copy every time.
      skipOptionalUploads: !!(opts && opts.skipOptionalUploads),

      /* The person's earlier answer to this (or a near-identical) question. */
      recall(question) {
        const approved = ((tailored && tailored.screeningAnswers) || []).find(
          (a) => Storage.normalizeQuestion(a.question) === Storage.normalizeQuestion(question)
        );
        if (approved && approved.answer) return approved.answer;
        return Storage.recallAnswer(question);
      },

      /* A self-identification answer the person gave on an earlier form ("eeo:veteran" -> "No"). */
      async recallKey(key) {
        const bank = await Storage.getAnswers();
        return bank[key] ? bank[key].answer : null;
      },

      async answerQuestion(question, options) {
        if (!state.settings.tailorScreeningAnswers) return null;
        return ask('answerQuestion', { question, options: options || undefined });
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
