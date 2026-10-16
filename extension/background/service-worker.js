/* CareerOS — service worker
 * Handles anything the page shouldn't: AI calls (through the Career OS server), syncing, the run engine,
 * notifications and the badge.
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
  '/lib/discovery.js',
  '/background/engine.js'
);

const { Storage, Profile, Engine, Policy, Api, Permissions, Sync } = self.CareerOS;

/* Content scripts are registered at runtime rather than declared, because the
   sites they run on are optional permissions the person grants as they go.
   This has to run on install, on browser start, and after every grant. */
chrome.runtime.onInstalled.addListener(() => { Permissions.registerScripts().catch(logError('register scripts')); });
chrome.runtime.onStartup.addListener(() => { Permissions.registerScripts().catch(logError('register scripts')); });
chrome.permissions.onAdded.addListener(() => { Permissions.registerScripts().catch(logError('register scripts')); });
chrome.permissions.onRemoved.addListener(() => { Permissions.registerScripts().catch(logError('register scripts')); });

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await Storage.saveSettings({});
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?welcome=1') });
  }
});

/* After a browser restart: put interrupted jobs back in the queue and carry on if a run was going. */
chrome.runtime.onStartup.addListener(async () => {
  await Engine.recover();
  const state = await Engine.getState();
  if (state.running) Engine.start();
});

chrome.tabs.onRemoved.addListener((tabId) => { Engine.handleTabClosed(tabId).catch(logError('tab closed')); });
// Indeed Apply and employers' "Apply" links open a new tab: the application continues there.
chrome.tabs.onCreated.addListener((tab) => { Engine.adoptTab(tab.openerTabId, tab).catch(logError('adopt tab')); });
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.url) Engine.handleNavigated(tabId, info.url).catch(logError('navigated')); });

/* Clicking "X needs you" brings that application's tab to the front. */
chrome.notifications.onClicked.addListener((id) => {
  const m = /^careeros:tab:(\d+)$/.exec(id);
  if (m) Engine.focusTab(Number(m[1]));
  chrome.notifications.clear(id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-dashboard') chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  const tabId = sender.tab && sender.tab.id;
  const reply = (promise) => {
    promise.then(respond, (err) => respond({ ok: false, error: err.message }));
    return true;
  };

  /* --- engine protocol (from the page agent) --- */
  if (msg.type === 'careeros:ready') return reply(Engine.handleReady(tabId, sender.tab && sender.tab.url).then((directive) => directive || { job: null }));
  if (msg.type === 'careeros:expectTab') return reply(Engine.handleExpectTab(tabId).then(() => ({ ok: true })));
  if (msg.type === 'careeros:handoff') return reply(Engine.handleHandoff(tabId, msg.url).then(() => ({ ok: true })));
  if (msg.type === 'careeros:result') return reply(Engine.handleResult(tabId, msg.result).then(() => ({ ok: true })));
  if (msg.type === 'careeros:needsYou') return reply(Engine.handleNeedsYou(tabId, msg).then(() => ({ ok: true })));
  if (msg.type === 'careeros:resumed') return reply(Engine.handleResumed(tabId).then(() => ({ ok: true })));
  if (msg.type === 'careeros:submitting') return reply(Engine.handleSubmitting(tabId).then(() => ({ ok: true })));
  if (msg.type === 'careeros:learn') return reply(learnAnswers(msg.answers));

  if (msg.type === 'careeros:engine') return reply(handleEngineCommand(msg));
  if (msg.type === 'careeros:policy') {
    return reply(Storage.getSettings().then((settings) => ({ ok: true, policy: Policy.for(msg.ats), submit: Policy.canAutoSubmit(msg.ats, settings) })));
  }
  if (msg.type === 'careeros:generate') return reply(generate(msg));
  if (msg.type === 'careeros:stats') return reply(stats());
  return false;
});

/* Answers the person gave in a form: remembered on this device right away, and on the server so every
   device (and the next form, however it words the question) reuses them. */
async function learnAnswers(answers) {
  const list = (answers || []).filter((a) => a && a.question && a.answer);
  for (const a of list) {
    await Storage.rememberAnswer(a.key || a.question, a.answer, 'user');
  }
  try {
    await Api.saveAnswers(list.map((a) => ({ question: a.question, answer: a.answer, key: a.key, source: 'user' })));
    return { ok: true, saved: list.length };
  } catch (err) {
    return { ok: true, saved: list.length, serverError: err.message };
  }
}

/* Two-way sync with the website, before every run and whenever the options page changes something.
   A field changed on the website comes down; a field changed here is kept and sent up (lib/sync.js). */
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
    const base = await Storage.get(Storage.KEYS.SERVER_SETTINGS, null);
    await Storage.saveSettings(Object.assign(Sync.mergeSettings(local, server, base), {
      // 2.5.0+: the plan's cap is monthly; the per-day cap stays this browser's own setting.
      monthlyLimit: s.monthlyLimit === undefined ? null : s.monthlyLimit,
      appliedThisMonth: payload.appliedThisMonth || 0,
      syncedAt: Date.now(),
    }));
    await Storage.set(Storage.KEYS.SERVER_SETTINGS, server);
  }

  if (payload.resume && payload.resume.data) {
    const server = payload.resume.data;
    const existing = (await Storage.getProfile()) || {};
    const base = await Storage.get(Storage.KEYS.SERVER_PROFILE, null);
    await Storage.saveProfile(Sync.mergeProfile(existing, server, base));
    await Storage.set(Storage.KEYS.SERVER_PROFILE, server);
  }
  await Storage.saveServerApplied(payload.appliedUrls || []);
  await Storage.mergeServerAnswers(payload.answers || []);

  const pushed = await pushChanges();

  return { ok: true, entitled: true, appliedThisMonth: payload.appliedThisMonth, appliedUrls: payload.appliedUrls || [], pushError: pushed.error };
}

