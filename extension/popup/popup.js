(async function () {
  'use strict';

  const { Storage, Profile, Matcher, Policy, SearchUrls } = window.CareerOS;
  const $ = (id) => document.getElementById(id);

  const profile = Profile.hydrate(await Storage.getProfile());
  const settings = await Storage.getSettings();
  let tabId = null;

  $('openSettings').onclick = () => chrome.runtime.openOptionsPage();
  $('goSetup').onclick = () => chrome.runtime.openOptionsPage();
  $('openRun').onclick = () => openOrFocusDashboard();
  $('mode').textContent = settings.autoSubmit ? 'Auto submit is on' : 'Review before submit';

  /* The dashboard is where a run is actually watched, so every path that
     starts one — this icon button and Auto Apply below — reuses the same
     open-or-focus rather than piling up duplicate tabs. */
  async function openOrFocusDashboard() {
    const url = chrome.runtime.getURL('dashboard/dashboard.html');
    const tabs = await chrome.tabs.query({ url: `${url}*` });
    if (tabs.length) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      if (tabs[0].windowId != null) chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url });
    }
  }

  function engineCmd(command) {
    return new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command }, resolve)
    );
  }

  /* Not signed in is the first thing to resolve. Everything else in the popup
     is meaningless until it is done, so nothing else renders. */
  if (!settings.deviceToken) {
    $('signin').hidden = false;
    $('tagline').textContent = 'Not signed in';
    $('connectBtn').onclick = async () => {
      $('connectBtn').disabled = true;
      $('connectBtn').textContent = 'Waiting for approval…';
      $('connectMsg').textContent = 'Approve it in the tab that just opened.';

      const res = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'connect' }, resolve)
      );

      $('connectBtn').disabled = false;
      $('connectBtn').textContent = 'Sign in';
      if (!res || !res.ok) {
        $('connectMsg').textContent = (res && res.error) || 'Could not sign in.';
        return;
      }

      $('connectMsg').textContent = 'Signed in. Pulling your profile…';
      const sync = await engineCmd('sync');
      if (!sync || sync.ok === false || sync.entitled === false) {
        $('connectMsg').textContent = (sync && sync.message) || 'Signed in. Reopen this to continue.';
        return;
      }

      $('signin').hidden = true;
      $('fetched').hidden = false;
      const fresh = Profile.hydrate(await Storage.getProfile());
      const skillCount = Profile.allSkills(fresh).length;
      $('fetchedList').innerHTML = [
        Profile.fullName(fresh) && `Name: ${esc(Profile.fullName(fresh))}`,
        skillCount ? `${skillCount} skill${skillCount === 1 ? '' : 's'}` : null,
        (fresh.targeting.titles || []).length ? `Targeting: ${esc(fresh.targeting.titles.slice(0, 3).join(', '))}` : null
      ].filter(Boolean).map((i) => `<li>${i}</li>`).join('');
      setUpAutoApply();
    };
    return;
  }

  const gaps = Profile.gaps(profile);
  if (!Profile.isReady(profile) || gaps.length) {
    $('setup').hidden = false;
    $('gaps').innerHTML = gaps.map((g) => `<li>${esc(g)}</li>`).join('');
    if (!Profile.isReady(profile)) $('tagline').textContent = 'Setup needed';
  } else {
    setUpAutoApply();
  }

  await loadStats();
  if (Profile.isReady(profile)) await loadTab();

  /* One click: find live postings, then apply through the queue, then take
     the person to the dashboard where the run actually plays out. Signed in
     and ready is the only requirement — it works the same from any tab. */
  /* CareerOS can only fill a form on a site Chrome has actually granted it
     access to — those grants are optional (see lib/permissions.js) so the
     install prompt stays small. Someone who only ever turned on LinkedIn
     from Settings gets a queue full of Greenhouse/Lever/Workday postings
     that silently do nothing, because no content script is registered
     there. Ask for the real apply surface (employer ATS + boards) right
     here, at the one moment it's a genuine user gesture, instead of
     hoping people find the toggle on the Account tab first. */
  async function ensureApplyPermissions() {
    const { Permissions } = window.CareerOS;
    if (!Permissions) return true;
    const origins = [...Permissions.GROUPS.ats.origins, ...Permissions.GROUPS.boards.origins];
    const granted = await chrome.permissions.request({ origins });
    if (!granted) return false;
    // Granting access doesn't inject the content script by itself — that's a
    // separate registerContentScripts() call the background makes in
    // response to chrome.permissions.onAdded, fired-and-forgotten. Without
    // waiting for it here, build()/start() below can open a job tab before
    // the script list actually includes flows.js/careeros.js for this
    // origin, and the run crashes with "Flows is undefined" instead of
    // ever filling anything. Wait for it explicitly before proceeding.
    await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'reregister' }, resolve)
    );
    return true;
  }

  function setUpAutoApply() {
    $('autoApplySection').hidden = false;
    const btn = $('autoApplyBtn');
    const msg = $('autoApplyMsg');

    btn.onclick = async () => {
      const permOk = await ensureApplyPermissions();
      btn.disabled = true;
      msg.textContent = '';
      if (!permOk) {
        btn.disabled = false;
        msg.textContent = 'CareerOS needs permission to fill forms on job sites. Click Auto Apply again and allow access when Chrome asks.';
        return;
      }
      btn.textContent = 'Finding jobs…';

      const build = await engineCmd('build');
      if (!build || !build.ok) {
        btn.disabled = false;
        btn.textContent = 'Auto Apply';
        msg.textContent = (build && build.error) || 'Could not search for jobs.';
        return;
      }

      if (!build.queued) {
        btn.disabled = false;
        btn.textContent = 'Auto Apply';
        msg.textContent = 'No matching jobs found right now. Widen your targeting or check back later.';
        return;
      }

      // Auto-submit off doesn't block the run — CareerOS still opens every
      // queued job and fills it, it just stops short of sending. Restricted
      // boards (LinkedIn, Indeed, etc.) always fill-and-stop either way.
      const current = await Storage.getSettings();
      btn.textContent = current.autoSubmit ? 'Applying…' : 'Filling forms…';
      await engineCmd('start');
      await openOrFocusDashboard();
      window.close();
    };
  }

  async function loadTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return showIdle();
    tabId = tab.id;

    const snap = await ping();
    if (!snap || !snap.ok) return showIdle();

    if (snap.kind === 'search') return showSearch(snap);
    if (snap.kind === 'posting') return showPosting(snap);
    showIdle();
  }

  function ping() {
    return new Promise((resolve) =>
      chrome.tabs.sendMessage(tabId, { type: 'careeros:ping' }, (res) => {
        void chrome.runtime.lastError;
        resolve(res);
      })
    );
  }

  function ask(message) {
    return new Promise((resolve) =>
      chrome.tabs.sendMessage(tabId, message, (res) => {
        void chrome.runtime.lastError;
        resolve(res);
      })
    );
  }

  function showIdle() {
    $('idle').hidden = false;
    const title = (profile.targeting.titles || [])[0];

    const liBtn = $('searchPosition');
    const inBtn = $('searchPositionIndeed');
    if (!title) { liBtn.hidden = true; inBtn.hidden = true; return; }

    liBtn.hidden = false;
    liBtn.onclick = () => {
      chrome.tabs.create({ url: SearchUrls.linkedin(profile, settings) });
    };

    inBtn.hidden = false;
    inBtn.onclick = () => {
      chrome.tabs.create({ url: SearchUrls.indeed(profile, settings) });
    };
  }

  /* ---------- a single posting ---------- */

  function showPosting(snap) {
    const { posting, match } = snap;
    const verdict = Matcher.verdict(match.score, settings.minMatchScore);

    $('posting').hidden = false;
    $('scoreNum').textContent = match.blocked ? '—' : match.score;
    $('verdictLabel').textContent = match.blocked ? 'On your skip list' : verdict.label;
    $('jobTitle').textContent = [posting.title, posting.company].filter(Boolean).join(' · ');
    $('reasons').innerHTML = (match.blocked ? match.blockers : match.reasons)
      .slice(0, 4).map((r) => `<li>${esc(r)}</li>`).join('');

    $('policyLine').textContent = `${snap.atsLabel} · ${snap.policyLabel}`;

    // More than one profile: show which one actually fits this posting best,
    // and let the person fill with that one instead of whichever is active.
    const picker = $('profilePicker');
    const bestFit = $('bestFit');
    let selectedProfileId = null;
    if (snap.matchAll && snap.matchAll.length > 1) {
      const best = snap.matchAll[0];
      bestFit.hidden = false;
      bestFit.textContent = `Best fit: ${best.profileName} (${best.score})`;
      picker.hidden = false;
      picker.innerHTML = snap.matchAll.map((m) =>
        `<option value="${esc(m.profileId)}">${esc(m.profileName)} — ${m.score}</option>`
      ).join('');
      picker.value = best.profileId;
      selectedProfileId = best.profileId;
      picker.onchange = () => { selectedProfileId = picker.value; };
    } else {
      bestFit.hidden = true;
      picker.hidden = true;
    }

    const fill = $('fillNow');
    fill.textContent = match.score < settings.minMatchScore ? 'Fill anyway' : 'Fill this application';
    fill.onclick = async () => {
      fill.disabled = true;
      fill.textContent = 'Filling…';
      const res = await ask({ type: 'careeros:fill', profileId: selectedProfileId });
      fill.disabled = false;
      fill.textContent = 'Fill again';
      renderFillResult(res, snap);
      loadStats();
    };

    if (snap.report) renderFillResult({ ok: true, report: snap.report }, snap);
  }

  function renderFillResult(res, snap) {
    const out = $('fillResult');
    out.hidden = false;

    if (!res || !res.ok) {
      out.dataset.tone = 'error';
      out.textContent = (res && res.error) || 'Could not fill this form.';
      return;
    }

    const r = res.report;
    const parts = [`Filled ${r.filled} of ${r.total} fields.`];
    if (r.generated) parts.push(`${r.generated} written for you.`);
    out.dataset.tone = r.needsYouCount ? 'warn' : 'ok';
    out.textContent = parts.join(' ');

    if (r.needsYouCount) {
      $('needsYou').hidden = false;
      $('needsYou').innerHTML = `<li class="needsHead">${r.needsYouCount} required field${r.needsYouCount > 1 ? 's need' : ' needs'} you</li>` +
        r.needsYou.map((n) => `<li>${esc(n)}</li>`).join('');
    }

    if (snap.canSubmit && !r.needsYouCount) {
      const submit = $('submitNow');
      submit.hidden = false;
      submit.onclick = async () => {
        submit.disabled = true;
        submit.textContent = 'Submitting…';
        const sres = await ask({ type: 'careeros:submit' });
        submit.textContent = 'Submit';
        submit.disabled = false;
        out.dataset.tone = sres && sres.confirmed ? 'ok' : 'warn';
        out.textContent = sres && sres.ok
          ? (sres.confirmed ? 'Submitted and logged.' : 'Pressed submit — check the page confirmed it.')
          : (sres && sres.error) || 'Could not submit.';
        loadStats();
      };
    } else if (!snap.canSubmit) {
      out.textContent += ` ${snap.submitNote}.`;
    }
  }

  /* ---------- a results page ---------- */

  function showSearch(snap) {
    $('search').hidden = false;
    $('harvestCount').textContent = snap.harvest.count;
    $('harvestMeta').textContent = `${snap.harvest.easy} apply in place · ${snap.policyLabel}`;

    const btn = $('queueThese');
    btn.textContent = `Queue these ${snap.harvest.count}`;
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = 'Queueing…';
      const collected = await ask({ type: 'careeros:harvest' });
      if (!collected || !collected.ok) {
        btn.disabled = false;
        btn.textContent = 'Try again';
        return;
      }
      const res = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'add', jobs: collected.jobs }, resolve)
      );
      btn.disabled = false;
      btn.textContent = `Queue these ${collected.jobs.length}`;
      const out = $('queueResult');
      out.hidden = false;
      out.dataset.tone = res && res.ok ? 'ok' : 'error';
      out.textContent = res && res.ok
        ? `Added ${res.added}, skipped ${res.duplicates} already seen. ${res.total} in the queue.`
        : 'Could not reach the queue.';
    };
  }

  /* ---------- stats ---------- */

  async function loadStats() {
    const stats = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:stats' }, resolve)
    );
    if (!stats) return;
    $('statToday').textContent = stats.today;
    $('statSubmitted').textContent = stats.submitted;
    $('statTotal').textContent = stats.total;

    if (!stats.recent.length) { $('recentEmpty').hidden = false; return; }
    $('recentEmpty').hidden = true;
    $('recent').innerHTML = stats.recent.map((a) => `<li>
      <span class="rTitle">${esc(a.title || 'Untitled role')}<br><span class="rCo">${esc(a.company || '')}</span></span>
      <span class="rState" data-s="${esc(a.status)}">${a.status === 'submitted' ? 'Sent' : 'Filled'}</span>
    </li>`).join('');
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }
})();
