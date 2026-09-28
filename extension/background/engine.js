/* CareerOS — apply engine
 *
 * Owns the run: pulls postings from discovery, scores them, queues the ones
 * worth applying to, and works the queue through a pool of background tabs.
 *
 * Speed comes from four places, none of which is hammering a server:
 *   1. Discovery is one API call per source, not one page load per posting.
 *   2. A pool of tabs applies concurrently, so a slow Workday form doesn't
 *      block a fast Lever one.
 *   3. Cover letters for the next few jobs are written while the current one
 *      is being filled, so generation never sits on the critical path.
 *   4. The answer bank means a repeated screening question costs nothing.
 *
 * Pacing is per platform and comes from lib/policy.js, which is also the only
 * thing that can authorise an automated submit.
 */
(function (root) {
  'use strict';

  const { Storage, Profile, Matcher, Policy, Discovery, Api } = root.CareerOS;

  const STATE_KEY = 'careeros.engine';
  const JOB_TIMEOUT_MS = 120000;

  const runtime = {
    tabs: new Map(),        // tabId -> { job, resolve, timer }
    gateUntil: new Map(),   // ats -> earliest timestamp for the next job
    pregen: new Map(),      // externalId -> generated text
    loopRunning: false
  };

  const Engine = {
    async getState() {
      return Storage.get(STATE_KEY, {
        running: false,
        queue: [],
        done: [],
        startedAt: null,
        lastError: null,
        stats: { queued: 0, applied: 0, assisted: 0, skipped: 0, failed: 0 }
      });
    },

    async setState(patch) {
      const state = await Engine.getState();
      const next = Object.assign(state, patch);
      await Storage.set(STATE_KEY, next);

      /* Heartbeat, so the Auto Apply page shows a live run rather than a
         static mock. Fire and forget: a dropped heartbeat is cosmetic. */
      if (next.runId) {
        Api.heartbeat({
          runId: next.runId,
          status: next.running ? 'running' : 'finished',
          queued: next.queue.filter((j) => j.state === 'queued').length,
          submitted: next.stats.applied,
          assisted: next.stats.assisted,
          skipped: next.stats.skipped,
          failed: next.stats.failed,
          lastError: next.lastError || undefined,
        }).catch(() => {});
      }
      return next;
    },

    /* ---------------- building the queue ---------------- */

    async build() {
      const profilesData = await Storage.getProfiles();
      const activeProfile = Profile.hydrate(profilesData.profiles[profilesData.activeId]);
      const allProfiles = Object.values(profilesData.profiles).map((p) => Profile.hydrate(p));
      const multi = allProfiles.length > 1;
      const settings = await Storage.getSettings();
      const sources = await Storage.get('careeros.sources', { boards: [] });

      // Discovery's search terms (title/location keywords) still come from the
      // active profile — searching once per profile would multiply API calls
      // for a benefit that scoring against every profile already captures.
      // Company boards + any bring-your-own-key aggregators run from here in
      // the browser; broad market search also runs server-side against
      // CareerOS's own keys (Api.getJobs) so results show up with nothing to
      // configure — see careeros-api.js and discovery.js's header comment.
      const [discovered, serverResult] = await Promise.all([
        Discovery.search(activeProfile, settings, sources),
        Api.getJobs(activeProfile).catch((err) => ({ jobs: [], message: err.message }))
      ]);

      const serverJobs = (serverResult.jobs || []).map((j) => Object.assign({ source: 'careeros', radiusSearched: true }, j));
      // Board fetches and the server's own Adzuna/JSearch pull are two
      // independent sources that can easily surface the same real posting
      // under two different URLs (an aggregator redirect vs. the employer's
      // direct apply link) — Discovery.search() only dedupes within its own
      // results, so the combined list needs a second pass or the same job
      // can be queued (and counted) twice.
      const jobs = Discovery.dedupe(discovered.jobs.concat(serverJobs));
      const errors = discovered.errors.slice();
      if (serverResult.message) errors.push(serverResult.message);

      const scored = [];
      for (const job of jobs) {
        const posting = {
          title: job.title,
          company: job.company,
          description: `${job.description} ${job.location}`,
          url: job.applyUrl || job.url,
          radiusSearched: Boolean(job.radiusSearched)
        };

        const match = multi ? Matcher.scoreAll(allProfiles, posting)[0] : Matcher.score(activeProfile, posting);
        if (match.blocked) continue;
        if (match.score < settings.minMatchScore) continue;
        if (await Storage.alreadyApplied(posting.url)) continue;

        const target = Discovery.resolveApplyUrl(job);
        scored.push({
          id: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          url: target.url,
          ats: job.ats || target.ats,
          score: match.score,
          reasons: match.reasons.slice(0, 3),
          matchedSkills: match.matchedSkills,
          description: (job.description || '').slice(0, 6000),
          postedAt: job.postedAt,
          state: 'queued',
          profileId: match.profileId || profilesData.activeId,
          profileScore: match.score
        });
      }

      // Best matches first, and among equals the freshest posting.
      scored.sort((a, b) => (b.score - a.score) || (b.postedAt - a.postedAt));

      const queue = scored.slice(0, settings.dailyLimit * 2);
      await Engine.setState({
        queue,
        lastError: errors.length ? errors.join(' · ') : null,
        stats: { queued: queue.length, applied: 0, assisted: 0, skipped: 0, failed: 0 }
      });

      return { queued: queue.length, found: jobs.length, errors };
    },

    /* Jobs harvested from a results page. They arrive without a description,
       so they get scored again in the tab once the posting has loaded. */
    async add(jobs) {
      const state = await Engine.getState();
      const settings = await Storage.getSettings();
      const profilesData = await Storage.getProfiles();
      const allProfiles = Object.values(profilesData.profiles).map((p) => Profile.hydrate(p));
      const multi = allProfiles.length > 1;

      const known = new Set(state.queue.map((j) => j.id));
      const fresh = [];
      let duplicates = 0;

      for (const job of jobs || []) {
        if (known.has(job.id)) { duplicates += 1; continue; }
        if (await Storage.alreadyApplied(job.url)) { duplicates += 1; continue; }

        // Only the title is available at this point, so this is a cheap first
        // pass. The real score happens in the tab against the full description.
        const posting = {
          title: job.title,
          company: job.company,
          description: `${job.title} ${job.location}`,
          url: job.url,
          radiusSearched: Boolean(job.radiusSearched)
        };
        const rough = multi ? Matcher.scoreAll(allProfiles, posting)[0] : Matcher.score(allProfiles[0], posting);
        if (rough.blocked) { duplicates += 1; continue; }

        known.add(job.id);
        fresh.push(Object.assign({}, job, {
          score: rough.score,
          reasons: rough.reasons.slice(0, 2),
          matchedSkills: rough.matchedSkills,
          provisional: true,
          state: 'queued',
          profileId: rough.profileId || profilesData.activeId,
          profileScore: rough.score
        }));
      }

      const queue = state.queue.concat(fresh);
      await Engine.setState({
        queue,
        stats: Object.assign({}, state.stats, { queued: queue.filter((j) => j.state === 'queued').length })
      });
      return { added: fresh.length, duplicates, total: queue.length };
    },

    /* ---------------- running ---------------- */

    async start() {
      // Auto-submit off doesn't mean "don't run" — it means every job in this
      // run fills and stops instead of sending (handleReady's canAutoSubmit
      // check already enforces that per job, and restricted platforms like
      // LinkedIn are held to fill-only regardless of this setting anyway).
      // This used to refuse to start the loop at all unless auto-submit was
      // on, which meant the one-click "Auto Apply" button could never do the
      // one thing it's supposed to do with auto-submit left off (the safer,
      // recommended default): open the queued jobs and fill them for review.
      const state = await Engine.getState();
      if (!state.queue.length) await Engine.build();
      await Engine.setState({
        running: true,
        startedAt: Date.now(),
        runId: `run_${Date.now().toString(36)}`,
        lastError: null,
      });
      chrome.alarms.create('careeros:tick', { periodInMinutes: 1 });
      Engine.loop();
      return Engine.getState();
    },

    async stop(reason) {
      await Engine.setState({ running: false, lastError: reason || null });
      chrome.alarms.clear('careeros:tick');
      for (const [tabId] of runtime.tabs) closeTab(tabId);
      runtime.tabs.clear();
      return Engine.getState();
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

          const settings = await Storage.getSettings();
          const usedToday = await Storage.appliedToday();
          if (usedToday >= settings.dailyLimit) {
            await Engine.stop(`Daily cap of ${settings.dailyLimit} reached`);
            notify('CareerOS is done for today', `${usedToday} applications went out.`);
            break;
          }

          const next = pickNext(state.queue, settings);
          if (!next) {
            if (!runtime.tabs.size) {
              await Engine.stop('Queue finished');
              notify('Run finished', summarize(await Engine.getState()));
              break;
            }
            await sleep(2000);
            continue;
          }

          const cap = Policy.concurrencyCap(next.ats, settings);
          const openOnPlatform = [...runtime.tabs.values()].filter((t) => t.job.ats === next.ats).length;
          if (openOnPlatform >= cap || runtime.tabs.size >= Math.max(cap, Number(settings.concurrency) || 3)) {
            await sleep(1500);
            continue;
          }

          // Jitter the gap so a run doesn't tick like a metronome. Restricted
          // platforms watch session shape, and a perfectly regular cadence is
          // the most obvious signal there is.
          runtime.gateUntil.set(next.ats, Date.now() + Policy.jitter(next.ats, settings));
          await mark(next.id, 'running');
          pregenerateAhead(state.queue, settings);

          // Fire and forget: the pool size is what limits concurrency.
          applyTo(next).catch(() => {});
          await sleep(600);
        }
      } finally {
        runtime.loopRunning = false;
      }
    },

    /* ---------------- one application ---------------- */

    async applyTo(job) {
      return applyTo(job);
    },

    /* Called by the worker when a content script announces itself. */
    async handleReady(tabId) {
      const entry = runtime.tabs.get(tabId);
      if (!entry) return null;
      const settings = await Storage.getSettings();
      const permission = Policy.canAutoSubmit(entry.job.ats, settings);

      /* A tailored package means this posting has its own resume, cover letter
         and screening answers, written and approved for it. Without one the
         content script falls back to the base profile. */
      const pkg = await Api.getPackage(entry.job).catch(() => ({ tailored: false }));
      if (pkg && pkg.tailored) {
        entry.job.applicationId = pkg.applicationId;
      }

      // The job was scored and queued against a specific profile (see build()/
      // add()), which may not be whichever profile is globally active — hand
      // the content script that exact profile so it fills from it, without
      // ever flipping which one is active.
      let profileOverride = null;
      if (entry.job.profileId) {
        const profilesData = await Storage.getProfiles();
        if (entry.job.profileId !== profilesData.activeId && profilesData.profiles[entry.job.profileId]) {
          profileOverride = Profile.hydrate(profilesData.profiles[entry.job.profileId]);
        }
      }

      return {
        job: entry.job,
        directive: {
          autoSubmit: permission.allowed,
          policyNote: permission.reason,
          maxSteps: stepsFor(entry.job.ats),
          pregenerated: (pkg && pkg.tailored ? pkg.coverLetter : null) || runtime.pregen.get(entry.job.id) || null,
          tailoredResume: pkg && pkg.tailored ? pkg.resume : null,
          screeningAnswers: (pkg && pkg.tailored ? pkg.screeningAnswers : null) || [],
          profileId: entry.job.profileId || null,
          profileOverride
        }
      };
    },

    async handleResult(tabId, result) {
      const entry = runtime.tabs.get(tabId);
      if (!entry) return;
      clearTimeout(entry.timer);
      runtime.tabs.delete(tabId);
      runtime.pregen.delete(entry.job.id);
      closeTab(tabId);
      await settle(entry.job, result);
      if (entry.resolve) entry.resolve(result);
    },

    /* Step-level progress from a content script mid-run, so the dashboard can
       show "step 3 of 7" instead of a flat "Applying" pill. Fire-and-forget on
       both ends — losing one to a suspended worker is cosmetic. */
    async handleProgress(tabId, progress) {
      const entry = runtime.tabs.get(tabId);
      if (!entry) return;
      entry.progress = progress;
      const state = await Engine.getState();
      const queue = state.queue.map((j) =>
        j.id === entry.job.id ? Object.assign({}, j, { progress }) : j
      );
      await Engine.setState({ queue });
    },

    runtime
  };

  /* ---------------- internals ---------------- */

  /* LinkedIn Easy Apply runs five or six panes; Workday is deeper still. */
  function stepsFor(ats) {
    if (ats === 'workday') return 8;
    if (ats === 'linkedin') return 7;
    if (ats === 'indeed') return 6;
    return 4;
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

  async function applyTo(job) {
    const settings = await Storage.getSettings();

    /* Hidden background tabs are the sane default for an unattended run — fast,
       and out of the way. showApplyTabs is opt-in for someone who wants to
       actually watch a form get filled: a small, unfocused window off to the
       side rather than a fully hidden tab. */
    let tab;
    let windowId = null;
    if (settings.showApplyTabs) {
      const win = await chrome.windows.create({
        url: job.url, type: 'popup', focused: false, width: 420, height: 640, left: 20, top: 20
      });
      tab = (win.tabs || [])[0];
      windowId = win.id;
    } else {
      tab = await chrome.tabs.create({ url: job.url, active: false });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        Engine.handleResult(tab.id, { outcome: 'failed', detail: 'Timed out' });
      }, JOB_TIMEOUT_MS);

      runtime.tabs.set(tab.id, { job, resolve, timer, windowId, progress: null });
    });
  }

  async function settle(job, result) {
    const state = await Engine.getState();
    const stats = state.stats;

    const outcome = result.outcome;
    if (outcome === 'submitted') stats.applied += 1;
    else if (outcome === 'assisted') stats.assisted += 1;
    else if (outcome === 'skipped') stats.skipped += 1;
    else stats.failed += 1;

    const queue = state.queue.map((j) =>
      j.id === job.id ? Object.assign({}, j, { state: outcome, detail: result.detail || null }) : j
    );

    const done = [
      Object.assign({}, job, { state: outcome, detail: result.detail || null, at: Date.now() }),
      ...state.done
    ].slice(0, 300);

    await Engine.setState({ queue, done, stats });

    /* Report to CareerOS so the tracker on the web app is the same list the
       extension is working from. Failing to reach the server must not break
       the run — the local log is still written either way. */
    if (outcome === 'submitted' || outcome === 'assisted') {
      Api.logApplication({
        url: job.url,
        title: job.title,
        company: job.company,
        ats: job.ats,
        matchScore: job.score,
        outcome,
        detail: result.detail || undefined,
      }).catch(() => {});

      if (job.applicationId && outcome === 'submitted') {
        Api.markPackageSubmitted(job.applicationId).catch(() => {});
      }

      await Storage.logApplication({
        url: job.url,
        title: job.title,
        company: job.company,
        ats: job.ats,
        score: job.score,
        status: outcome === 'submitted' ? 'submitted' : 'filled'
      });
    }

    // A login wall or a captcha will hit every job on that platform, so stop
    // rather than burn the queue failing the same way forty times.
    if (result.detail === 'needs_login' || result.detail === 'captcha') {
      await Engine.stop(`${job.ats} needs you: ${result.detail === 'captcha' ? 'a captcha appeared' : 'you are signed out'}`);
      notify('CareerOS paused', `${job.company} asked for something only you can do. Open the tab, sort it, then start again.`);
    }
  }

  async function mark(id, state) {
    const s = await Engine.getState();
    await Engine.setState({
      queue: s.queue.map((j) => (j.id === id ? Object.assign({}, j, { state }) : j))
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

  function closeTab(tabId) {
    chrome.tabs.remove(tabId).catch(() => {});
  }

  function notify(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title,
      message: String(message || '').slice(0, 200)
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
