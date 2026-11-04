/* End-to-end test of LinkedIn and Indeed in the real extension (Chromium).
 *
 * LinkedIn and Indeed can't be signed into from a test, so stand-in pages are served at their real addresses
 * (www.linkedin.com, www.indeed.com, smartapply.indeed.com, boards.greenhouse.io) through Playwright routing,
 * built the way those sites build their apply flows: LinkedIn's Easy Apply window (multi-step, a location
 * search box, a saved-resume step, Yes/No and select questions), LinkedIn's "Apply on company website", and
 * Indeed Apply opening in a new tab. Checks:
 *   - a run completes Easy Apply and Indeed Apply and submits once each
 *   - "Apply on company website" is followed to the employer's form and submitted there
 *   - in the default mode (fills, you submit) Fill opens Easy Apply, fills each step as the person presses
 *     Next, and never submits
 *   - harvesting a LinkedIn search page reads clean titles
 *   - a run searches LinkedIn and Indeed by itself in a background tab and queues what it finds
 *   - a run moves straight on from one employer's application to the next (the pacing gap is per company)
 *
 *   node extension/test/e2e-boards.mjs     (set CHROMIUM_PATH to use a specific Chromium)
 */
import http from 'node:http';
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const ext = path.resolve(here, '..');
const seen = { submissions: [], applications: [] };
const DESCRIPTION = 'We are hiring a QA Analyst to own test plans, automation with Selenium and Cypress, regression suites, and release quality for our payments platform. You will work with engineers and product managers to ship reliable software. '.repeat(2);

/* ---------- stand-in Career OS API ---------- */
const api = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const json = (status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/api/extension/sync') {
    return json(200, {
      entitled: true,
      settings: { minMatchScore: 0, pacingSeconds: 10, concurrency: 1, autoSubmit: true, platformModes: { linkedin: 'auto', indeed: 'auto' }, monthlyLimit: 100 },
      resume: { data: {} }, appliedThisMonth: 0, appliedUrls: [], answers: [],
    });
  }
  if (p === '/api/extension/application') { seen.applications.push(JSON.parse(body)); return json(200, { ok: true }); }
  if (p === '/api/extension/jobgpt/generate') return json(422, { error: 'Needs you' });
  if (p === '/api/extension/package') return json(200, { tailored: false });
  if (p === '/api/extension/jobs') return json(200, { jobs: [] });
  if (p === '/api/extension/control') return json(200, { command: null });
  return json(200, { ok: true });
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const apiBase = `http://127.0.0.1:${api.address().port}/api/extension`;

