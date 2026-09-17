(async function () {
  'use strict';

  const { Policy, Storage } = window.CareerOS;
  const $ = (id) => document.getElementById(id);
  let settings = await Storage.getSettings();

  const cmd = (command) =>
    new Promise((resolve) => chrome.runtime.sendMessage({ type: 'careeros:engine', command }, resolve));

  $('findJobs').onclick = async () => {
    setBusy($('findJobs'), 'Searching…');
    const res = await cmd('build');
    setBusy($('findJobs'), 'Just find jobs', false);
    if (!res || !res.ok) return note(`Search failed: ${(res && res.error) || 'no response'}`);
    if (res.errors && res.errors.length) note(`Some sources failed: ${res.errors.join(' · ')}`);
    else if (!res.queued) note(`Found ${res.found} postings but none cleared your match threshold. Lower it, or widen your target roles.`);
    else hideNote();
    refresh();
  };

  $('autoApplyNow').onclick = async () => {
    setBusy($('autoApplyNow'), 'Searching…');
    const build = await cmd('build');
    if (!build || !build.ok) {
      setBusy($('autoApplyNow'), 'Auto Apply Now', false);
      return note(`Search failed: ${(build && build.error) || 'no response'}`);
    }
    if (!build.queued) {
      setBusy($('autoApplyNow'), 'Auto Apply Now', false);
      note(`Found ${build.found} postings but none cleared your match threshold. Lower it, or widen your target roles.`);
      return refresh();
    }
    setBusy($('autoApplyNow'), 'Starting…');
    const res = await cmd('start');
    setBusy($('autoApplyNow'), 'Auto Apply Now', false);
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

    $('runState').dataset.on = s.running ? 'running' : '';
    $('runState').textContent = s.running ? 'Running' : 'Idle';
    $('autoApplyNow').hidden = s.running;
    $('findJobs').hidden = s.running;
    $('stopRun').hidden = !s.running;

    $('cQueued').textContent = s.queue.filter((j) => j.state === 'queued').length;
    $('cApplied').textContent = s.stats.applied;
    $('cAssisted').textContent = s.stats.assisted;
    $('cSkipped').textContent = s.stats.skipped;
    $('cFailed').textContent = s.stats.failed;

    if (s.lastError && !s.running) note(s.lastError);
    else if (s.running && !settings.autoSubmit) {
      note('Auto-submit is off — CareerOS is filling each application and pausing for you to review and press submit. Turn on "Submit without asking me first" in Settings for a hands-off run.');
    } else if (s.running) hideNote();

    const rows = s.queue;
    $('queueEmpty').hidden = rows.length > 0;
    $('queueBody').innerHTML = rows.map(row).join('');
  }

  function row(j) {
    const policy = Policy.for(j.ats, settings);
    return `<tr>
      <td class="num"><span class="scoreChip" data-high="${j.score >= 85 ? 1 : 0}">${j.score}</span></td>
      <td class="role">${esc(j.title)}${j.detail ? `<small>${esc(j.detail)}</small>` : ''}</td>
      <td class="dim">${esc(j.company)}</td>
      <td class="dim">${esc(j.location || '—')}</td>
      <td class="dim">${esc(j.ats)}<br><span class="pill">${esc(Policy.label(policy.mode))}</span></td>
      <td><span class="pill" data-s="${esc(j.state)}">${esc(stateLabel(j.state))}</span></td>
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

  refresh();
  setInterval(refresh, 2500);
})();
