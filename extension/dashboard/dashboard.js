(async function () {
  'use strict';

  const { Policy, Storage } = window.CareerOS;
  const $ = (id) => document.getElementById(id);
  let settings = await Storage.getSettings();

  const cmd = (command) =>
    new Promise((resolve) => chrome.runtime.sendMessage({ type: 'careeros:engine', command }, resolve));

  /* ---------- live activity feed ----------
     Derived from state transitions between polls, not a dump of the queue —
     one line per thing that actually happened, newest first. */
  let feed = [];
  let prevById = new Map();
  let pollTimer = null;

  function pushFeed(text, tone) {
    feed.unshift({ text, at: Date.now(), tone });
    feed = feed.slice(0, 200);
    renderFeed();
  }

  function renderFeed() {
    $('feedEmpty').hidden = feed.length > 0;
    $('feed').innerHTML = feed.map((f) => `<li data-tone="${f.tone || ''}">
      <time>${new Date(f.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>${esc(f.text)}
    </li>`).join('');
  }

  function jobLabel(j) {
    return `${j.title || 'a role'}${j.company ? ` @ ${j.company}` : ''}`;
  }

  function diffAndLog(queue) {
    queue.forEach((j) => {
      const prev = prevById.get(j.id);

      if ((!prev || prev.state !== j.state) && j.state === 'running') {
        pushFeed(`Applying — ${jobLabel(j)}…`, 'active');
      } else if (prev && prev.state !== j.state) {
        if (j.state === 'submitted') pushFeed(`Submitted — ${jobLabel(j)}`, 'ok');
        else if (j.state === 'assisted') pushFeed(`Filled, ready for you to submit — ${jobLabel(j)}`, 'ok');
        else if (j.state === 'skipped') pushFeed(`Skipped — ${jobLabel(j)}${j.detail ? `: ${j.detail}` : ''}`, 'warn');
        else if (j.state === 'failed') pushFeed(`Failed — ${jobLabel(j)}${j.detail ? `: ${j.detail}` : ''}`, 'error');
      } else if (j.state === 'running' && j.progress
        && (!prev || !prev.progress || prev.progress.step !== j.progress.step)) {
        pushFeed(`${jobLabel(j)} — step ${j.progress.step} of ${j.progress.maxSteps}, ${j.progress.filled} field${j.progress.filled === 1 ? '' : 's'} filled`, 'active');
      }
    });
    prevById = new Map(queue.map((j) => [j.id, j]));
  }

  $('findJobs').onclick = async () => {
    setBusy($('findJobs'), 'Searching…');
    const res = await cmd('build');
    setBusy($('findJobs'), 'Find jobs', false);
    if (!res || !res.ok) return note(`Search failed: ${(res && res.error) || 'no response'}`);
    if (res.errors && res.errors.length) note(`Some sources failed: ${res.errors.join(' · ')}`);
    else if (!res.queued) note(`Found ${res.found} postings but none cleared your match threshold. Lower it, or widen your target roles.`);
    else hideNote();
    refresh();
  };

  $('startRun').onclick = async () => {
    const res = await cmd('start');
    if (res && res.state && res.state.lastError && !res.state.running) note(res.state.lastError);
    refresh();
  };

  $('stopRun').onclick = async () => { await cmd('stop'); refresh(); };
  $('clearQueue').onclick = async () => { await cmd('clear'); hideNote(); refresh(); };

  function setBusy(btn, label, busy) {
    btn.textContent = label;
    btn.disabled = busy !== false;
  }

  function note(text) {
    $('engineNote').hidden = false;
    $('engineNote').textContent = text;
  }
  function hideNote() { $('engineNote').hidden = true; }

  async function refresh() {
    settings = await Storage.getSettings();
    const res = await cmd('state');
    if (!res || !res.ok) return;
    const s = res.state;

    diffAndLog(s.queue);

    $('runState').dataset.on = s.running ? 'running' : '';
    $('runState').textContent = s.running ? 'Running' : 'Idle';
    $('startRun').hidden = s.running;
    $('startRun').disabled = !s.queue.length;
    $('stopRun').hidden = !s.running;

    $('cQueued').textContent = s.queue.filter((j) => j.state === 'queued').length;
    $('cApplied').textContent = s.stats.applied;
    $('cAssisted').textContent = s.stats.assisted;
    $('cSkipped').textContent = s.stats.skipped;
    $('cFailed').textContent = s.stats.failed;

    if (s.lastError && !s.running) note(s.lastError);

    const rows = s.queue;
    $('queueEmpty').hidden = rows.length > 0;
    $('queueBody').innerHTML = rows.map(row).join('');

    // Poll tight while something is actually happening, and back off to a
    // cheap idle cadence otherwise.
    clearTimeout(pollTimer);
    pollTimer = setTimeout(refresh, s.running ? 900 : 2500);
  }

  function row(j) {
    const policy = Policy.for(j.ats, settings);
    const stateCell = (j.state === 'running' && j.progress)
      ? `<span class="pill" data-s="running">Applying</span>
         <div class="progressBar"><span style="width:${Math.round((j.progress.step / Math.max(1, j.progress.maxSteps)) * 100)}%"></span></div>
         <small>step ${j.progress.step} of ${j.progress.maxSteps}</small>`
      : `<span class="pill" data-s="${esc(j.state)}">${esc(stateLabel(j.state))}</span>`;
    return `<tr>
      <td class="num"><span class="scoreChip" data-high="${j.score >= 85 ? 1 : 0}">${j.score}</span></td>
      <td class="role">${esc(j.title)}${j.detail ? `<small>${esc(j.detail)}</small>` : ''}</td>
      <td class="dim">${esc(j.company)}</td>
      <td class="dim">${esc(j.location || '—')}</td>
      <td class="dim">${esc(j.ats)}<br><span class="pill">${esc(Policy.label(policy.mode))}</span></td>
      <td>${stateCell}</td>
    </tr>`;
  }

  function stateLabel(s) {
    return {
      queued: 'Queued',
      running: 'Applying',
      submitted: 'Submitted',
      assisted: 'Filled',
      skipped: 'Needs you',
      failed: 'Failed'
    }[s] || s;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  renderFeed();
  refresh();
})();
