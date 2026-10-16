/* CareerOS — apply engine
 *
 * Owns the run: pulls postings from discovery, scores them, queues the ones worth applying to, and works
 * the queue through a pool of background tabs.
 *
 * Speed comes from four places, none of which is hammering a server:
 *   1. Discovery is one API call per source, not one page load per posting.
 *   2. A pool of tabs applies concurrently, so a slow Workday form doesn't block a fast Lever one.
 *   3. Cover letters for the next few jobs are written while the current one is being filled.
 *   4. Saved answers mean a repeated screening question costs nothing.
 *
 * When an application needs the person (a visible CAPTCHA, a sign-in, a question only they can answer) it
 * waits in its own tab and they're notified; the rest of the queue keeps going. Tabs in progress are kept in
 * session storage, so Chrome suspending the service worker mid-run loses nothing.
 *
 * Pacing is per platform and comes from lib/policy.js, which is also the only thing that can authorise an
 * automated submit.
 */
(function (root) {
  'use strict';

  const { Storage, Profile, Matcher, Policy, Discovery, Api } = root.CareerOS;

  const STATE_KEY = 'careeros.engine';
  const ACTIVE_KEY = 'careeros.active';
  const FILL_TIMEOUT_MS = 8 * 60 * 1000;    // filling one application (background tabs are throttled)
  const SUBMIT_TIMEOUT_MS = 3 * 60 * 1000;  // waiting for the page after submit was pressed
  const HEARTBEAT_EVERY_MS = 15000;

  const runtime = {
    gateUntil: new Map(),   // ats -> earliest timestamp for the next job
    pregen: new Map(),      // job id -> generated cover letter
    loopRunning: false,
    lastHeartbeat: 0
  };

  /* ---------------- persistence ---------------- */

  const EMPTY_STATE = {
    running: false,
    queue: [],
    done: [],
    startedAt: null,
    runId: null,
    lastError: null,
    stats: { queued: 0, applied: 0, assisted: 0, skipped: 0, failed: 0 }
  };

  /* Tabs being worked on. Session storage survives the service worker being suspended (not a browser restart). */
  let activeLock = Promise.resolve();
  function getActive() {
    return new Promise((resolve) => chrome.storage.session.get([ACTIVE_KEY], (r) => resolve(r[ACTIVE_KEY] || {})));
  }
  function updateActive(fn) {
    const run = activeLock.then(async () => {
      const next = await fn(await getActive());
      await new Promise((resolve) => chrome.storage.session.set({ [ACTIVE_KEY]: next }, resolve));
      return next;
    });
    activeLock = run.catch(() => {});
    return run;
  }

  const Engine = {
    async getState() {
      return Object.assign({}, EMPTY_STATE, await Storage.get(STATE_KEY, {}));
    },

    /* All state writes go through here, one at a time, so results arriving from several tabs at once can't
       overwrite each other (which used to flip a finished job back to queued and apply to it twice). */
    async mutate(fn) {
      const next = await Storage.update(STATE_KEY, {}, async (stored) => {
        const current = Object.assign({}, EMPTY_STATE, stored);
        return Object.assign(current, await fn(current));
      });
      heartbeat(next);
      return next;
    },

    async setState(patch) {
      return Engine.mutate(() => patch);
    },

    /* ---------------- building the queue ---------------- */

    async build() {
      const profile = Profile.hydrate(await Storage.getProfile());
      const settings = await Storage.getSettings();
      const sources = await Storage.get('careeros.sources', { boards: [] });

      const { jobs, errors } = await Discovery.search(profile, settings, sources);

      const scored = [];
      let wontRun = 0;
      for (const job of jobs) {
        const posting = {
          title: job.title,
          company: job.company,
          description: `${job.description} ${job.location}`,
          url: job.applyUrl || job.url
        };
        const match = Matcher.score(profile, posting);
        if (match.blocked) continue;
        if (match.score < settings.minMatchScore) continue;
        if (await Storage.alreadyApplied(posting.url)) continue;

        const target = Discovery.resolveApplyUrl(job);
        const ats = job.ats || target.ats;
        // Sites CareerOS only fills (or can't fill) would sit in the queue forever.
        if (!Policy.canQueue(ats, settings)) { wontRun += 1; continue; }
        scored.push({
          id: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          url: target.url,
          ats,
          score: match.score,
          reasons: match.reasons.slice(0, 3),
          matchedSkills: match.matchedSkills,
          description: (job.description || '').slice(0, 6000),
          postedAt: job.postedAt,
          state: 'queued'
        });
      }

      // Best matches first, and among equals the freshest posting.
      scored.sort((a, b) => (b.score - a.score) || (b.postedAt - a.postedAt));

      const queue = scored.slice(0, Math.max(10, settings.dailyLimit * 2));
      await Engine.setState({
        queue,
        lastError: errors.length ? errors.join(' · ') : null,
        stats: { queued: queue.length, applied: 0, assisted: 0, skipped: 0, failed: 0 }
      });

      return { queued: queue.length, found: jobs.length, wontRun, errors };
    },

    /* Jobs harvested from a results page. They arrive without a description,
       so they get scored again in the tab once the posting has loaded. */
    async add(jobs) {
      const settings = await Storage.getSettings();
      const profile = Profile.hydrate(await Storage.getProfile());
      const fresh = [];
      let duplicates = 0;
      let wontRun = 0;

      const state = await Engine.getState();
      const known = new Set(state.queue.map((j) => j.id));
      for (const job of jobs || []) {
        if (known.has(job.id)) { duplicates += 1; continue; }
        if (await Storage.alreadyApplied(job.url)) { duplicates += 1; continue; }

        // Only the title is available at this point, so this is a cheap first
        // pass. The real score happens in the tab against the full description.
        const rough = Matcher.score(profile, {
          title: job.title,
          company: job.company,
          description: `${job.title} ${job.location}`,
          url: job.url
        });
        if (rough.blocked) { duplicates += 1; continue; }
        if (!Policy.canQueue(job.ats, settings)) wontRun += 1;

        known.add(job.id);
        fresh.push(Object.assign({}, job, {
          score: rough.score,
          reasons: rough.reasons.slice(0, 2),
          matchedSkills: rough.matchedSkills,
          provisional: true,
          state: 'queued'
        }));
      }

      const next = await Engine.mutate((s) => {
        const queue = s.queue.concat(fresh.filter((j) => !s.queue.some((q) => q.id === j.id)));
        return { queue, stats: Object.assign({}, s.stats, { queued: queue.filter((j) => j.state === 'queued').length }) };
      });
      return { added: fresh.length, duplicates, wontRun, total: next.queue.length };
    },

    /* ---------------- running ---------------- */

    async start() {
      const settings = await Storage.getSettings();
      if (!settings.autoSubmit) {
        // A run that fills forty forms and submits none just leaves forty
        // half-finished applications behind. Better to say so than to pretend.
        return Engine.setState({
          running: false,
          lastError: 'Turn on "Submit without asking me first" before starting a run. Without it, use the panel on individual postings instead.'
        });
      }
      let state = await Engine.getState();
      if (!state.queue.some((j) => j.state === 'queued')) {
        await Engine.build();
        state = await Engine.getState();
      }
      if (!state.queue.some((j) => j.state === 'queued')) {
        return Engine.setState({ running: false, lastError: 'No matching jobs to apply to right now. Add job sites or lower the minimum match in settings.' });
      }
      await Engine.setState({
        running: true,
        startedAt: Date.now(),
        lastError: null,
        // One run per queue: stopping and starting again (or Chrome restarting) continues the same run
        // instead of counting as a new campaign.
        runId: state.runId || `run_${Date.now().toString(36)}`,
      });
      chrome.alarms.create('careeros:tick', { periodInMinutes: 1 });
      Engine.loop();
      return Engine.getState();
    },

    async stop(reason, opts) {
      const next = await Engine.setState({ running: false, lastError: reason || null });
      chrome.alarms.clear('careeros:tick');
      // Leave tabs that are waiting for the person open: closing them would throw their answers away.
      const active = await getActive();
      for (const [tabId, entry] of Object.entries(active)) {
        if (entry.phase === 'waiting' && !(opts && opts.closeWaiting)) continue;
        closeTab(Number(tabId));
      }
      await updateActive((a) => {
        const keep = {};
        for (const [tabId, entry] of Object.entries(a)) if (entry.phase === 'waiting' && !(opts && opts.closeWaiting)) keep[tabId] = entry;
        return keep;
      });
      await Engine.mutate((s) => ({ queue: s.queue.map((j) => (j.state === 'running' ? Object.assign({}, j, { state: 'queued' }) : j)) }));
      await updateBadge();
      return next;
    },

    /* After a browser restart nothing is in flight any more: put interrupted jobs back in the queue
       (unless submit had already been pressed, which must never be repeated). */
    async recover() {
      const active = await getActive();
      const live = new Set(Object.values(active).map((e) => e.job.id));
      await Engine.mutate((s) => ({
        queue: s.queue.map((j) => ((j.state === 'running' || j.state === 'waiting') && !live.has(j.id) ? Object.assign({}, j, { state: j.submitPressed ? 'assisted' : 'queued' }) : j)),
      }));
    },

    /* The loop is re-entrant on purpose: an alarm can restart it after the
       service worker has been suspended, and it will pick up where it left off. */
    async loop() {
      if (runtime.loopRunning) return;
      runtime.loopRunning = true;

      try {
        while (true) {
          const state = await Engine.getState();
          if (!state.running) break;
          await expireStale();

          const settings = await Storage.getSettings();
          const limit = await limitReached(settings);
          if (limit) {
            await Engine.stop(limit);
            notify('CareerOS has stopped for now', limit);
            break;
          }

          const active = Object.values(await getActive());
          const working = active.filter((e) => e.phase !== 'waiting');
          const next = pickNext(state.queue, settings);
          if (!next) {
            if (!working.length && !state.queue.some((j) => j.state === 'queued')) {
              const waiting = active.length;
              // Report the finished run before forgetting its id (a run with applications still waiting keeps it).
              await Engine.setState({ running: false, lastError: waiting ? `${waiting} application${waiting === 1 ? '' : 's'} waiting for you` : 'Queue finished' });
              if (!waiting) await Engine.setState({ runId: null });
              chrome.alarms.clear('careeros:tick');
              notify('Run finished', summarize(await Engine.getState()) + (waiting ? ` ${waiting} still need${waiting === 1 ? 's' : ''} you.` : ''));
              break;
            }
            await sleep(2000);
            continue;
          }

          // One tab at a time on a restricted platform: parallel sessions on
          // the same account are both slower in practice and the thing most
          // likely to get one flagged. Applications waiting for the person don't count.
          const restricted = Policy.isRestricted(next.ats);
          const total = Math.max(1, Number(settings.concurrency) || 3);
          const cap = restricted ? 1 : total;
          const openOnPlatform = working.filter((e) => e.job.ats === next.ats).length;
          if (openOnPlatform >= cap || working.length >= total) {
            await sleep(1500);
            continue;
          }

          // Jitter the gap so a run doesn't tick like a metronome.
          runtime.gateUntil.set(next.ats, Date.now() + Policy.jitter(next.ats, settings));
          await mark(next.id, { state: 'running' });
          pregenerateAhead(state.queue, settings);
          await openTab(next);
          await sleep(600);
        }
      } finally {
        runtime.loopRunning = false;
      }
    },

    /* ---------------- messages from the page ---------------- */

    /* Called by the worker when a content script announces itself (also after every page navigation). */
    async handleReady(tabId, url) {
      let entry = (await getActive())[tabId];
      if (!entry) return null;
      // Handed off to (or opened) the employer's own form: from here it's an application on that site.
      if (url && (entry.handoff || entry.adopted)) entry = await retarget(tabId, url);
      if (!entry) return null;
      const settings = await Storage.getSettings();
      const permission = Policy.canAutoSubmit(entry.job.ats, settings);

      if (!entry.submitPressed && await Storage.alreadyApplied(entry.job.url)) {
        await Engine.handleResult(tabId, { outcome: 'skipped', detail: 'Already applied (on this or another device)' });
        return null;
      }

      /* A tailored package means this posting has its own resume summary and cover letter. Without one
         the content script falls back to the base profile. */
      const pkg = entry.pkg || await Api.getPackage(entry.job).catch(() => ({ tailored: false }));
      if (pkg && pkg.code === 'UNAUTHENTICATED') {
        await Engine.stop('Sign in again: this browser is no longer connected to your Career OS account.');
        notify('CareerOS needs you to sign in', 'Open CareerOS and press Sign in, then start the run again.');
        return null;
      }
      if (!entry.pkg) {
        await updateActive((a) => (a[tabId] ? Object.assign(a, { [tabId]: Object.assign({}, a[tabId], { pkg, job: Object.assign({}, a[tabId].job, { applicationId: pkg && pkg.applicationId }) }) }) : a));
      }

      return {
        job: entry.job,
        directive: {
          autoSubmit: permission.allowed,
          policyNote: permission.reason,
          maxSteps: stepsFor(entry.job.ats),
          submitPressed: !!entry.submitPressed,
          pregenerated: (pkg && pkg.tailored ? pkg.coverLetter : null) || runtime.pregen.get(entry.job.id) || null,
          tailoredResume: pkg && pkg.tailored ? pkg.resume : null,
          screeningAnswers: (pkg && pkg.tailored ? pkg.screeningAnswers : null) || []
        }
      };
    },

    async handleResult(tabId, result) {
      let entry = null;
      await updateActive((a) => {
        entry = a[tabId] || null;
        delete a[tabId];
        return a;
      });
      if (!entry) return;
      runtime.pregen.delete(entry.job.id);
      // "Assisted" means filled and waiting for the person to press submit: leave that tab open.
      if (result.outcome !== 'assisted') closeTab(tabId);
      await settle(Object.assign({}, entry.job, { submitPressed: entry.submitPressed }), result);
      await updateBadge();
    },

    /* The application needs the person: keep its tab, tell them, and let the rest of the queue run. */
    async handleNeedsYou(tabId, info) {
      let entry = null;
      await updateActive((a) => {
        if (a[tabId]) a[tabId] = Object.assign({}, a[tabId], { phase: 'waiting', reason: info.reason, message: info.message, since: Date.now() });
        entry = a[tabId] || null;
        return a;
      });
      if (!entry) return;
      await mark(entry.job.id, { state: 'waiting', detail: info.message || 'Needs you' });
      const what = info.reason === 'captcha' ? 'a verification check' : info.reason === 'login' ? 'you to sign in' : 'your answer';
      heartbeat(await Engine.getState(), true);
      notify(`${entry.job.company || 'An application'} needs ${what}`, `${entry.job.title || ''}. Click to open the tab. CareerOS continues by itself afterwards.`, `careeros:tab:${tabId}`, true);
      await updateBadge();
    },

    async handleResumed(tabId) {
      let entry = null;
      await updateActive((a) => {
        if (a[tabId]) a[tabId] = Object.assign({}, a[tabId], { phase: a[tabId].submitPressed ? 'submitting' : 'running', startedAt: Date.now(), reason: null, message: null });
        entry = a[tabId] || null;
        return a;
      });
      if (!entry) return;
      chrome.notifications.clear(`careeros:tab:${tabId}`);
      await mark(entry.job.id, { state: 'running', detail: null });
      heartbeat(await Engine.getState(), true);
      await updateBadge();
      const state = await Engine.getState();
      if (state.running) Engine.loop();
    },

    /* Submit is being pressed: from now on this job is never retried, only verified. */
    async handleSubmitting(tabId) {
      let entry = null;
      await updateActive((a) => {
        if (a[tabId]) a[tabId] = Object.assign({}, a[tabId], { phase: 'submitting', submitPressed: true, submittedAt: Date.now() });
        entry = a[tabId] || null;
        return a;
      });
      if (entry) await mark(entry.job.id, { submitPressed: true });
    },

    /* The page is about to go to the employer's own form ("Apply on company site"). */
    async handleHandoff(tabId, url) {
      await updateActive((a) => {
        if (a[tabId]) a[tabId] = Object.assign({}, a[tabId], { handoff: true, startedAt: Date.now() });
        return a;
      });
      if (url) await retarget(tabId, url);
    },

    /* The page is about to press something that may open the application in a new tab. */
    async handleExpectTab(tabId) {
      await updateActive((a) => {
        if (a[tabId]) a[tabId] = Object.assign({}, a[tabId], { expectTabAt: Date.now() });
        return a;
      });
    },

    /* A job's tab opened another tab (Indeed Apply, an employer's "Apply" link): the application continues
       there, so the job moves to the new tab and the old one is closed. */
    async adoptTab(openerTabId, tab) {
      let moved = null;
      await updateActive((a) => {
        // Chrome doesn't always record which tab opened a new one; a tab that just announced a handoff owns it.
        if (openerTabId === undefined || !a[openerTabId]) {
          const recent = Object.entries(a).find(([, e]) => (e.handoff && Date.now() - e.startedAt < 15000) || (e.expectTabAt && Date.now() - e.expectTabAt < 15000));
          if (recent) openerTabId = Number(recent[0]);
        }
        const entry = a[openerTabId];
        if (!entry || a[tab.id] || Number(openerTabId) === tab.id) return a;
        moved = Object.assign({}, entry, { adopted: true, startedAt: Date.now() });
        a[tab.id] = moved;
        delete a[openerTabId];
        return a;
      });
      if (!moved) return;
      const url = tab.pendingUrl || tab.url;
      if (url && /^https?:/.test(url)) await retarget(tab.id, url);
      setTimeout(() => closeTab(openerTabId), 1500);
    },

    /* A handed-off tab reached a page: if CareerOS can't run on that site, say so instead of timing out. */
    async handleNavigated(tabId, url) {
      const entry = (await getActive())[tabId];
      if (!entry || !(entry.handoff || entry.adopted) || !/^https?:/.test(url || '')) return;
      if (!(await canRunOn(url))) {
        await Engine.handleResult(tabId, { outcome: 'skipped', detail: `Applies on ${new URL(url).hostname}. Turn that site on in CareerOS settings to apply there automatically.` });
      }
    },

    /* The person closed a tab we were working in. */
    async handleTabClosed(tabId) {
      const entry = (await getActive())[tabId];
      if (!entry) return;
      await Engine.handleResult(tabId, entry.submitPressed
        ? { outcome: 'submitted', detail: 'Tab closed after submit; no confirmation seen' }
        : { outcome: 'skipped', detail: 'You closed the tab' });
    },

    focusTab,
    getActive,
    runtime
  };

  /* ---------------- internals ---------------- */

  /* LinkedIn Easy Apply runs five or six panes; Workday is deeper still. */
  function stepsFor(ats) {
    if (ats === 'workday') return 10;
    if (ats === 'linkedin') return 8;
    if (ats === 'indeed') return 7;
    return 6;
  }

  /* Point the job at the page it actually ended up on (an employer's form after a job-board handoff). */
  async function retarget(tabId, url) {
    let updated = null;
    const ats = Discovery.classifyUrl(url);
    await updateActive((a) => {
      if (!a[tabId]) return a;
      const prev = a[tabId].job;
      const job = Object.assign({}, prev, { url, ats, via: prev.via || prev.ats, viaUrl: prev.viaUrl || prev.url });
      a[tabId] = Object.assign({}, a[tabId], { job, pkg: null });
      updated = a[tabId];
      return a;
    });
    return updated;
  }

  function canRunOn(url) {
    try {
      return chrome.permissions.contains({ origins: [`${new URL(url).origin}/*`] });
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  function pickNext(queue, settings) {
    const now = Date.now();
    return queue.find((j) => {
      if (j.state !== 'queued') return false;
      if (!Policy.canQueue(j.ats, settings)) return false;
      const gate = runtime.gateUntil.get(j.ats) || 0;
      return now >= gate;
    });
  }

  /* Daily cap (this browser) and the plan's monthly cap (all devices, from the last sync). Only real
     submissions count. */
  async function limitReached(settings) {
    const today = await Storage.appliedToday();
    if (today >= settings.dailyLimit) return `Daily limit of ${settings.dailyLimit} applications reached. It resets at midnight.`;
    if (settings.monthlyLimit != null) {
      const list = await Storage.getApplications();
      const since = settings.syncedAt || 0;
      const sinceSync = list.filter((a) => a.status === 'submitted' && a.at >= since).length;
      if ((settings.appliedThisMonth || 0) + sinceSync >= settings.monthlyLimit) {
        return `Your plan's ${settings.monthlyLimit} applications for this month are used up.`;
      }
    }
    return null;
  }

  async function openTab(job) {
    const tab = await chrome.tabs.create({ url: job.url, active: false });
    await updateActive((a) => Object.assign(a, { [tab.id]: { job, phase: 'running', startedAt: Date.now() } }));
  }

  /* Applications stuck filling (or stuck after submit) for too long. Ones waiting for the person never expire. */
  async function expireStale() {
    const now = Date.now();
    const active = await getActive();
    for (const [tabId, e] of Object.entries(active)) {
      if (e.phase === 'running' && now - e.startedAt > FILL_TIMEOUT_MS) {
        await Engine.handleResult(Number(tabId), { outcome: 'failed', detail: 'Timed out filling the form' });
      } else if (e.phase === 'submitting' && now - (e.submittedAt || e.startedAt) > SUBMIT_TIMEOUT_MS) {
        await Engine.handleResult(Number(tabId), { outcome: 'submitted', detail: 'Submitted; no confirmation page seen' });
      }
    }
  }

  async function settle(job, result) {
    const outcome = result.outcome;
    await Engine.mutate((s) => {
      const stats = Object.assign({}, s.stats);
      if (outcome === 'submitted') stats.applied += 1;
      else if (outcome === 'assisted') stats.assisted += 1;
      else if (outcome === 'skipped') stats.skipped += 1;
      else stats.failed += 1;
      const queue = s.queue.map((j) =>
        j.id === job.id ? Object.assign({}, j, { state: outcome, detail: result.detail || null }) : j
      );
      stats.queued = queue.filter((j) => j.state === 'queued').length;
      const done = [
        Object.assign({}, job, { state: outcome, detail: result.detail || null, at: Date.now() }),
        ...s.done
      ].slice(0, 300);
      return { queue, done, stats };
    });

    /* Report to CareerOS so the tracker on the web app is the same list the extension is working from. The
       local log is written either way; a failed report is shown, not swallowed. */
    if (outcome === 'submitted' || outcome === 'assisted') {
      await Storage.logApplication({
        url: job.url,
        viaUrl: job.viaUrl || undefined, // the LinkedIn / Indeed listing it came from, so it isn't queued again
        title: job.title,
        company: job.company,
        ats: job.ats,
        score: job.score,
        status: outcome === 'submitted' ? 'submitted' : 'filled'
      });
      try {
        await Api.logApplication({
          url: job.url,
          title: job.title || '',
          company: job.company || '',
          ats: job.ats || '',
          matchScore: job.score || 0,
          outcome,
          detail: result.detail ? String(result.detail).slice(0, 500) : undefined,
        });
        if (job.applicationId && outcome === 'submitted') await Api.markPackageSubmitted(job.applicationId);
      } catch (err) {
        await Engine.setState({ lastError: `Couldn't record "${job.title}" in Career OS: ${err.message}` });
      }
    }
  }

  async function mark(id, patch) {
    await Engine.mutate((s) => ({
      queue: s.queue.map((j) => (j.id === id ? Object.assign({}, j, patch) : j))
    }));
  }

  /* Live run status for the Auto Apply page, including applications waiting for the person. Throttled
     (unless what's waiting changed); errors that mean the run can't continue stop it. */
  async function heartbeat(state, force) {
    if (!state || !state.runId) return;
    const now = Date.now();
    if (!force && state.running && now - runtime.lastHeartbeat < HEARTBEAT_EVERY_MS) return;
    runtime.lastHeartbeat = now;
    const waiting = Object.values(await getActive()).filter((e) => e.phase === 'waiting').map((e) => ({
      title: String(e.job.title || '').slice(0, 200),
      company: String(e.job.company || '').slice(0, 200),
      url: String(e.job.url || '').slice(0, 2000),
      reason: String(e.reason || '').slice(0, 40),
      message: String(e.message || '').slice(0, 500),
      since: e.since || undefined,
    }));
    Api.heartbeat({
      waiting,
      runId: state.runId,
      status: state.running ? 'running' : 'finished',
      queued: state.queue.filter((j) => j.state === 'queued').length,
      submitted: state.stats.applied,
      assisted: state.stats.assisted,
      skipped: state.stats.skipped,
      failed: state.stats.failed,
      lastError: state.lastError ? String(state.lastError).slice(0, 500) : undefined,
    }).catch(async (err) => {
      if (!state.running) return;
      if (err.code === 'UNAUTHENTICATED') {
        await Engine.stop('Sign in again: this browser is no longer connected to your Career OS account.');
        notify('CareerOS needs you to sign in', 'Open CareerOS and press Sign in, then start the run again.');
      } else if (err.status === 429 && /campaign/i.test(err.message)) {
        await Engine.stop(err.message);
        notify('CareerOS has stopped', err.message);
      }
    });
  }

  /* Write the next few cover letters while the current job is being filled. */
  async function pregenerateAhead(queue, settings) {
    if (!settings.tailorCoverLetter) return;
    const upcoming = queue.filter((j) => j.state === 'queued').slice(0, 3);
    for (const job of upcoming) {
      if (runtime.pregen.has(job.id)) continue;
      runtime.pregen.set(job.id, null); // claim the slot so we don't double-generate
      root.CareerOS.generateFor(job)
        .then((text) => { if (text) runtime.pregen.set(job.id, text); })
        .catch(() => runtime.pregen.delete(job.id));
    }
  }

  async function updateBadge() {
    const waiting = Object.values(await getActive()).filter((e) => e.phase === 'waiting').length;
    if (waiting) {
      chrome.action.setBadgeText({ text: String(waiting) });
      chrome.action.setBadgeBackgroundColor({ color: '#DC2626' });
      chrome.action.setTitle({ title: `CareerOS: ${waiting} application${waiting === 1 ? '' : 's'} need${waiting === 1 ? 's' : ''} you` });
      return;
    }
    const count = await Storage.appliedToday();
    chrome.action.setBadgeText({ text: count ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#F14632' });
    chrome.action.setTitle({ title: 'CareerOS' });
  }
  Engine.updateBadge = updateBadge;

  async function focusTab(tabId) {
    const tab = await chrome.tabs.update(Number(tabId), { active: true }).catch(() => null);
    if (tab && tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
    return !!tab;
  }

  function closeTab(tabId) {
    chrome.tabs.remove(tabId).catch(() => {});
  }

  function notify(title, message, id, requireInteraction) {
    chrome.notifications.create(id || '', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: String(title || '').slice(0, 100),
      message: String(message || '').slice(0, 200),
      priority: requireInteraction ? 2 : 0,
      requireInteraction: !!requireInteraction
    });
  }

  function summarize(state) {
    const s = state.stats;
    return `${s.applied} submitted, ${s.assisted} filled for you, ${s.skipped} skipped, ${s.failed} failed.`;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  root.CareerOS.Engine = Engine;
})(typeof self !== 'undefined' ? self : this);