/* ---------- stand-in job board pages ---------- */
const easyApplyPage = (id, title) => `<!doctype html><html><head><title>${title} | Northwind | LinkedIn</title></head><body>
<h1 class="job-details-jobs-unified-top-card__job-title">${title}</h1>
<div class="job-details-jobs-unified-top-card__company-name">Northwind</div>
<button class="jobs-apply-button artdeco-button" aria-label="Easy Apply to ${title} at Northwind"><span>Easy Apply</span></button>
<div id="job-details" class="jobs-description__content">${DESCRIPTION}</div>
<script>
const steps = [
  \`<h3>Contact info</h3>
   <div class="fb-dash-form-element"><label for="fn">First name</label><input id="fn" value="Ada" required></div>
   <div class="fb-dash-form-element"><label for="ln">Last name</label><input id="ln" value="Lovelace" required></div>
   <div class="fb-dash-form-element"><label for="em">Email address</label><select id="em" required><option>ada@example.com</option></select></div>
   <div class="fb-dash-form-element"><label for="ph">Mobile phone number</label><input id="ph" required></div>
   <div class="fb-dash-form-element"><label for="city">Location (city)</label><input id="city" role="combobox" aria-autocomplete="list" aria-controls="city-list" required>
     <div id="city-list" role="listbox"></div></div>\`,
  \`<h3>Resume</h3><div class="jobs-document-upload-redesign-card__container--selected" aria-checked="true">Ada_Lovelace_CV.pdf · last used</div>
   <label for="up">Upload resume</label><input id="up" type="file" style="display:none">\`,
  \`<h3>Additional questions</h3>
   <div class="fb-dash-form-element"><label for="yrs">How many years of work experience do you have with Selenium?</label><input id="yrs" type="text" required></div>
   <fieldset aria-required="true"><legend><span>Are you legally authorized to work in the United States?</span></legend>
     <input type="radio" id="au-y" name="auth" value="Yes" required><label for="au-y">Yes</label>
     <input type="radio" id="au-n" name="auth" value="No"><label for="au-n">No</label></fieldset>
   <div class="fb-dash-form-element"><label for="sp">Will you now or in the future require sponsorship for employment visa status?</label>
     <select id="sp" required><option value="">Select an option</option><option>Yes</option><option>No</option></select></div>\`,
  \`<h3>Review your application</h3><p>Check everything, then submit.</p>\`
];
let step = 0;
function render(modal) {
  const last = step === steps.length - 1;
  modal.querySelector('form').innerHTML = steps[step];
  modal.querySelector('progress').value = Math.round(step / (steps.length - 1) * 100);
  const footer = modal.querySelector('footer');
  footer.innerHTML = last
    ? '<button type="button" aria-label="Submit application" class="artdeco-button">Submit application</button>'
    : step === steps.length - 2
      ? '<button type="button" aria-label="Review your application" class="artdeco-button">Review</button>'
      : '<button type="button" aria-label="Continue to next step" class="artdeco-button">Next</button>';
  const city = modal.querySelector('#city');
  if (city) city.addEventListener('input', () => {
    const list = modal.querySelector('#city-list');
    list.innerHTML = city.value.length < 2 ? '' : ['Austin, Texas, United States', 'Austin, Minnesota, United States']
      .map((c) => '<div role="option" class="basic-typeahead__selectable">' + c + '</div>').join('');
    list.querySelectorAll('[role=option]').forEach((o) => o.addEventListener('click', () => { city.value = o.textContent; list.innerHTML = ''; }));
  });
  footer.querySelector('button').addEventListener('click', async () => {
    const missing = Array.from(modal.querySelectorAll('[required]')).filter((el) =>
      el.type === 'radio' ? !modal.querySelector('input[name="' + el.name + '"]:checked') : !el.value);
    modal.querySelector('.errors').innerHTML = missing.length ? '<div class="artdeco-inline-feedback--error" role="alert">Please enter a valid answer</div>' : '';
    if (missing.length) return;
    if (last) {
      await fetch('/__submit/${id}', { method: 'POST', body: JSON.stringify(window.__answers || {}) });
      modal.innerHTML = '<h2>Your application was sent to Northwind</h2><button aria-label="Dismiss">Done</button>';
      return;
    }
    window.__answers = Object.assign(window.__answers || {}, Object.fromEntries(Array.from(modal.querySelectorAll('input:not([type=radio]):not([type=file]), select')).map((e) => [e.id, e.value]).concat(
      Array.from(modal.querySelectorAll('input[type=radio]:checked')).map((e) => [e.name, e.value]))));
    step += 1; render(modal);
  });
}
document.querySelector('.jobs-apply-button').addEventListener('click', () => {
  const modal = document.createElement('div');
  modal.className = 'jobs-easy-apply-modal artdeco-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'jobs-apply-header');
  modal.innerHTML = '<h2 id="jobs-apply-header">Apply to Northwind</h2><progress max="100" value="0"></progress><form class="jobs-easy-apply-form"></form><div class="errors"></div><footer></footer>';
  document.body.appendChild(modal);
  render(modal);
});
</script></body></html>`;

const externalPage = `<!doctype html><html><body>
<h1 class="job-details-jobs-unified-top-card__job-title">Data Analyst</h1>
<div class="job-details-jobs-unified-top-card__company-name">Contoso</div>
<button class="jobs-apply-button" aria-label="Apply to Data Analyst on company website"><span>Apply</span></button>
<div id="job-details">${DESCRIPTION}</div>
<script>document.querySelector('.jobs-apply-button').onclick = () => window.open('https://boards.greenhouse.io/contoso/jobs/77', '_blank');</script>
</body></html>`;

