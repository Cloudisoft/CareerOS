(async function () {
  'use strict';

  const { Storage, Profile, Matcher, Policy } = window.CareerOS;
  const $ = (id) => document.getElementById(id);

  const profile = Profile.hydrate(await Storage.getProfile());
  const settings = await Storage.getSettings();
  let tabId = null;

  $('openSettings').onclick = () => chrome.runtime.openOptionsPage();
  $('goSetup').onclick = () => chrome.runtime.openOptionsPage();
  $('openRun').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  $('mode').textContent = settings.autoSubmit ? 'Auto submit is on' : 'Review before submit';

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
      if (res && res.ok) {
        $('connectMsg').textContent = 'Signed in. Reopen this to continue.';
        window.close();
      } else {
        $('connectMsg').textContent = (res && res.error) || 'Could not sign in.';
      }
    };
    return;
  }

  const gaps = Profile.gaps(profile);
  if (!Profile.isReady(profile) || gaps.length) {
    $('setup').hidden = false;
    $('gaps').innerHTML = gaps.map((g) => `<li>${esc(g)}</li>`).join('');
    if (!Profile.isReady(profile)) $('tagline').textContent = 'Setup needed';
  }

  await loadStats();
  if (Profile.isReady(profile)) await loadTab();

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

  function showIdle() { $('idle').hidden = false; }

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

    const fill = $('fillNow');
    fill.textContent = match.score < settings.minMatchScore ? 'Fill anyway' : 'Fill this application';
    fill.onclick = async () => {
      fill.disabled = true;
      fill.textContent = 'Filling…';
      const res = await ask({ type: 'careeros:fill' });
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
