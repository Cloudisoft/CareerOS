/* CareerOS — service worker
 * Handles anything the page shouldn't: JobGPT calls, install flow, the badge.
 */
importScripts(
  '/lib/storage.js',
  '/lib/profile.js',
  '/lib/ats.js',
  '/lib/matcher.js',
  '/lib/policy.js',
  '/lib/careeros-api.js',
  '/lib/sync.js',
  '/lib/permissions.js',
  '/lib/harvest.js',
  '/lib/search-urls.js',
  '/lib/discovery.js',
  '/background/engine.js'
);

const { Storage, Profile, Engine, Policy, Api, Permissions, Sync } = self.CareerOS;

const SYSTEM_PROMPT = `You are JobGPT, the writing engine inside CareerOS.
You write application material on behalf of one candidate, using only the facts in their profile.

Rules you never break:
- Never invent employers, dates, degrees, certifications, or numbers. If the profile doesn't support a claim, leave it out.
- Write in first person, plain language, no filler openings ("I am writing to express my interest").
- Mirror the vocabulary of the job description where it is honestly true of the candidate.
- Lead with the single most relevant thing this candidate has actually done.
- No em dashes, no bullet lists unless asked, no headings.
- If a question asks for something the profile can't answer, reply with exactly: NEEDS_HUMAN`;

/* Content scripts are registered at runtime rather than declared, because the
   sites they run on are optional permissions the person grants as they go.
   This has to run on install, on browser start, and after every grant. */
chrome.runtime.onInstalled.addListener(() => { void Permissions.registerScripts(); });
chrome.runtime.onStartup.addListener(() => { void Permissions.registerScripts(); });
chrome.permissions.onAdded.addListener(() => { void Permissions.registerScripts(); });
chrome.permissions.onRemoved.addListener(() => { void Permissions.registerScripts(); });

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await Storage.saveSettings({});
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?welcome=1') });
  }
});