const greenhousePage = `<!doctype html><html><body><h1 class="app-title">Data Analyst</h1><div class="company-name">Contoso</div>
<form id="application_form" method="post" action="/__submit/gh">
<label for="first_name">First Name *</label><input id="first_name" name="first_name" required>
<label for="last_name">Last Name *</label><input id="last_name" name="last_name" required>
<label for="email">Email *</label><input id="email" name="email" type="email" required>
<label for="phone">Phone *</label><input id="phone" name="phone" required>
<input type="submit" value="Submit Application"></form></body></html>`;

const indeedJob = `<!doctype html><html><body><h1 class="jobsearch-JobInfoHeader-title">QA Engineer</h1><div data-company-name="true">Fabrikam</div>
<div id="jobDescriptionText">${DESCRIPTION}</div>
<button id="indeedApplyButton" class="ia-IndeedApplyButton"><span>Apply now</span></button>
<script>document.getElementById('indeedApplyButton').onclick = () => window.open('https://smartapply.indeed.com/beta/indeedapply/form/contact-info?jk=abc123', '_blank');</script>
</body></html>`;

const indeedApply = `<!doctype html><html><body><div class="ia-BasePage-content"><main id="app"></main></div>
<script>
const steps = [
  '<h1>Add your contact information</h1><form><label for="fn">First name</label><input id="fn" name="fn" required><label for="ln">Last name</label><input id="ln" name="ln" required><label for="ph">Phone number</label><input id="ph" name="ph" required><label for="city">City, State</label><input id="city" name="city"></form>',
  '<h1>Answer these questions from the employer</h1><form><div class="ia-Questions-item"><fieldset><legend>Are you authorized to work in the United States? *</legend><label><input type="radio" name="q1" value="Yes" required> Yes</label><label><input type="radio" name="q1" value="No"> No</label></fieldset></div><div class="ia-Questions-item"><label for="q2">How many years of QA experience do you have? *</label><input id="q2" name="q2" required></div></form>',
  '<h1>Please review your application</h1><p>Fabrikam · QA Engineer</p>'
];
let step = 0; const data = {};
function render() {
  const app = document.getElementById('app');
  const last = step === steps.length - 1;
  app.innerHTML = steps[step] + (last ? '<button type="button" class="ia-continueButton">Submit your application</button>' : '<button type="button" data-testid="continue-button" class="ia-continueButton">Continue</button>');
  app.querySelector('button').onclick = async () => {
    const f = app.querySelector('form');
    if (f) {
      const missing = Array.from(f.querySelectorAll('[required]')).filter((el) => el.type === 'radio' ? !f.querySelector('input[name="' + el.name + '"]:checked') : !el.value);
      if (missing.length) return;
      new FormData(f).forEach((v, k) => { data[k] = v; });
    }
    if (last) { await fetch('/__submit/indeed', { method: 'POST', body: JSON.stringify(data) }); app.innerHTML = '<h1>Your application has been submitted!</h1>'; return; }
    step += 1; render();
  };
}
render();
</script></body></html>`;

const linkedinSearch = `<!doctype html><html><body><ul class="jobs-search__results-list">${[1, 2, 3].map((n) => `
<li data-occludable-job-id="50${n}"><div class="job-card-container" data-job-id="50${n}">
<a class="job-card-list__title--link" href="/jobs/view/50${n}/?trk=x" aria-label="QA Analyst ${n} with verification"><span aria-hidden="true"><strong>QA Analyst ${n}</strong> with verification</span><span class="visually-hidden">QA Analyst ${n} with verification</span></a>
<div class="artdeco-entity-lockup__subtitle">Company ${n}</div><ul><li class="job-card-container__metadata-item">Remote</li></ul><span>Easy Apply</span></div></li>`).join('')}
</ul></body></html>`;

/* ---------- the extension, allowed on these sites ---------- */
const extDir = mkdtempSync(path.join(tmpdir(), 'careeros-ext-'));
cpSync(ext, extDir, { recursive: true, filter: (src) => !src.includes(`${path.sep}test`) });
const manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
manifest.host_permissions.push('http://127.0.0.1/*', 'https://*.linkedin.com/*', 'https://*.indeed.com/*', 'https://smartapply.indeed.com/*', 'https://*.greenhouse.io/*');
writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest));

