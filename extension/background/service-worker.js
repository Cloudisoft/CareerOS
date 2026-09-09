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
  '/lib/permissions.js',
  '/lib/harvest.js',
  '/lib/discovery.js',
  '/background/engine.js'
);

const { Storage, Profile, Engine, Policy, Api, Permissions } = self.CareerOS;

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

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  const tabId = sender.tab && sender.tab.id;

  /* --- engine protocol --- */
  if (msg.type === 'careeros:ready') {
    Engine.handleReady(tabId).then((directive) => respond(directive || { job: null }));
    return true;
  }
  if (msg.type === 'careeros:result') {
    Engine.handleResult(tabId, msg.result).then(() => respond({ ok: true }));
    return true;
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
  return false;
});

/* Pull the current profile and targeting from CareerOS before a run, so the
   extension is never applying from a profile the person edited last week on
   another device. */
async function syncFromServer() {
  const payload = await Api.sync();

  if (payload.entitled === false) {
    return { ok: false, entitled: false, message: payload.message };
  }

  if (payload.settings) {
    await Storage.saveSettings({
      minMatchScore: payload.settings.minMatchScore,
      dailyLimit: payload.settings.dailyLimit,
      pacingSeconds: payload.settings.pacingSeconds,
      concurrency: payload.settings.concurrency,
      autoSubmit: payload.settings.autoSubmit,
      platformModes: payload.settings.platformModes || {},
    });
  }

  if (payload.resume?.data) {
    const existing = (await Storage.getProfile()) || {};
    await Storage.saveProfile(Object.assign({}, existing, payload.resume.data));
  }

  return { ok: true, entitled: true, appliedToday: payload.appliedToday, appliedUrls: payload.appliedUrls || [] };
}

async function handleEngineCommand(msg) {
  if (msg.command === 'pair')    return pairDevice(msg.code);
  if (msg.command === 'connect') return Api.connect();
  if (msg.command === 'permissions') return { ok: true, granted: await Permissions.status() };
  if (msg.command === 'reregister')  return { ok: true, ...(await Permissions.registerScripts()) };
  if (msg.command === 'sync')   return syncFromServer();
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
  if (msg.command === 'add')    return Object.assign({ ok: true }, await Engine.add(msg.jobs));
  if (msg.command === 'clear')  return { ok: true, state: await Engine.setState({ queue: [], done: [], running: false }) };
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
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'careeros:badge') return updateBadge();
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
      ...(settings.apiToken ? { Authorization: `Bearer ${settings.apiToken}` } : {})
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