/* manifest.json declares the "open-dashboard" shortcut (Alt+Shift+J) — this
   is what actually makes it do something. */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  const tabId = sender.tab && sender.tab.id;

  /* --- engine protocol --- */
  if (msg.type === 'careeros:ready') {
    Engine.handleReady(tabId, sender.tab && sender.tab.url).then((directive) => respond(directive || { job: null }));
    return true;
  }
  /* An application waiting for the person, and continuing once they're done. */
  if (msg.type === 'careeros:needsYou')   { Engine.handleNeedsYou(tabId, msg).then(() => respond({ ok: true })); return true; }
  if (msg.type === 'careeros:resumed')    { Engine.handleResumed(tabId).then(() => respond({ ok: true })); return true; }
  if (msg.type === 'careeros:submitting') { Engine.handleSubmitting(tabId).then(() => respond({ ok: true })); return true; }
  if (msg.type === 'careeros:handoff')    { Engine.handleHandoff(tabId).then(() => respond({ ok: true })); return true; }
  if (msg.type === 'careeros:expectTab')  { Engine.handleExpectTab(tabId).then(() => respond({ ok: true })); return true; }
  if (msg.type === 'careeros:learn')      { learnAnswers(msg.answers, msg.profileId).then(respond); return true; }
  if (msg.type === 'careeros:result') {
    Engine.handleResult(tabId, msg.result).then(() => respond({ ok: true }));
    return true;
  }
  if (msg.type === 'careeros:progress') {
    // Fire-and-forget: a dropped progress tick just means the dashboard's
    // step counter lags one step behind for a moment.
    Engine.handleProgress(tabId, { step: msg.step, maxSteps: msg.maxSteps, filled: msg.filled });
    return false;
  }
  if (msg.type === 'careeros:engine') {
    handleEngineCommand(msg).then(respond).catch((err) => respond({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'careeros:policy') {
    Storage.getSettings().then((settings) => {
      respond({ ok: true, policy: Policy.for(msg.ats), submit: Policy.canAutoSubmit(msg.ats, settings) });
    });
    return true;
  }

  if (msg.type === 'careeros:generate') {
    generate(msg).then(respond).catch((err) => respond({ ok: false, error: err.message }));
    return true; // async
  }
  if (msg.type === 'careeros:stats') {
    stats().then(respond);
    return true;
  }
  if (msg.type === 'careeros:openOptions') {
    // A content-script panel can't call chrome.tabs itself, and
    // chrome.runtime.openOptionsPage() can't target a specific tab within
    // options.html, so this opens (or focuses) it with a ?tab= param
    // instead — same deep-link options.js already reads for ?welcome=1.
    (async () => {
      const url = chrome.runtime.getURL(`options/options.html${msg.tab ? `?tab=${encodeURIComponent(msg.tab)}` : ''}`);
      const existing = await chrome.tabs.query({ url: chrome.runtime.getURL('options/options.html*') });
      if (existing.length) {
        await chrome.tabs.update(existing[0].id, { active: true, url });
        if (existing[0].windowId != null) chrome.windows.update(existing[0].windowId, { focused: true });
      } else {
        chrome.tabs.create({ url });
      }
      respond({ ok: true });
    })();
    return true;
  }
  return false;
});

/* The application continues in a new tab (Indeed Apply, an employer's "Apply" link). */
chrome.tabs.onCreated.addListener((tab) => { Engine.adoptTab(tab.openerTabId, tab).catch(() => {}); });
chrome.tabs.onRemoved.addListener((tabId) => { Engine.handleTabClosed(tabId).catch(() => {}); });
/* Clicking "… needs you" brings that application's tab to the front. */
chrome.notifications.onClicked.addListener((id) => {
  const m = /^careeros:tab:(\d+)$/.exec(id);
  if (m) Engine.focusTab(Number(m[1]));
  chrome.notifications.clear(id);
});

/* Answers the person gave on a form: remembered in this browser right away, and on their CareerOS account so
   every browser (and the next form, however it words the question) reuses them. */
async function learnAnswers(answers, profileId) {
  const list = (answers || []).filter((a) => a && a.question && a.answer);
  for (const a of list) await Storage.rememberAnswer(a.key || a.question, a.answer, profileId);
  try {
    await Api.saveAnswers(list.map((a) => ({ question: a.question, answer: a.answer, key: a.key, source: 'user' })));
    return { ok: true, saved: list.length };
  } catch (err) {
    return { ok: true, saved: list.length, serverError: err.message };
  }
}

/* Pull the current profile and targeting from CareerOS before a run, so the
   extension is never applying from a profile the person edited last week on
   another device. */
/* What the website last sent (profile, run settings) and which local profile it belongs to. With it, a
   field changed on the website comes down and a field changed here is kept and sent up (lib/sync.js). */
const SERVER_COPY = 'careeros.serverCopy';

let syncing = null;
function syncFromServer() {
  // One at a time: an options-page edit and a run starting together must not interleave.
  const run = (syncing || Promise.resolve()).then(syncOnce, syncOnce);
  syncing = run.catch(() => {});
  return run;
}

async function syncOnce() {
  const payload = await Api.sync();

  if (payload.entitled === false) {
    return { ok: false, entitled: false, message: payload.message };
  }
  const copy = (await Storage.get(SERVER_COPY, null)) || {};

  if (payload.settings) {
    const s = payload.settings;
    const server = {
      minMatchScore: s.minMatchScore,
      pacingSeconds: s.pacingSeconds,
      concurrency: s.concurrency,
      autoSubmit: s.autoSubmit,
      platformModes: s.platformModes || {},
    };
    const local = await Storage.getSettings();
    await Storage.saveSettings(Object.assign(Sync.mergeSettings(local, server, copy.settings), {
      // The server's limit is the plan's monthly cap; the per-day limit stays this browser's own setting.
      monthlyLimit: s.monthlyLimit !== undefined ? s.monthlyLimit : s.dailyLimit,
      appliedThisMonth: payload.appliedThisMonth != null ? payload.appliedThisMonth : (payload.appliedToday || 0),
      syncedAt: Date.now(),
    }));
    copy.settings = server;
  }

  if (payload.resume && payload.resume.data) {
    // The website's profile belongs to one local profile (the one active at the first sync); others are left alone.
    const data = await Storage.getProfiles();
    const id = copy.profileId && data.profiles[copy.profileId] ? copy.profileId : data.activeId;
    const existing = data.profiles[id] || {};
    const base = id === copy.profileId ? copy.profile : null;
    const merged = Sync.mergeProfile(existing, payload.resume.data, base);
    await Storage.saveProfileById(id, Object.assign(merged, { name: existing.name || merged.name }));
    copy.profileId = id;
    copy.profile = payload.resume.data;
  }
  await Storage.set(SERVER_COPY, copy);

  if (payload.answers) await Storage.mergeServerAnswers(payload.answers);
  await Storage.saveServerApplied(payload.appliedUrls || []);
  await syncResumeFile().catch(() => {});

  const pushed = await pushChanges();
  return {
    ok: true,
    entitled: true,
    appliedToday: payload.appliedToday,
    appliedThisMonth: payload.appliedThisMonth,
    appliedUrls: payload.appliedUrls || [],
    pushError: pushed.error,
  };
}

/* Send what changed here since the last sync. Values the server can't take are clamped to its ranges. */
async function pushChanges() {
  const errors = [];
  const copy = (await Storage.get(SERVER_COPY, null)) || {};

  const settingsPatch = Sync.settingsChanges(await Storage.getSettings(), copy.settings);
  if (settingsPatch) {
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));
    if ('minMatchScore' in settingsPatch) settingsPatch.minMatchScore = clamp(settingsPatch.minMatchScore, 0, 100);
    if ('pacingSeconds' in settingsPatch) settingsPatch.pacingSeconds = clamp(settingsPatch.pacingSeconds, 10, 600);
    if ('concurrency' in settingsPatch) settingsPatch.concurrency = clamp(settingsPatch.concurrency, 1, 6);
    if ('autoSubmit' in settingsPatch) settingsPatch.autoSubmit = Boolean(settingsPatch.autoSubmit);
    try {
      const res = await Api.saveSettings(settingsPatch);
      copy.settings = Sync.applyToBase(copy.settings, (res && res.settings) || settingsPatch);
    } catch (err) {
      errors.push(`Settings: ${err.message}`);
    }
  }

  if (copy.profileId) {
    const data = await Storage.getProfiles();
    const profilePatch = Sync.profileChanges(data.profiles[copy.profileId], copy.profile);
    if (profilePatch) {
      try {
        await Api.saveProfile(profilePatch);
        copy.profile = Sync.applyToBase(copy.profile, profilePatch);
      } catch (err) {
        errors.push(`Profile: ${err.message}`);
      }
    }
  }
  await Storage.set(SERVER_COPY, copy);
  return { error: errors.length ? errors.join(' ') : undefined };
}