/* The job-board addresses resolve to a local HTTPS server inside this test browser only (tabs the extension
   opens itself load before any Playwright routing could attach, so routing can't be used). */
const certDir = mkdtempSync(path.join(tmpdir(), 'careeros-cert-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
  '-keyout', path.join(certDir, 'key.pem'), '-out', path.join(certDir, 'cert.pem')], { stdio: 'ignore' });
const boards = https.createServer({ key: readFileSync(path.join(certDir, 'key.pem')), cert: readFileSync(path.join(certDir, 'cert.pem')) }, async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const u = new URL(req.url, `https://${req.headers.host}`);
  const send = (content, type = 'text/html') => { res.writeHead(200, { 'content-type': type }); res.end(content); };
  if (u.pathname.startsWith('/__submit/')) {
    seen.submissions.push({ id: u.pathname.split('/')[2], body });
    return u.pathname.startsWith('/__submit/gh') ? send('<h1>Thank you for applying!</h1><p>Your application has been submitted.</p>') : send('{}', 'application/json');
  }
  const host = u.hostname;
  if (host === 'www.linkedin.com' && u.pathname === '/jobs/view/4001/') return send(easyApplyPage('li-4001', 'QA Analyst'));
  if (host === 'www.linkedin.com' && u.pathname === '/jobs/view/4003/') return send(easyApplyPage('li-4003', 'Senior QA Analyst'));
  if (host === 'www.linkedin.com' && u.pathname === '/jobs/view/4002/') return send(externalPage);
  if (host === 'www.linkedin.com' && u.pathname.startsWith('/jobs/search')) return send(linkedinSearch);
  if (host === 'boards.greenhouse.io') return send(greenhousePage.replace('/__submit/gh', `/__submit/gh${u.pathname.split('/').pop() === '77' ? '' : '-' + u.pathname.split('/').pop()}`));
  if (host === 'www.indeed.com') return send(indeedJob);
  if (host === 'smartapply.indeed.com') return send(indeedApply);
  res.writeHead(404); res.end();
});
await new Promise((r) => boards.listen(0, '127.0.0.1', r));
const bport = boards.address().port;
const hostRules = ['www.linkedin.com', 'www.indeed.com', 'smartapply.indeed.com', 'boards.greenhouse.io'].map((h) => `MAP ${h} 127.0.0.1:${bport}`).join(', ');

const context = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'careeros-profile-')), {
  headless: true,
  channel: 'chromium',
  executablePath: process.env.CHROMIUM_PATH || undefined,
  ignoreHTTPSErrors: true,
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, `--host-resolver-rules=${hostRules}`, '--ignore-certificate-errors', '--no-proxy-server'],
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');

const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jobState = (id) => sw.evaluate(async (jid) => (await self.CareerOS.Engine.getState()).queue.find((j) => j.id === jid), id);
async function waitFor(fn, ms, what) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await fn(); if (v) return v; await sleep(300); }
  throw new Error(`Timed out: ${what}`);
}
async function runJob(job) {
  await sw.evaluate(async (j) => {
    self.CareerOS.Engine.runtime.gateUntil.clear(); // skip the pacing gap for the test
    await handleEngineCommand({ command: 'add', jobs: [j] });
    return handleEngineCommand({ command: 'start' });
  }, job);
  return waitFor(async () => { const j = await jobState(job.id); return j && ['submitted', 'failed', 'skipped', 'assisted', 'waiting'].includes(j.state) ? j : null; }, 90000, `${job.id} finished`);
}