/* Send what changed here since the last sync. Values the server can't take are clamped to its ranges. */
async function pushChanges() {
  const errors = [];

  const settingsBase = await Storage.get(Storage.KEYS.SERVER_SETTINGS, null);
  const settingsPatch = Sync.settingsChanges(await Storage.getSettings(), settingsBase);
  if (settingsPatch) {
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));
    if ('minMatchScore' in settingsPatch) settingsPatch.minMatchScore = clamp(settingsPatch.minMatchScore, 0, 100);
    if ('pacingSeconds' in settingsPatch) settingsPatch.pacingSeconds = clamp(settingsPatch.pacingSeconds, 10, 600);
    if ('concurrency' in settingsPatch) settingsPatch.concurrency = clamp(settingsPatch.concurrency, 1, 6);
    if ('autoSubmit' in settingsPatch) settingsPatch.autoSubmit = Boolean(settingsPatch.autoSubmit);
    try {
      const res = await Api.saveSettings(settingsPatch);
      const saved = (res && res.settings) || settingsPatch;
      await Storage.set(Storage.KEYS.SERVER_SETTINGS, Sync.applyToBase(settingsBase, saved));
    } catch (err) {
      errors.push(`Settings: ${err.message}`);
    }
  }

  const profileBase = await Storage.get(Storage.KEYS.SERVER_PROFILE, null);
  const profilePatch = Sync.profileChanges(await Storage.getProfile(), profileBase);
  if (profilePatch) {
    try {
      await Api.saveProfile(profilePatch);
      await Storage.set(Storage.KEYS.SERVER_PROFILE, Sync.applyToBase(profileBase, profilePatch));
    } catch (err) {
      errors.push(`Profile: ${err.message}`);
    }
  }
  return { error: errors.length ? errors.join(' ') : undefined };
}