/* Applications need a resume *file* in their upload field, and CareerOS
   stores resumes as structured content — so sync pulls a PDF rendered from
   the person's account. A resume they uploaded themselves in the extension
   always wins and is never overwritten; only a previous CareerOS copy is
   refreshed. */
async function syncResumeFile() {
  const current = await Storage.getResume();
  if (current && current.source !== 'careeros') return;
  const file = await Api.getResumeFile();
  if (!file || !file.base64) return;
  if (current && current.updatedAt === file.updatedAt) return;
  await Storage.saveResume({
    name: file.name,
    mime: file.mime || 'application/pdf',
    dataUrl: `data:${file.mime || 'application/pdf'};base64,${file.base64}`,
    text: file.text || '',
    source: 'careeros',
    updatedAt: file.updatedAt,
  });
}

async function handleEngineCommand(msg) {
  if (msg.command === 'pair')    return pairDevice(msg.code);
  if (msg.command === 'connect') {
    // Signed in: bring the profile and settings down now, so the popup isn't empty until the first run.
    const res = await Api.connect();
    if (res.ok) await syncFromServer().catch(() => {});
    return res;
  }
  if (msg.command === 'permissions') return { ok: true, granted: await Permissions.status() };
  if (msg.command === 'reregister')  return { ok: true, ...(await Permissions.registerScripts()) };
  if (msg.command === 'sync')   return syncFromServer().catch((err) => ({ ok: false, error: err.message }));
  // The options page changed something: send it to the website now rather than at the next run.
  if (msg.command === 'push') {
    if (!(await Api.isPaired())) return { ok: true, paired: false };
    return syncFromServer().catch((err) => ({ ok: false, error: err.message }));
  }
  if (msg.command === 'unpair') { await Engine.stop('Disconnected'); await Api.unpair(); await Storage.set(SERVER_COPY, null); return { ok: true }; }
  if (msg.command === 'focus')  return { ok: await Engine.focusTab(msg.tabId) };
  if (msg.command === 'paired') return { ok: true, paired: await Api.isPaired() };
  if (msg.command === 'build') {
    const perms = await Permissions.status();
    if (!perms.ats && !perms.boards) {
      return {
        ok: false,
        error: 'No job sites are connected yet. Open settings and turn on at least one.',
      };
    }
    // Refuse to build a queue for an account that is not entitled, rather than
    // tailoring twenty applications the person cannot send.
    const synced = await syncFromServer().catch(() => ({ ok: false, error: 'Not paired' }));
    if (synced.entitled === false) return { ok: false, error: synced.message };
    return Object.assign({ ok: true }, await Engine.build());
  }
  if (msg.command === 'start')  return { ok: true, state: await Engine.start() };
  if (msg.command === 'stop')   return { ok: true, state: await Engine.stop('Stopped by you') };
  if (msg.command === 'state')  return { ok: true, state: await Engine.getState() };
  if (msg.command === 'testSource') return testSource(msg.source);
  if (msg.command === 'testBoard') return testBoard(msg.ats, msg.token);
  if (msg.command === 'add')    return Object.assign({ ok: true }, await Engine.add(msg.jobs));
  if (msg.command === 'clear')  return { ok: true, state: await Engine.setState({ queue: [], done: [], running: false }) };
  return { ok: false, error: `Unknown command ${msg.command}` };
}

