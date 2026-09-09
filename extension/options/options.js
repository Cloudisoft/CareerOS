(async function () {
  'use strict';

  const { Storage, Profile } = window.CareerOS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let profile = Profile.hydrate(await Storage.getProfile());
  let settings = await Storage.getSettings();
  let saveTimer = null;

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
      else if (el.type === 'number') write(path, el.value === '' ? 0 : Number(el.value));
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

  $('#pairBtn').onclick = async () => {
    const code = codeInput.value.trim();
    if (code.length !== 6) { $('#pairMsg').textContent = 'The code is six characters.'; return; }

    $('#pairBtn').disabled = true;
    $('#pairMsg').textContent = 'Connecting…';

    const res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'pair', code }, resolve)
    );

    $('#pairBtn').disabled = false;
    if (!res || !res.ok) {
      $('#pairMsg').textContent = (res && res.error) || 'Could not reach CareerOS. Check the server address above.';
      return;
    }
    $('#pairMsg').textContent = 'Connected. Pulling your profile…';
    await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'sync' }, resolve)
    );
    location.reload();
  };

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
      out.textContent = 'Checking…';
      const res = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careeros:engine', command: 'testSource', source }, resolve)
      );
      btn.disabled = false;
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

  if (new URLSearchParams(location.search).get('welcome')) {
    setState('saving', 'Start with your name and email');
  }
})();
