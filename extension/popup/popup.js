(async function () {
  'use strict';

  const { Storage, Profile, Matcher, SearchUrls } = window.CareerOS;
  const $ = (id) => document.getElementById(id);
  const PALETTE = ['#F46A29', '#2F6FEB', '#16A05A', '#8B5CF6', '#E0457B', '#0EA5A4', '#D97706', '#475569'];

  const profile = Profile.hydrate(await Storage.getProfile());
  let settings = await Storage.getSettings();
  let tabId = null;
  let pollTimer = null;

  $('openSettings').onclick = () => chrome.runtime.openOptionsPage();
  $('goSetup').onclick = () => chrome.runtime.openOptionsPage();
  $('openRun').onclick = () => openOrFocusDashboard();
  setModeLine();

  function setModeLine() {
    $('mode').textContent = settings.autoSubmit ? 'Auto submit is on' : 'Fills forms, you press submit';
  }

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

  function engineCmd(command, extra) {
    return new Promise((resolve) =>
      chrome.runtime.sendMessage(Object.assign({ type: 'careeros:engine', command }, extra || {}), resolve)
    );
  }

  function setLoading(btn, on, label) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    if (label != null) {
      const span = btn.querySelector('span');
      (span || btn).textContent = label;
    }
  }

  function showMsg(text, tone) {
    const el = $('autoApplyMsg');
    if (!text) { el.hidden = true; return; }
    el.hidden = false;
    el.dataset.tone = tone || '';
    el.textContent = text;
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab').forEach((t) => {
    t.onclick = () => showTab(t.dataset.tab);
  });
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.tab === name));
    ['home', 'queue', 'activity'].forEach((p) => { $(`panel-${p}`).hidden = p !== name; });
  }

  /* ---------- not signed in ---------- */
  if (!settings.deviceToken) {
    $('signin').hidden = false;
    $('tagline').textContent = 'Not signed in';
    $('connectBtn').onclick = async () => {
      setLoading($('connectBtn'), true, 'Waiting for approval…');
      $('connectMsg').textContent = 'Approve it in the tab that just opened.';
      const res = await engineCmd('connect');
      setLoading($('connectBtn'), false, 'Sign in');
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
      const fresh = Profile.hydrate(await Storage.getProfile());
      const resume = await Storage.getResume();
      const skillCount = Profile.allSkills(fresh).length;
      $('signin').hidden = true;
      $('fetched').hidden = false;
      $('fetchedList').innerHTML = [
        Profile.fullName(fresh) && `Name: ${esc(Profile.fullName(fresh))}`,
        fresh.identity.email && `Email: ${esc(fresh.identity.email)}`,
        skillCount ? `${skillCount} skill${skillCount === 1 ? '' : 's'}` : null,
        (fresh.targeting.titles || []).length ? `Targeting: ${esc(fresh.targeting.titles.slice(0, 3).join(', '))}` : null,
        resume ? `Resume: ${esc(resume.name || 'attached')}` : null
      ].filter(Boolean).map((i) => `<li>${i}</li>`).join('');
      setTimeout(() => location.reload(), 1600);
    };
    return;
  }

  /* ---------- signed in ---------- */
  $('tabs').hidden = false;
  showTab('home');

  const gaps = Profile.gaps(profile);
  if (!Profile.isReady(profile) || gaps.length) {
    $('setup').hidden = false;
    $('gaps').innerHTML = gaps.map((g) => `<li>${esc(g)}</li>`).join('');
  }
  $('runCard').hidden = false;
  wireRunControls();
  await refresh();
  pollTimer = setInterval(refresh, 1200);
  if (Profile.isReady(profile)) await loadTab();

  /* ---------- permissions ---------- */
  async function ensureApplyPermissions() {
    const { Permissions } = window.CareerOS;
    if (!Permissions) return true;
    const origins = [...Permissions.GROUPS.ats.origins, ...Permissions.GROUPS.boards.origins];
    const granted = await chrome.permissions.request({ origins });
    if (!granted) return false;
    // Wait for content scripts to be registered on the newly granted sites
    // before any job tab can open on one.
    await engineCmd('reregister');
    return true;
  }

  /* ---------- run controls ---------- */
  function wireRunControls() {
    const startBtn = $('autoApplyBtn');
    const stopBtn = $('stopApplyBtn');

    startBtn.onclick = async () => {
      const permOk = await ensureApplyPermissions();
      if (!permOk) {
        showMsg('CareerOS needs access to job sites to fill applications. Press Start again and allow it when Chrome asks.', 'warn');
        return;
      }
      showMsg('');
      setLoading(startBtn, true, 'Finding jobs…');

      const state = await engineCmd('state');
      const queued = state && state.ok ? state.state.queue.filter((j) => j.state === 'queued').length : 0;
      if (!queued) {
        const build = await engineCmd('build');
        if (!build || !build.ok) {
          setLoading(startBtn, false, 'Start Auto Apply');
          showMsg((build && build.error) || 'Could not search for jobs.', 'error');
          return;
        }
        if (!build.queued) {
          setLoading(startBtn, false, 'Start Auto Apply');
          showMsg('No matching jobs found right now. Add target roles in your profile, or add jobs from a LinkedIn or Indeed results page.', 'warn');
          return;
        }
      }

      setLoading(startBtn, true, 'Starting…');
      await engineCmd('start');
      setLoading(startBtn, false, 'Start Auto Apply');
      await refresh();
    };

    stopBtn.onclick = async () => {
      setLoading(stopBtn, true, 'Stopping…');
      await engineCmd('stop');
      setLoading(stopBtn, false, 'Stop applying');
      showMsg('Stopped. Press Start to pick up where you left off.', '');
      await refresh();
    };

    $('findJobsBtn').onclick = async () => {
      const btn = $('findJobsBtn');
      btn.disabled = true;
      btn.textContent = 'Searching…';
      const build = await engineCmd('build');
      btn.disabled = false;
      btn.textContent = 'Find new jobs';
      if (!build || !build.ok) {
        showMsg((build && build.error) || 'Could not search for jobs.', 'error');
      } else if (!build.queued) {
        showMsg(`Searched ${build.found} postings; none matched your targeting well enough.`, 'warn');
      } else {
        showMsg(`${build.queued} job${build.queued === 1 ? '' : 's'} ready in your queue.`, 'ok');
      }
      await refresh();
    };

    $('clearQueueBtn').onclick = async () => {
      await engineCmd('clear');
      showMsg('Queue cleared.', '');
      await refresh();
    };
  }

  /* ---------- live state ---------- */
  async function refresh() {
    settings = await Storage.getSettings();
    setModeLine();
    const stats = await new Promise((resolve) => chrome.runtime.sendMessage({ type: 'careeros:stats' }, resolve));
    if (!stats || !stats.engine) return;
    const s = stats.engine;
    const queue = s.queue || [];
    const queued = queue.filter((j) => j.state === 'queued');
    const running = queue.filter((j) => j.state === 'running');

    // Header status
    const pill = $('statusPill');
    pill.dataset.state = s.running ? 'running' : 'idle';
    $('statusText').textContent = s.running ? 'Applying' : 'Idle';

    // Ring: applications sent today against the daily cap
    const limit = Number(settings.dailyLimit) || 25;
    const today = stats.today || 0;
    $('ringNum').textContent = today;
    $('ringLabel').textContent = `of ${limit} today`;
    $('ring').style.setProperty('--p', Math.min(100, Math.round((today / limit) * 100)));

    // Counters
    $('cQueued').textContent = queued.length;
    $('cSent').textContent = s.stats.applied || 0;
    $('cFilled').textContent = s.stats.assisted || 0;
    $('cFailed').textContent = (s.stats.skipped || 0) + (s.stats.failed || 0);
    $('queueCount').textContent = queued.length;

    // Start / Stop
    $('autoApplyBtn').hidden = s.running;
    $('stopApplyBtn').hidden = !s.running;
    $('clearQueueBtn').disabled = s.running;
    $('findJobsBtn').disabled = s.running;

    if (s.running) {
      $('runHeadline').textContent = 'Applying for you';
      $('runSub').textContent = `${queued.length} left in the queue. You can close this popup; it keeps going.`;
    } else if (queued.length) {
      $('runHeadline').textContent = `${queued.length} job${queued.length === 1 ? '' : 's'} ready`;
      $('runSub').textContent = settings.autoSubmit
        ? 'Press Start and CareerOS fills and submits each one.'
        : 'Press Start and CareerOS fills each one for you to review.';
    } else {
      $('runHeadline').textContent = 'Ready to apply';
      $('runSub').textContent = 'Finds jobs that match your profile and fills each application for you.';
    }

    if (!s.running && s.lastError && $('autoApplyMsg').hidden) showMsg(s.lastError, 'warn');

    // Applying now
    const now = running[0];
    $('nowCard').hidden = !now;
    if (now) {
      $('nowAvatar').textContent = initial(now.company);
      $('nowAvatar').style.background = colorFor(now.company);
      $('nowTitle').textContent = now.title || 'A role';
      $('nowCompany').textContent = [now.company, now.ats].filter(Boolean).join(' · ');
      const p = now.progress;
      const pct = p ? Math.max(8, Math.round((p.step / Math.max(1, p.maxSteps)) * 100)) : 8;
      $('nowBar').style.width = `${pct}%`;
      $('nowStep').textContent = p
        ? `Step ${p.step} of ${p.maxSteps} · ${p.filled} field${p.filled === 1 ? '' : 's'} filled`
        : 'Opening the application…';
    }

    renderQueue(queue);
    renderActivity(s.done || []);
  }

  function renderQueue(queue) {
    const items = queue.filter((j) => j.state === 'queued' || j.state === 'running');
    $('queueEmpty').hidden = items.length > 0;
    $('queueList').innerHTML = items.map((j) => `
      <li class="jobItem">
        <div class="avatar" style="background:${colorFor(j.company)}">${esc(initial(j.company))}</div>
        <div class="jobText">
          <strong>${esc(j.title || 'Untitled role')}</strong>
          <span>${esc([j.company, j.location].filter(Boolean).join(' · '))}</span>
        </div>
        <div class="side">
          ${j.score != null ? `<span class="scoreChip">${j.score}</span>` : ''}
          <span class="pill" data-s="${esc(j.state)}">${j.state === 'running' ? 'Applying' : esc(j.ats || 'Queued')}</span>
        </div>
      </li>`).join('');
  }

  function renderActivity(done) {
    $('activityEmpty').hidden = done.length > 0;
    $('activityList').innerHTML = done.slice(0, 40).map((j) => `
      <li class="jobItem">
        <div class="avatar" style="background:${colorFor(j.company)}">${esc(initial(j.company))}</div>
        <div class="jobText">
          <strong>${esc(j.title || 'Untitled role')}</strong>
          <span>${esc(j.company || '')}</span>
          ${j.detail ? `<span class="detail">${esc(readableDetail(j.detail))}</span>` : ''}
        </div>
        <div class="side">
          <span class="pill" data-s="${esc(j.state)}">${esc(stateLabel(j.state))}</span>
          <span class="time">${esc(timeAgo(j.at))}</span>
        </div>
      </li>`).join('');
  }

  function stateLabel(s) {
    return { submitted: 'Sent', assisted: 'Filled', skipped: 'Skipped', failed: 'Failed', running: 'Applying' }[s] || s;
  }

  function readableDetail(d) {
    const map = {
      captcha: 'Site blocks automated applications — skipped',
      needs_login: 'Site asked you to sign in',
      closed: 'Posting is closed',
      no_apply_button: 'No apply button on the page',
      external_apply: 'Applies on the employer site',
      modal_did_not_open: 'The apply form did not open',
      form_did_not_open: 'The apply form did not open',
    };
    return map[d] || d;
  }

  /* ---------- the current tab ---------- */
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
    return ask({ type: 'careeros:ping' });
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
    const title = (profile.targeting.titles || [])[0];
    if (!title) return;
    $('idle').hidden = false;
    const liBtn = $('searchPosition');
    const inBtn = $('searchPositionIndeed');
    liBtn.hidden = false;
    liBtn.onclick = () => chrome.tabs.create({ url: SearchUrls.linkedin(profile, settings) });
    inBtn.hidden = false;
    inBtn.onclick = () => chrome.tabs.create({ url: SearchUrls.indeed(profile, settings) });
  }

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
    }

    const fill = $('fillNow');
    fill.textContent = match.score < settings.minMatchScore ? 'Fill anyway' : 'Fill this application';
    fill.onclick = async () => {
      setLoading(fill, true, 'Filling…');
      const res = await ask({ type: 'careeros:fill', profileId: selectedProfileId });
      setLoading(fill, false, 'Fill again');
      renderFillResult(res, snap);
      refresh();
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
        setLoading(submit, true, 'Submitting…');
        const sres = await ask({ type: 'careeros:submit' });
        setLoading(submit, false, 'Submit');
        out.dataset.tone = sres && sres.confirmed ? 'ok' : 'warn';
        out.textContent = sres && sres.ok
          ? (sres.confirmed ? 'Submitted and logged.' : 'Pressed submit — check the page confirmed it.')
          : (sres && sres.error) || 'Could not submit.';
        refresh();
      };
    } else if (!snap.canSubmit && snap.submitNote) {
      out.textContent += ` ${snap.submitNote}.`;
    }
  }

  function showSearch(snap) {
    $('search').hidden = false;
    $('harvestCount').textContent = snap.harvest.count;
    $('harvestMeta').textContent = `${snap.harvest.easy} with Easy Apply · ${snap.policyLabel}`;

    const btn = $('queueThese');
    btn.textContent = `Add ${snap.harvest.count} to queue`;
    btn.onclick = async () => {
      setLoading(btn, true, 'Adding…');
      const collected = await ask({ type: 'careeros:harvest' });
      if (!collected || !collected.ok) {
        setLoading(btn, false, 'Try again');
        return;
      }
      const res = await engineCmd('add', { jobs: collected.jobs });
      setLoading(btn, false, `Add ${collected.jobs.length} to queue`);
      const out = $('queueResult');
      out.hidden = false;
      out.dataset.tone = res && res.ok ? 'ok' : 'error';
      out.textContent = res && res.ok
        ? `Added ${res.added}${res.duplicates ? `, ${res.duplicates} already queued or skipped` : ''}. ${res.total} in your queue.`
        : 'Could not reach the queue.';
      refresh();
    };
  }

  /* ---------- helpers ---------- */
  function initial(name) {
    return (String(name || '?').trim()[0] || '?').toUpperCase();
  }

  function colorFor(name) {
    const s = String(name || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return PALETTE[Math.abs(h) % PALETTE.length];
  }

  function timeAgo(at) {
    if (!at) return '';
    const sec = Math.round((Date.now() - at) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
    return `${Math.round(sec / 86400)}d ago`;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  window.addEventListener('unload', () => clearInterval(pollTimer));
})();