/* Company boards had no way to self-verify — a bad token just returned zero
   jobs from build(), indistinguishable from "this company has no openings
   right now" or any other silent failure. Mirrors testSource() above but for
   one board entry instead of an aggregator. */
async function testBoard(ats, token) {
  if (!token || !String(token).trim()) return { ok: false, error: 'Add a board token first.' };
  const profile = Profile.hydrate(await Storage.getProfile());
  const settings = await Storage.getSettings();
  try {
    const { jobs, errors } = await self.CareerOS.Discovery.search(profile, settings, { boards: [{ ats, token }] });
    if (errors.length) return { ok: false, error: errors[0] };
    return { ok: true, count: jobs.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function testSource(source) {
  const profile = Profile.hydrate(await Storage.getProfile());
  const settings = await Storage.getSettings();
  const sources = await Storage.get('careeros.sources', { boards: [] });

  const cfg = sources[source] || {};
  if (source === 'adzuna' && !(cfg.appId && cfg.appKey)) {
    return { ok: false, error: 'Adzuna needs both an App ID and an App key. The App ID is the shorter one.' };
  }
  if (source === 'jsearch' && !cfg.key) return { ok: false, error: 'Add your RapidAPI key first.' };
  if (source === 'usajobs' && !cfg.email) return { ok: false, error: 'Add the email you registered with.' };

  try {
    const only = { boards: [] };
    only[source] = cfg;
    const { jobs, errors } = await self.CareerOS.Discovery.search(profile, settings, only);
    if (errors.length) return { ok: false, error: errors[0] };
    return { ok: true, count: jobs.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function pairDevice(code) {
  try {
    const result = await Api.pair(code);
    return { ok: true, pairedAs: result.email || result.name || '' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* The engine writes cover letters ahead of time; this is the hook it calls. */
self.CareerOS.generateFor = async function (job) {
  const res = await generate({
    kind: 'coverLetter',
    payload: {},
    posting: { title: job.title, company: job.company, description: job.description, url: job.url },
    match: { matchedSkills: job.matchedSkills || [] }
  });
  return res.ok ? res.text : null;
};

/* Refresh the badge, and nudge the engine loop back to life after the service
   worker has been suspended mid-run. */
chrome.alarms.create('careeros:badge', { periodInMinutes: 5 });
// Edits made on the website reach this browser between runs too, not only when a run starts.
chrome.alarms.create('careeros:sync', { periodInMinutes: 15 });
// Start / Stop pressed on the Auto Apply page in CareerOS reaches this browser within a minute.
chrome.alarms.create('careeros:control', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'careeros:badge') return updateBadge();
  if (alarm.name === 'careeros:control') return checkRemoteControl().catch(() => {});
  if (alarm.name === 'careeros:sync') {
    if (await Api.isPaired()) return syncFromServer().catch(() => {});
    return;
  }
  if (alarm.name === 'careeros:tick') {
    const state = await Engine.getState();
    if (state.running) Engine.loop();
  }
});
chrome.runtime.onStartup.addListener(async () => {
  const state = await Engine.getState();
  if (state.running) Engine.start();
});
updateBadge();

async function checkRemoteControl() {
  if (!(await Api.isPaired())) return;
  const { command } = await Api.control();
  if (command === 'start') {
    await syncFromServer().catch(() => {});
    const state = await Engine.start();
    notifyRemote(state.running ? 'CareerOS started applying' : 'CareerOS could not start', state.running ? 'Started from the Auto Apply page.' : (state.lastError || ''));
  } else if (command === 'stop') {
    await Engine.stop('Stopped from the Auto Apply page');
    notifyRemote('CareerOS stopped', 'Stopped from the Auto Apply page.');
  }
}

function notifyRemote(title, message) {
  chrome.notifications.create('', { type: 'basic', iconUrl: chrome.runtime.getURL('icons/icon128.png'), title, message: String(message || '').slice(0, 200) });
}

async function updateBadge() {
  const count = await Storage.appliedToday();
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#F14632' });
}

async function stats() {
  const engine = await Engine.getState();
  const apps = await Storage.getApplications();
  const today = await Storage.appliedToday();
  const submitted = apps.filter((a) => a.status === 'submitted').length;
  return { ok: true, total: apps.length, today, submitted, recent: apps.slice(0, 8), engine };
}

/* ---------------- JobGPT ---------------- */

async function generate({ kind, payload, posting, match }) {
  payload = payload || {};
  const settings = await Storage.getSettings();
  const profile = Profile.hydrate(await Storage.getProfile());

  const prompt = buildPrompt(kind, payload, posting, match, profile);
  if (!prompt) return { ok: false, error: 'Nothing to write' };

  // Resume parsing wants raw JSON back, so it gets its own instruction set.
  const system = kind === 'parseResume'
    ? 'You extract structured data from resumes. You return one JSON object and nothing else. You never invent a fact that is not in the source text.'
    : SYSTEM_PROMPT;

  /* Production path: the backend holds the model key. The direct path exists
     only for local development and is a deliberate dead end in a shipped build,
     because anything in an extension bundle is readable by anyone who installs
     it — a key shipped this way is a key given away. */
  let text;
  if (/^sk-ant-/.test(settings.apiToken || '')) {
    if (!settings.allowDirectKey) {
      return {
        ok: false,
        error: 'That looks like a provider key. Use a CareerOS token from your backend instead. The direct path needs both developer mode and the dev manifest (./build.sh dev), and is not permitted in a shipped build.'
      };
    }
    text = await callAnthropic(settings, prompt, system);
  } else {
    text = await callCareerOS(settings, {
      kind,
      posting,
      question: (payload && payload.question) || undefined,
      options: Array.isArray(payload && payload.options) && payload.options.length ? payload.options.slice(0, 30) : undefined,
      text: (payload && payload.text) || undefined,
      matchedSkills: (match && match.matchedSkills) || []
    });
  }

  if (!text || /^NEEDS_HUMAN$/i.test(text.trim())) return { ok: false, error: 'Needs you' };
  return { ok: true, text: text.trim() };
}

function buildPrompt(kind, payload, posting, match, profile) {
  const candidate = summarizeProfile(profile);
  const job = [
    `Role: ${posting.title || 'unknown'}`,
    `Company: ${posting.company || 'unknown'}`,
    `Description:\n${(posting.description || '').slice(0, 4000)}`
  ].join('\n');

  const overlap = match && match.matchedSkills && match.matchedSkills.length
    ? `Skills the posting and the candidate share: ${match.matchedSkills.join(', ')}.`
    : '';

  if (kind === 'coverLetter') {
    return `${candidate}\n\n${job}\n\n${overlap}\n\nWrite a cover letter of 140 to 200 words for this role. Open with the most relevant thing this candidate has done, not a greeting about the posting.`;
  }
  if (kind === 'whyCompany') {
    return `${candidate}\n\n${job}\n\nAnswer in 60 to 90 words: why this candidate wants this role at this company. Ground it in what the posting actually says the team does.`;
  }
  if (kind === 'parseResume') {
    return `Read this resume and return the candidate's details as JSON. Return only the JSON object, no prose and no code fences.

Shape:
{"identity":{"firstName":"","lastName":"","email":"","phone":"","city":"","state":"","country":"","linkedin":"","github":"","portfolio":""},
 "experience":{"currentTitle":"","currentCompany":"","totalYears":0,"history":[{"title":"","company":"","start":"","end":"","location":"","bullets":[""]}]},
 "skills":{"core":[""],"familiar":[""],"tools":[""],"languages":[""]},
 "education":[{"degree":"","field":"","school":"","year":""}],
 "certifications":[""],
 "strengths":[""],
 "narrative":{"summary":""},
 "targeting":{"titles":[""],"seniority":""}}

Leave a field as an empty string or empty array when the resume doesn't say. Never invent anything. Infer totalYears from the dates. Write summary in the candidate's first person, two sentences.

Resume:
${payload.text.slice(0, 12000)}`;
  }
  if (kind === 'answerQuestion') {
    return `${candidate}\n\n${job}\n\nApplication question: "${payload.question}"\n\nAnswer it as the candidate, in 40 to 120 words. If the profile does not contain what the question needs, reply with exactly NEEDS_HUMAN.`;
  }
  return null;
}

function summarizeProfile(p) {
  const lines = [
    `Candidate: ${Profile.fullName(p)}, based in ${Profile.locationLine(p) || 'unspecified'}.`,
    `Current: ${p.experience.currentTitle || 'unspecified'} at ${p.experience.currentCompany || 'unspecified'}, ${p.experience.totalYears || 0} years total experience.`,
    `Target roles: ${(p.targeting.titles || []).join(', ') || 'unspecified'}.`,
    `Core skills: ${(p.skills.core || []).join(', ') || 'unspecified'}.`,
    `Tools: ${(p.skills.tools || []).join(', ') || 'none listed'}.`,
    p.strengths.length ? `Strengths in their own words: ${p.strengths.join('; ')}.` : '',
    p.narrative.summary ? `Summary: ${p.narrative.summary}` : ''
  ];

  if ((p.experience.history || []).length) {
    lines.push('Work history:');
    p.experience.history.slice(0, 5).forEach((h) => {
      lines.push(`- ${h.title} at ${h.company} (${h.start || '?'}–${h.end || 'present'}): ${(h.bullets || []).join(' ')}`);
    });
  }
  if ((p.education || []).length) {
    lines.push(`Education: ${p.education.map((e) => `${e.degree} in ${e.field}, ${e.school} ${e.year || ''}`).join('; ')}`);
  }
  return lines.filter(Boolean).join('\n');
}

async function callCareerOS(settings, body) {
  const res = await fetch(`${settings.apiBase.replace(/\/$/, '')}/jobgpt/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The token from signing in; a token pasted under How it runs still works.
      ...((settings.deviceToken || settings.apiToken) ? { Authorization: `Bearer ${settings.deviceToken || settings.apiToken}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401) throw new Error('Your CareerOS token was rejected. Check it under How it runs.');
  if (res.status === 402) throw new Error('This account has used its generation quota for the month.');
  if (res.status === 409) throw new Error('Save your profile to the server before generating.');
  if (res.status === 422) throw new Error('Needs you');
  if (res.status === 429) throw new Error('Too many requests in a minute — the run will retry.');
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error || ''; } catch (err) { detail = ''; }
    throw new Error(detail || `CareerOS API returned ${res.status}`);
  }
  const data = await res.json();
  return data.text || data.output || '';
}

async function callAnthropic(settings, prompt, system) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiToken,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: system || SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`);
  const data = await res.json();
  return (data.content || []).map((c) => c.text || '').join('\n');
}
