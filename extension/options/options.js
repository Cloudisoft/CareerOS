(async function () {
  'use strict';

  const { Storage, Profile } = window.CareerOS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let profile = Profile.hydrate(await Storage.getProfile());
  let settings = await Storage.getSettings();
  let saveTimer = null;

  /* ---------- profiles ---------- */
  let profilesData = await Storage.getProfiles();

  function renderProfileBar() {
    const ids = Object.keys(profilesData.profiles);
    $('#profileSelect').innerHTML = ids.map((id) => {
      const p = profilesData.profiles[id];
      return `<option value="${attr(id)}"${id === profilesData.activeId ? ' selected' : ''}>${esc(p.name || 'Untitled')}</option>`;
    }).join('');
    $('#deleteProfile').disabled = ids.length <= 1;
  }

  $('#profileSelect').onchange = async () => {
    await Storage.setActiveProfile($('#profileSelect').value);
    location.reload();
  };

  $('#newProfile').onclick = async () => {
    const name = prompt('Name this profile', 'New profile');
    if (name == null) return;
    const created = await Storage.createProfile(name.trim() || 'New profile');
    await Storage.setActiveProfile(created.id);
    location.reload();
  };

  $('#duplicateProfile').onclick = async () => {
    const current = profilesData.profiles[profilesData.activeId];
    const name = prompt('Name for the copy', `${(current && current.name) || 'Profile'} copy`);
    if (name == null) return;
    const copy = await Storage.duplicateProfile(profilesData.activeId, name.trim());
    if (!copy) return;
    await Storage.setActiveProfile(copy.id);
    location.reload();
  };

  $('#renameProfile').onclick = async () => {
    const current = profilesData.profiles[profilesData.activeId];
    const name = prompt('Rename this profile', (current && current.name) || '');
    if (name == null || !name.trim()) return;
    profile.name = name.trim();
    await Storage.saveProfile(profile);
    renderProfileBar();
    flagSaved();
  };

  $('#deleteProfile').onclick = async () => {
    const current = profilesData.profiles[profilesData.activeId];
    if (!confirm(`Delete the profile "${(current && current.name) || 'this profile'}"? There is no undo.`)) return;
    const res = await Storage.deleteProfile(profilesData.activeId);
    if (!res.ok) { alert(res.error); return; }
    location.reload();
  };

  renderProfileBar();

  /* ---------- tabs ---------- */
  $$('.tab').forEach((tab) => {
    tab.onclick = () => {
      $$('.tab').forEach((t) => t.classList.toggle('is-on', t === tab));
      $$('.panel').forEach((p) => p.classList.toggle('is-on', p.id === `panel-${tab.dataset.panel}`));
    };
  });

  /* ---------- binding ---------- */
  function read(path) {
    return path.split('.').reduce((a, k) => (a == null ? a : a[k]), profile);
  }
  function write(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((a, k) => (a[k] = a[k] || {}), profile);
    target[last] = value;
  }

  $$('[data-bind]').forEach((el) => {
    const path = el.dataset.bind;
    const value = read(path);

    if (el.type === 'checkbox') el.checked = Boolean(value);
    else if (el.dataset.list !== undefined) el.value = (value || []).join(', ');
    else if (el.dataset.lines !== undefined) el.value = (value || []).join('\n');
    else el.value = value == null ? '' : value;

    el.addEventListener('input', () => {
      if (el.type === 'checkbox') write(path, el.checked);
      else if (el.dataset.list !== undefined) write(path, splitList(el.value));
      else if (el.dataset.lines !== undefined) write(path, splitLines(el.value));
      else if (el.type === 'number' || el.dataset.number !== undefined) write(path, el.value === '' ? 0 : Number(el.value));
      else write(path, el.value);
      queueSave();
    });
  });

  $$('[data-setting]').forEach((el) => {
    const key = el.dataset.setting;
    if (el.type === 'checkbox') el.checked = Boolean(settings[key]);
    else el.value = settings[key] == null ? '' : settings[key];

    el.addEventListener('input', async () => {
      const value = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value);
      settings[key] = value;
      await Storage.saveSettings({ [key]: value });
      if (key === 'acknowledgedRestricted') renderPlatforms();
      flagSaved();
    });
  });

  function splitList(v) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  function splitLines(v) {
    return v.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  function queueSave() {
    setState('saving', 'Saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await Storage.saveProfile(profile);
      flagSaved();
    }, 450);
  }
  function flagSaved() { setState('saved', 'Saved'); }
  function setState(kind, text) {
    const el = $('#saveState');
    el.dataset.on = kind;
    el.textContent = text;
  }

  /* ---------- repeaters ---------- */
  const ROLE_FIELDS = [
    ['title', 'Title'], ['company', 'Company'], ['start', 'Start'],
    ['end', 'End'], ['location', 'Location']
  ];
  const EDU_FIELDS = [
    ['degree', 'Degree'], ['field', 'Field'], ['school', 'School'], ['year', 'Year']
  ];

  function renderRoles() {
    const host = $('#roles');
    host.innerHTML = '';
    profile.experience.history.forEach((role, i) => {
      const entry = document.createElement('div');
      entry.className = 'entry';
      entry.innerHTML = `
        <button class="remove" title="Remove">×</button>
        <div class="grid">
          ${ROLE_FIELDS.map(([k, label]) =>
            `<label>${label}<input value="${attr(role[k])}" data-k="${k}"></label>`).join('')}
          <label class="wide">What you did there
            <textarea rows="3" data-k="bullets" placeholder="One per line">${esc((role.bullets || []).join('\n'))}</textarea>
          </label>
        </div>`;
      entry.querySelector('.remove').onclick = () => {
        profile.experience.history.splice(i, 1);
        renderRoles();
        queueSave();
      };
      $$('[data-k]', entry).forEach((input) => {
        input.oninput = () => {
          const k = input.dataset.k;
          role[k] = k === 'bullets' ? splitLines(input.value) : input.value;
          queueSave();
        };
      });
      host.appendChild(entry);
    });
  }

  function renderEdu() {
    const host = $('#education');
    host.innerHTML = '';
    profile.education.forEach((edu, i) => {
      const entry = document.createElement('div');
      entry.className = 'entry';
      entry.innerHTML = `
        <button class="remove" title="Remove">×</button>
        <div class="grid">
          ${EDU_FIELDS.map(([k, label]) =>
            `<label>${label}<input value="${attr(edu[k])}" data-k="${k}"></label>`).join('')}
        </div>`;
      entry.querySelector('.remove').onclick = () => {
        profile.education.splice(i, 1);
        renderEdu();
        queueSave();
      };
      $$('[data-k]', entry).forEach((input) => {
        input.oninput = () => { edu[input.dataset.k] = input.value; queueSave(); };
      });
      host.appendChild(entry);
    });
  }

  $('#addRole').onclick = () => {
    profile.experience.history.push({ title: '', company: '', start: '', end: '', location: '', bullets: [] });
    renderRoles();
  };
  $('#addEdu').onclick = () => {
    profile.education.push({ degree: '', field: '', school: '', year: '' });
    renderEdu();
  };

  renderRoles();
  renderEdu();

  /* ---------- site access ---------- */
  const SITE_GROUPS = {
    ats: {
      label: 'Employer application systems',
      description: 'Greenhouse, Lever, Ashby, Workday and the rest. This is where most applications are actually submitted, and where CareerOS can apply on its own.',
      recommended: true,
    },
    boards: {
      label: 'Job boards',
      description: 'LinkedIn, Indeed, ZipRecruiter, Dice, Glassdoor. CareerOS fills forms here but does not submit them.',
      recommended: false,
    },
    search: {
      label: 'Job search APIs',
      description: 'Only needed if you add your own Adzuna, JSearch or USAJobs keys.',
      recommended: false,
    },
  };

  async function renderSiteGroups() {
    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'permissions' }, resolve)
    );
    const granted = (res && res.granted) || {};

    $('#siteGroups').innerHTML = Object.entries(SITE_GROUPS).map(([key, g]) => `
      <div class="platformRow">
        <div>
          <span class="pName">${esc(g.label)}</span>
          <span class="pNote">${esc(g.description)}</span>
        </div>
        <button class="${granted[key] ? 'ghost' : 'btn'}" data-site="${key}">
          ${granted[key] ? 'Turn off' : (g.recommended ? 'Turn on (recommended)' : 'Turn on')}
        </button>
      </div>`).join('');

    $$('#siteGroups button').forEach((btn) => {
      btn.onclick = async () => {
        const key = btn.dataset.site;
        /* chrome.permissions.request must be called from the click itself, not
           from a message round-trip, or Chrome refuses it and it looks to the
           user like they declined. */
        const { GROUPS } = window.CareerOS.Permissions;
        const origins = GROUPS[key].origins;

        if (granted[key]) {
          await chrome.permissions.remove({ origins });
        } else {
          const ok = await chrome.permissions.request({ origins });
          if (!ok) return;
        }
        await new Promise((r) => chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'reregister' }, r));
        renderSiteGroups();
      };
    });
  }

  renderSiteGroups();

  /* ---------- pairing ---------- */
  const paired = Boolean(settings.deviceToken);
  $('#pairState').hidden = paired;
  $('#pairedBox').hidden = !paired;
  if (paired) {
    $('#pairedAs').textContent = settings.pairedAs
      ? `Signed in as ${settings.pairedAs}.`
      : 'This browser is connected to CareerOS.';
  }

  const codeInput = $('#pairCode');
  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#pairBtn').click();
  });

  $('#connectBtn').onclick = async () => {
    $('#connectBtn').disabled = true;
    $('#connectBtn').classList.add('is-loading');
    $('#connectBtn').textContent = 'Waiting for approval…';
    $('#connectMsg').textContent = 'Approve it in the tab that just opened.';

    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'connect' }, resolve)
    );

    $('#connectBtn').disabled = false;
    $('#connectBtn').classList.remove('is-loading');
    $('#connectBtn').textContent = 'Sign in';
    if (res && res.ok) {
      $('#connectMsg').textContent = 'Signed in. Pulling your profile…';
      const sync = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'sync' }, resolve)
      );
      await showFetchedSummary(sync);
    } else {
      $('#connectMsg').textContent = (res && res.error) || 'Could not sign in.';
    }
  };

  $('#pairBtn').onclick = async () => {
    const code = codeInput.value.trim();
    if (code.length !== 6) { $('#pairMsg').textContent = 'The code is six characters.'; return; }

    $('#pairBtn').disabled = true;
    $('#pairBtn').classList.add('is-loading');
    $('#pairMsg').textContent = 'Connecting…';

    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'pair', code }, resolve)
    );

    $('#pairBtn').disabled = false;
    $('#pairBtn').classList.remove('is-loading');
    if (!res || !res.ok) {
      $('#pairMsg').textContent = (res && res.error) || 'Could not reach CareerOS. Check the server address above.';
      return;
    }
    $('#pairMsg').textContent = 'Connected. Pulling your profile…';
    const sync = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'sync' }, resolve)
    );
    await showFetchedSummary(sync);
  };

  /* Pairing used to just reload the page silently — no confirmation of what
     was actually pulled in, and no obvious next step. Show the real fetched
     data (not a generic "done!") and put the one-click Auto Apply action
     right there, since that's the entire point of connecting an account. */
  async function showFetchedSummary(sync) {
    if (!sync || sync.ok === false || sync.entitled === false) {
      location.reload();
      return;
    }
    const fresh = Profile.hydrate(await Storage.getProfile());
    const items = [];
    const name = Profile.fullName(fresh);
    if (name) items.push(`Name: ${esc(name)}`);
    if (fresh.identity.email) items.push(`Email: ${esc(fresh.identity.email)}`);
    const skillCount = Profile.allSkills(fresh).length;
    if (skillCount) items.push(`${skillCount} skill${skillCount === 1 ? '' : 's'}`);
    if ((fresh.targeting.titles || []).length) {
      items.push(`Targeting: ${esc(fresh.targeting.titles.slice(0, 3).join(', '))}`);
    }
    const resume = await Storage.getResume();
    items.push(resume ? `Resume on file: ${esc(resume.name || 'yes')}` : 'No resume on file yet');

    $('#pairState').hidden = true;
    $('#fetchedBox').hidden = false;
    $('#fetchedList').innerHTML = items.map((i) => `<li>${i}</li>`).join('');

    $('#startAutoApplyBtn').onclick = async () => {
      const btn = $('#startAutoApplyBtn');

      /* Same gap as the popup: signing in doesn't grant access to the sites
         a job actually lives on, so without this the queue fills with
         postings CareerOS has no permission to touch and nothing happens
         on any of them. Ask right here, in the click itself. */
      const { Permissions } = window.CareerOS;
      let permOk = true;
      if (Permissions) {
        const granted = await chrome.permissions.request({
          origins: [...Permissions.GROUPS.ats.origins, ...Permissions.GROUPS.boards.origins],
        });
        permOk = granted;
        if (granted) {
          // Wait for the content scripts to actually be (re)registered for
          // the newly granted sites before a job tab can open on one — see
          // the matching comment in popup.js's ensureApplyPermissions().
          await new Promise((resolve) =>
            chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'reregister' }, resolve)
          );
        }
      }
      if (!permOk) {
        $('#startAutoApplyMsg').textContent = 'CareerOS needs permission to fill forms on job sites. Click the button again and allow access when Chrome asks.';
        return;
      }

      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.textContent = 'Finding jobs…';
      $('#startAutoApplyMsg').textContent = '';

      const build = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'build' }, resolve)
      );
      if (!build || !build.ok) {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.textContent = 'Start finding & applying to jobs';
        $('#startAutoApplyMsg').textContent = (build && build.error) || 'Could not search for jobs.';
        return;
      }

      if (!build.queued) {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.textContent = 'Start finding & applying to jobs';
        $('#startAutoApplyMsg').textContent = 'No matching jobs found right now. Widen your targeting or check back later.';
        return;
      }

      // Auto-submit off still runs the queue — every job gets opened and
      // filled, it just stops short of sending. Restricted boards (LinkedIn,
      // Indeed, etc.) always fill-and-stop regardless of this setting.
      const current = await Storage.getSettings();
      btn.textContent = current.autoSubmit ? 'Applying…' : 'Filling forms…';
      await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'start' }, resolve)
      );
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    };
  }

  $('#unpairBtn').onclick = async () => {
    await Storage.saveSettings({ deviceToken: '', pairedAs: '', pairedAt: null });
    location.reload();
  };

  $('#syncBtn').onclick = async () => {
    $('#syncMsg').textContent = 'Syncing…';
    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'sync' }, resolve)
    );
    $('#syncMsg').textContent = !res || !res.ok
      ? (res && res.message) || 'Sync failed.'
      : `Up to date. ${res.appliedToday} applications today.`;
  };

  /* ---------- platforms ---------- */
  const { Policy } = window.CareerOS;

  function renderPlatforms() {
    const all = Object.keys(Policy.POLICIES).filter((k) => k !== 'generic');
    const restricted = all.filter((k) => Policy.isRestricted(k));
    const open = all.filter((k) => !Policy.isRestricted(k));
    const acknowledged = Boolean(settings.acknowledgedRestricted);

    $('#restrictedPlatforms').innerHTML = restricted.map((k) => platformRow(k, !acknowledged)).join('');
    $('#openPlatforms').innerHTML = open.map((k) => platformRow(k, false)).join('');

    $$('.platformRow select').forEach((sel) => {
      sel.onchange = async () => {
        settings.platformModes = settings.platformModes || {};
        settings.platformModes[sel.dataset.platform] = sel.value;
        await Storage.saveSettings({ platformModes: settings.platformModes });
        flagSaved();
      };
    });
  }

  function platformRow(key, locked) {
    const base = Policy.POLICIES[key];
    const current = (settings.platformModes || {})[key] || 'default';
    const perHour = base.rateLimit ? `up to ${base.rateLimit}/hour` : 'no automated rate';
    return `<div class="platformRow" data-locked="${locked ? 1 : 0}">
      <div>
        <span class="pName">${esc(key)}</span>
        <span class="pNote">${esc(base.note)}</span>
      </div>
      <span class="pRate">${esc(perHour)}</span>
      <select data-platform="${esc(key)}"${locked ? ' disabled' : ''}>
        <option value="default"${current === 'default' ? ' selected' : ''}>Default — ${esc(Policy.label(base.mode))}</option>
        <option value="auto"${current === 'auto' ? ' selected' : ''}>Applies on its own</option>
        <option value="assist"${current === 'assist' ? ' selected' : ''}>Fills, you submit</option>
        <option value="discover"${current === 'discover' ? ' selected' : ''}>Read only</option>
      </select>
    </div>`;
  }

  renderPlatforms();

  /* ---------- job sources ---------- */
  let sources = await Storage.get('careeros.sources', { boards: [] });

  // A handful of real companies known to run on Greenhouse — a starting
  // point so this list isn't empty, not a guarantee any of them have a
  // matching opening right now. Board tokens can go stale (a company
  // migrates ATS, renames its board) with no warning beyond "zero jobs",
  // which is exactly what the "Test this board" button next to each one
  // is for — press it before relying on any of these. Seeded once, only
  // when the person has never touched this list themselves.
  const STARTER_BOARDS = [
    { ats: 'greenhouse', token: 'notion' },
    { ats: 'greenhouse', token: 'asana' },
    { ats: 'greenhouse', token: 'robinhood' },
    { ats: 'greenhouse', token: 'gusto' },
    { ats: 'greenhouse', token: 'brex' },
  ];
  if (!sources.boards || !sources.boards.length) {
    if (!(await Storage.get('careeros.boardsSeeded', false))) {
      sources.boards = STARTER_BOARDS.slice();
      await Storage.set('careeros.sources', sources);
      await Storage.set('careeros.boardsSeeded', true);
    }
  }

  $$('[data-source]').forEach((el) => {
    const path = el.dataset.source;
    el.value = readPath(sources, path) || '';
    el.addEventListener('input', async () => {
      writePath(sources, path, el.type === 'number' ? Number(el.value) : el.value);
      await Storage.set('careeros.sources', sources);
      flagSaved();
    });
  });

  function readPath(obj, path) {
    return path.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
  }
  function writePath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((a, k) => (a[k] = a[k] || {}), obj)[last] = value;
  }

  /* Check credentials before a run rather than during one. */
  $$('[data-test]').forEach((btn) => {
    const source = btn.dataset.test;
    const out = document.querySelector(`[data-testresult="${source}"]`);
    btn.onclick = async () => {
      btn.disabled = true;
      btn.classList.add('is-loading');
      out.textContent = 'Checking…';
      const res = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'testSource', source }, resolve)
      );
      btn.disabled = false;
      btn.classList.remove('is-loading');
      if (!res || !res.ok) {
        out.textContent = (res && res.error) || 'No response from the extension.';
        return;
      }
      out.textContent = res.count
        ? `Working — ${res.count} postings came back for your current targets.`
        : 'Connected, but nothing matched your target roles and location. Widen them or check the country code.';
    };
  });

  const ATS_OPTIONS = ['greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters'];

  function renderBoards() {
    const host = $('#boards');
    sources.boards = sources.boards || [];
    host.innerHTML = '';
    sources.boards.forEach((b, i) => {
      const entry = document.createElement('div');
      entry.className = 'entry';
      entry.innerHTML = `
        <button class="remove" title="Remove">×</button>
        <div class="grid">
          <label>Platform
            <select data-k="ats">
              ${ATS_OPTIONS.map((a) => `<option value="${a}"${a === b.ats ? ' selected' : ''}>${a}</option>`).join('')}
            </select>
          </label>
          <label>Board token<input data-k="token" value="${attr(b.token)}" placeholder="stripe"></label>
        </div>
        <div class="row">
          <button class="ghost" data-action="testBoard">Test this board</button>
          <span class="note" data-boardresult></span>
        </div>`;
      entry.querySelector('.remove').onclick = async () => {
        sources.boards.splice(i, 1);
        await Storage.set('careeros.sources', sources);
        renderBoards();
        flagSaved();
      };
      $$('[data-k]', entry).forEach((input) => {
        input.oninput = async () => {
          b[input.dataset.k] = input.value;
          await Storage.set('careeros.sources', sources);
          flagSaved();
        };
      });
      entry.querySelector('[data-action="testBoard"]').onclick = async () => {
        const btn = entry.querySelector('[data-action="testBoard"]');
        const out = entry.querySelector('[data-boardresult]');
        btn.disabled = true;
        btn.classList.add('is-loading');
        out.textContent = 'Testing…';
        const res = await new Promise((resolve) =>
          chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'testBoard', ats: b.ats, token: b.token }, resolve)
        );
        btn.disabled = false;
        btn.classList.remove('is-loading');
        out.textContent = res.ok
          ? `✓ Found ${res.count} open role${res.count === 1 ? '' : 's'}`
          : `✗ ${res.error || 'Could not reach that board.'}`;
      };
      host.appendChild(entry);
    });
  }

  $('#exportSources').onclick = () => {
    $('#sourceConfig').value = JSON.stringify(sources, null, 2);
    $('#importState').textContent = 'Loaded. Careful where you paste it — these are live keys.';
  };

  $('#importSources').onclick = async () => {
    const raw = $('#sourceConfig').value.trim();
    if (!raw) { $('#importState').textContent = 'Paste a config first.'; return; }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      $('#importState').textContent = 'That is not valid JSON. Check for a trailing comma.';
      return;
    }
    sources = Object.assign(sources, parsed);
    sources.boards = sources.boards || [];
    await Storage.set('careeros.sources', sources);
    $('#importState').textContent = 'Applied. Test each source below before running.';
    setTimeout(() => location.reload(), 900);
  };

  $('#addBoard').onclick = () => {
    sources.boards = sources.boards || [];
    sources.boards.push({ ats: 'greenhouse', token: '' });
    renderBoards();
  };

  renderBoards();

  /* ---------- resume ---------- */
  const stored = await Storage.getResume();
  if (stored) {
    $('#resumeName').textContent = stored.name;
    $('#resumeText').value = stored.text || '';
  }

  $('#pickResume').onclick = () => $('#resumeFile').click();
  $('#resumeFile').onchange = (e) => e.target.files[0] && takeFile(e.target.files[0]);

  const zone = $('#dropzone');
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('is-over'); })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('is-over'); })
  );
  zone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) takeFile(file);
  });

  async function takeFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      $('#resumeName').textContent = 'That file is over 5 MB. Use a smaller one.';
      return;
    }
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
    let text = $('#resumeText').value;
    if (/text\/plain/.test(file.type)) {
      text = await file.text();
      $('#resumeText').value = text;
    }
    await Storage.saveResume({ name: file.name, mime: file.type, dataUrl, text });
    $('#resumeName').textContent = file.name;
    flagSaved();
  }

  $('#resumeText').addEventListener('input', async () => {
    const current = (await Storage.getResume()) || { name: 'Pasted resume', mime: 'text/plain', dataUrl: '' };
    current.text = $('#resumeText').value;
    await Storage.saveResume(current);
    flagSaved();
  });

  $('#parseResume').onclick = async () => {
    const text = $('#resumeText').value.trim();
    if (text.length < 120) {
      $('#parseState').textContent = 'Paste your resume text first.';
      return;
    }
    $('#parseState').textContent = 'Reading it…';
    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage(
        { type: 'careeros:generate', kind: 'parseResume', payload: { text }, posting: {}, match: {} },
        resolve
      )
    );
    if (!res || !res.ok) {
      $('#parseState').textContent = `Couldn't read it: ${(res && res.error) || 'no response'}. Check your JobGPT token under How it runs.`;
      return;
    }
    try {
      const parsed = JSON.parse(res.text.replace(/```json|```/g, '').trim());
      profile = Profile.hydrate(mergeParsed(profile, parsed));
      await Storage.saveProfile(profile);
      $('#parseState').textContent = 'Profile filled in. Look it over before you apply anywhere.';
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      $('#parseState').textContent = 'The response came back in an unexpected shape. Try again.';
    }
  };

  /* Never let a parse wipe something the person typed themselves. */
  function mergeParsed(base, parsed) {
    const out = JSON.parse(JSON.stringify(base));
    walk(out, parsed);
    return out;
    function walk(target, source) {
      Object.keys(source || {}).forEach((k) => {
        const v = source[k];
        if (Array.isArray(v)) {
          if (!Array.isArray(target[k]) || !target[k].length) target[k] = v;
        } else if (v && typeof v === 'object') {
          target[k] = target[k] || {};
          walk(target[k], v);
        } else if (v !== '' && v != null && !target[k]) {
          target[k] = v;
        }
      });
    }
  }

  /* ---------- data ---------- */
  $('#exportData').onclick = async () => {
    const blob = new Blob([JSON.stringify({
      profile: await Storage.getProfile(),
      settings: await Storage.getSettings(),
      applications: await Storage.getApplications(),
      answers: await Storage.getAnswers()
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `careeros-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  $('#clearData').onclick = () => {
    if (!confirm('This deletes your profile, resume, settings and application history from this browser. There is no undo.')) return;
    chrome.storage.local.clear(() => location.reload());
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }
  function attr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }

  /* First-run wizard: a short, guided path through the tabs that already do
     the real work (Account's sign-in, Resume's parse-from-text, You's basics)
     rather than a separate onboarding flow with its own logic. Each step just
     switches to the relevant existing tab and explains what to do there. */
  const WELCOME_STEPS = [
    { panel: 'account', title: 'Connect your CareerOS account', copy: 'Sign in below so Auto Apply can pull your profile and resume.' },
    { panel: 'resume', title: 'Add your resume', copy: 'Paste your resume text and press "Build my profile from this text" — it fills in the tabs below for you.' },
    { panel: 'you', title: 'Check your basics', copy: 'Confirm your name, email and phone came through right, then you’re set.' }
  ];

  function goToTab(panelId) {
    const tab = $$('.tab').find((t) => t.dataset.panel === panelId);
    if (tab) tab.click();
  }

  function startWelcomeWizard() {
    let step = 0;
    const wizard = $('#welcomeWizard');
    wizard.hidden = false;

    function render() {
      const s = WELCOME_STEPS[step];
      $('#welcomeStepLabel').textContent = `Step ${step + 1} of ${WELCOME_STEPS.length}`;
      $('#welcomeTitle').textContent = s.title;
      $('#welcomeCopy').textContent = s.copy;
      $('#welcomeNext').textContent = step === WELCOME_STEPS.length - 1 ? 'Done' : 'Next';
      goToTab(s.panel);
    }

    function finish() {
      wizard.hidden = true;
      // Drop ?welcome=1 from the URL so a page refresh doesn't restart the tour.
      history.replaceState(null, '', location.pathname);
    }

    $('#welcomeNext').onclick = () => {
      if (step === WELCOME_STEPS.length - 1) { finish(); return; }
      step += 1;
      render();
    };
    $('#welcomeSkip').onclick = finish;

    render();
  }

  if (new URLSearchParams(location.search).get('welcome')) {
    startWelcomeWizard();
  } else {
    // Deep link from the in-page panel's Profile tab ("edit your profile" ->
    // options.html?tab=you), same pattern as the wizard above.
    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (requestedTab) goToTab(requestedTab);
  }
})();