async function handleEngineCommand(msg) {
  if (msg.command === 'pair')    return pairDevice(msg.code);
  if (msg.command === 'connect') {
    // Signed in: bring the profile and settings down now, so the popup isn't empty until the first run.
    const res = await Api.connect();
    if (res.ok) await syncFromServer().catch(logError('sync after sign in'));
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
  if (msg.command === 'paired') return { ok: true, paired: await Api.isPaired() };
  if (msg.command === 'unpair') { await Engine.stop('Disconnected'); await Api.unpair(); return { ok: true }; }
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
    const synced = await syncFromServer().catch((err) => ({ ok: false, error: err.message }));
    if (synced.entitled === false) return { ok: false, error: synced.message };
    if (!synced.ok) return { ok: false, error: synced.error || 'Could not reach Career OS' };
    return Object.assign({ ok: true }, await Engine.build());
  }
  if (msg.command === 'start') {
    // CareerOS can only fill forms on sites it has access to. Jobs already queued need their own site;
    // an empty queue is filled from employer boards, which need the employer sites turned on.
    const queued = (await Engine.getState()).queue.filter((j) => j.state === 'queued');
    const reachable = await Promise.all(queued.map((j) => canRunOn(j.url)));
    const noAccess = queued.length ? !reachable.some(Boolean) : !(await Permissions.status()).ats;
    if (noAccess) {
      return { ok: false, error: 'Turn on "Employer application systems" in CareerOS settings first, so CareerOS can fill applications on Greenhouse, Lever, Ashby and others.' };
    }
    const synced = await syncFromServer().catch((err) => ({ ok: false, error: err.message }));
    if (synced.entitled === false) return { ok: false, error: synced.message };
    if (!synced.ok) return { ok: false, error: synced.error || 'Could not reach Career OS' };
    return { ok: true, state: await Engine.start() };
  }
  if (msg.command === 'stop')   return { ok: true, state: await Engine.stop('Stopped by you') };
  if (msg.command === 'state')  return { ok: true, state: await Engine.getState(), active: Object.entries(await Engine.getActive()).map(([tabId, e]) => ({ tabId: Number(tabId), phase: e.phase, message: e.message, job: { title: e.job.title, company: e.job.company } })) };
  if (msg.command === 'focus')  return { ok: await Engine.focusTab(msg.tabId) };
  if (msg.command === 'testSource') return testSource(msg.source);
  if (msg.command === 'add')    return Object.assign({ ok: true }, await Engine.add(msg.jobs));
  if (msg.command === 'clear')  return { ok: true, state: await Engine.setState({ queue: [], done: [], running: false, runId: null }) };
  return { ok: false, error: `Unknown command ${msg.command}` };
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
// Start / Stop pressed on the Auto Apply page in Career OS reaches this browser within a minute.
chrome.alarms.create('careeros:control', { periodInMinutes: 1 });
// Edits made on the website reach this browser between runs too, not only when a run starts.
chrome.alarms.create('careeros:sync', { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'careeros:badge') return Engine.updateBadge();
  if (alarm.name === 'careeros:control') return checkRemoteControl().catch(logError('control'));
  if (alarm.name === 'careeros:sync') {
    if (await Api.isPaired()) return syncFromServer().catch(logError('sync'));
    return;
  }
  if (alarm.name === 'careeros:tick') {
    const state = await Engine.getState();
    if (state.running) Engine.loop();
  }
});
Engine.updateBadge();

async function stats() {
  const engine = await Engine.getState();
  const apps = await Storage.getApplications();
  const today = await Storage.appliedToday();
  const submitted = apps.filter((a) => a.status === 'submitted').length;
  const waiting = Object.values(await Engine.getActive()).filter((e) => e.phase === 'waiting').length;
  return { ok: true, total: apps.length, today, submitted, waiting, recent: apps.slice(0, 8), engine };
}

/* ---------------- JobGPT ---------------- */

/* All AI writing goes through the Career OS server, which holds the model key and builds the prompt from the
   person's verified career profile. A key never ships in the extension. */
async function generate({ kind, payload, posting, match }) {
  payload = payload || {};
  try {
    const res = await Api.generate({
      kind,
      posting: posting ? { title: posting.title, company: posting.company, description: (posting.description || '').slice(0, 8000) } : undefined,
      question: payload.question || undefined,
      options: Array.isArray(payload.options) && payload.options.length ? payload.options.slice(0, 30) : undefined,
      text: payload.text || undefined,
      matchedSkills: (match && match.matchedSkills) || []
    });
    const text = (res && (res.text || res.output)) || '';
    if (!text || /^NEEDS_HUMAN$/i.test(text.trim())) return { ok: false, error: 'Needs you' };
    return { ok: true, text: text.trim() };
  } catch (err) {
    if (err.status === 422) return { ok: false, error: 'Needs you' };
    if (err.code === 'UNAUTHENTICATED') return { ok: false, error: 'Sign in again: this browser is no longer connected to Career OS.' };
    if (err.status === 402) return { ok: false, error: 'Your plan does not include AI answers, or this month\'s allowance is used up.' };
    if (err.status === 429) return { ok: false, error: 'Too many AI requests in a minute; CareerOS will retry.' };
    return { ok: false, error: err.message };
  }
}

function canRunOn(url) {
  try {
    return chrome.permissions.contains({ origins: [`${new URL(url).origin}/*`] });
  } catch (err) {
    return Promise.resolve(false);
  }
}

async function checkRemoteControl() {
  if (!(await Api.isPaired())) return;
  const { command } = await Api.control();
  if (command === 'start') {
    const res = await handleEngineCommand({ command: 'start' });
    const state = res.state || {};
    notifyRemote(state.running ? 'CareerOS started applying' : 'CareerOS could not start', state.running ? 'Started from the Auto Apply page.' : (res.error || state.lastError || ''));
  } else if (command === 'stop') {
    await Engine.stop('Stopped from the Auto Apply page');
    notifyRemote('CareerOS stopped', 'Stopped from the Auto Apply page.');
  }
}

function notifyRemote(title, message) {
  chrome.notifications.create('', { type: 'basic', iconUrl: chrome.runtime.getURL('icons/icon128.png'), title, message: String(message || '').slice(0, 200) });
}

function logError(what) {
  return (err) => console.warn(`CareerOS: ${what} failed:`, err && err.message);
}