try {
  await sw.evaluate(async ({ apiBase }) => {
    const { Storage, Permissions } = self.CareerOS;
    await Storage.saveSettings({ apiBase, deviceToken: 't', autoSubmit: true, platformModes: { linkedin: 'auto', indeed: 'auto' }, acknowledgedRestricted: true, dailyLimit: 50, searchJobBoards: false });
    await Storage.saveProfile({
      identity: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+1 555 0100', city: 'Austin', state: 'Texas', country: 'United States' },
      experience: { currentTitle: 'QA Analyst', totalYears: 6, history: [] },
      workAuth: { needsSponsorship: false, authorizedIn: ['US'] },
      targeting: { titles: ['QA Analyst'] },
      skills: { core: ['Selenium', 'Cypress'] },
    });
    await Storage.saveResume({ name: 'Ada_CV.pdf', mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK' });
    await Permissions.registerScripts();
  }, { apiBase });

  /* 1. LinkedIn Easy Apply, in a run. */
  const li = await runJob({ id: 'li-4001', url: 'https://www.linkedin.com/jobs/view/4001/', title: 'QA Analyst', company: 'Northwind', ats: 'linkedin', location: 'Remote', easyApply: true });
  check(li.state === 'submitted', `LinkedIn Easy Apply submitted (${li.state}${li.detail ? `: ${li.detail}` : ''})`);
  const sub = seen.submissions.find((s) => s.id === 'li-4001');
  const answers = sub ? JSON.parse(sub.body) : {};
  check(answers.ph === '+1 555 0100' && /^Austin, Texas/.test(answers.city || ''), `filled phone and picked the city suggestion (${answers.city})`);
  check(answers.auth === 'Yes' && answers.sp === 'No' && answers.yrs === '6', 'answered work authorization, sponsorship and years of experience');
  check(seen.submissions.filter((s) => s.id === 'li-4001').length === 1, 'submitted exactly once');

  /* 2. LinkedIn "Apply on company website": followed to the employer's form in the new tab. */
  const ext = await runJob({ id: 'li-4002', url: 'https://www.linkedin.com/jobs/view/4002/', title: 'Data Analyst', company: 'Contoso', ats: 'linkedin', location: 'Remote' });
  check(ext.state === 'submitted' && seen.submissions.some((s) => s.id === 'gh'), `followed "Apply on company website" to Greenhouse and submitted there (${ext.state}${ext.detail ? `: ${ext.detail}` : ''})`);
  check(await sw.evaluate(() => self.CareerOS.Storage.alreadyApplied('https://www.linkedin.com/jobs/view/4002/')).then(Boolean), 'the LinkedIn listing counts as applied, so it isn\'t queued again');

  /* 3. Indeed Apply, which opens in a new tab. */
  const ind = await runJob({ id: 'in-abc', url: 'https://www.indeed.com/viewjob?jk=abc123', title: 'QA Engineer', company: 'Fabrikam', ats: 'indeed', location: 'Remote' });
  const isub = seen.submissions.find((s) => s.id === 'indeed');
  const idata = isub ? JSON.parse(isub.body) : {};
  check(ind.state === 'submitted' && idata.fn === 'Ada' && idata.q1 === 'Yes' && idata.q2 === '6', `Indeed Apply followed into its tab and submitted (${ind.state}${ind.detail ? `: ${ind.detail}` : ''})`);

  /* 4. Default mode (fills, you submit): Fill on a LinkedIn job the person has open. */
  await sw.evaluate(() => self.CareerOS.Storage.saveSettings({ platformModes: { linkedin: 'default' } }));
  const page = await context.newPage();
  await page.goto('https://www.linkedin.com/jobs/view/4003/');
  await sleep(1500);
  const tabId = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://www.linkedin.com/jobs/view/4003/' }))[0].id);
  const fill = await sw.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'careeros:fill' }), tabId);
  check(fill && fill.ok && (await page.inputValue('#ph')) === '+1 555 0100', 'Fill opened Easy Apply and filled the first step');
  await page.click('button[aria-label="Continue to next step"]');
  await page.click('button[aria-label="Continue to next step"]');
  // Filled once the person pauses (nothing is written while they're clicking through).
  await waitFor(async () => (await page.inputValue('#yrs').catch(() => '')) === '6' && (await page.isChecked('#au-y').catch(() => false)) && (await page.inputValue('#sp').catch(() => '')) === 'No', 20000, 'next step filled').catch(() => {});
  check(await page.isChecked('#au-y') && (await page.inputValue('#sp')) === 'No' && (await page.inputValue('#yrs')) === '6', 'filled each new step as the person pressed Next');
  await sleep(2000);
  check(!seen.submissions.some((s) => s.id === 'li-4003') && (await page.isVisible('button[aria-label="Review your application"]')), 'never pressed submit (the person does)');

  /* 5. Harvest a LinkedIn search page. */
  await page.goto('https://www.linkedin.com/jobs/search/?keywords=qa');
  await sleep(1500);
  const searchTab = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://www.linkedin.com/jobs/search/*' }))[0].id);
  const harvest = await sw.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'careeros:harvest' }), searchTab);
  check(harvest.jobs.length === 3 && harvest.jobs[0].title === 'QA Analyst 1' && harvest.jobs[0].url === 'https://www.linkedin.com/jobs/view/501/', `read the LinkedIn results (${harvest.jobs.map((j) => j.title).join(', ')})`);

  /* 6. Start with nothing queued: the run searches LinkedIn and Indeed itself and queues what they show. */
  await page.close();
  await sw.evaluate(async () => {
    const { Engine, Storage } = self.CareerOS;
    await Engine.stop('test');
    await Engine.setState({ queue: [] });
    await Storage.saveSettings({ searchJobBoards: true });
    Engine.runtime.boardSearchedAt = 0;
    await Engine.build(); // what Find jobs and Start run (the test browser allows only some of the boards group)
  });
  const opened = await waitFor(async () => {
    const urls = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://www.linkedin.com/jobs/search/*' })).map((t) => t.url || t.pendingUrl));
    return urls.length ? urls : null;
  }, 15000, 'LinkedIn search opened');
  check(opened.some((u) => /keywords=QA\+Analyst/.test(u) && /f_AL=true/.test(u)), `opened the person's LinkedIn search for their target role, Easy Apply only (${opened[0]})`);
  const queued = await waitFor(async () => {
    const q = (await sw.evaluate(async () => (await self.CareerOS.Engine.getState()).queue)).filter((j) => j.ats === 'linkedin');
    return q.length >= 3 ? q : null;
  }, 30000, 'LinkedIn jobs queued');
  check(queued.length === 3 && queued.every((j) => j.state === 'queued' && /linkedin\.com\/jobs\/view\/50\d\//.test(j.url)), `queued the LinkedIn results for the run (${queued.map((j) => j.title).join(', ')})`);
  await waitFor(() => sw.evaluate(async () => !self.CareerOS.Engine.runtime.boardSearch), 70000, 'board search finished');
  const leftOpen = await sw.evaluate(async () => (await chrome.tabs.query({})).filter((t) => /\/jobs\/search|indeed\.com\/jobs/.test(t.url)).length);
  check(leftOpen === 0, `closed the search tabs it opened (${leftOpen} left)`);

  /* 7. Three employers in a row: no clearing of the pacing gap, the run goes from one to the next. */
  await sw.evaluate(async () => {
    const { Engine, Storage } = self.CareerOS;
    await Storage.saveSettings({ searchJobBoards: false, concurrency: 1 });
    await Engine.setState({ queue: [] });
    Engine.runtime.gateUntil.clear();
    await handleEngineCommand({ command: 'add', jobs: [1, 2, 3].map((n) => ({ id: `gh-${n}`, url: `https://boards.greenhouse.io/company${n}/jobs/${900 + n}`, title: 'QA Analyst', company: `Company ${n}`, ats: 'greenhouse', location: 'Remote' })) });
    await handleEngineCommand({ command: 'start' });
  });
  const t0 = Date.now();
  await waitFor(async () => (await Promise.all(['gh-1', 'gh-2', 'gh-3'].map(jobState))).every((j) => j && j.state === 'submitted'), 90000, 'three employers submitted').catch((e) => check(false, e.message));
  const states = await Promise.all(['gh-1', 'gh-2', 'gh-3'].map(jobState));
  check(states.every((j) => j.state === 'submitted') && ['gh-901', 'gh-902', 'gh-903'].every((id) => seen.submissions.some((x) => x.id === id)),
    `went on from one application to the next by itself: ${states.map((j) => `${j.company} ${j.state}${j.detail ? ` (${j.detail})` : ''}`).join(', ')} in ${Math.round((Date.now() - t0) / 1000)}s`);
} catch (err) {
  failures.push(err.message);
  console.log(`✗ ${err.message}`);
} finally {
  await context.close();
  api.close();
  boards.close();
}
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
