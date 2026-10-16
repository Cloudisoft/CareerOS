/* End-to-end test of the real extension in Chromium.
 *
 * Loads extension/ unpacked against a local stand-in for the Career OS API and two application forms, then
 * checks the whole path a person sees: the run fills what it can, ignores the invisible reCAPTCHA badge,
 * waits in the tab for a question only the person can answer (with a react-select dropdown, as on
 * Greenhouse), submits by itself once they've answered, saves their answers to the server, and fills and
 * submits the next form asking the same questions (worded differently) without stopping.
 *
 *   node extension/test/e2e.mjs        (needs Playwright's Chromium; set CHROMIUM_PATH to override)
 */
import http from 'node:http';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const ext = path.resolve(here, '..');

/* ---------------- stand-in Career OS API + application forms ---------------- */

const seen = { submissions: [], applications: [], answers: [], heartbeats: [], disconnects: 0, command: null };

function formPage(id, veteranOptions) {
  return `<!doctype html><html><head><title>Apply: Support Engineer ${id}</title></head><body>
<h1>Support Engineer</h1>
<form id="application-form" method="post" action="/submit/${id}">
  <label for="first_name">First name *</label><input id="first_name" name="first_name" required>
  <label for="last_name">Last name *</label><input id="last_name" name="last_name" required>
  <label for="email">Email *</label><input id="email" name="email" type="email" required>
  <label for="phone">Phone *</label><input id="phone" name="phone" required>
  <label for="tools">Which ticketing tools have you used day to day, and for how long? *</label><textarea id="tools" name="tools" required></textarea>
  <label for="veteran">Protected Veteran Status *</label>
  <div class="rs"><div class="select__control" style="border:1px solid #999;padding:6px"><div class="select__value-container"><span class="select__placeholder">Select...</span>
    <div class="select__input-container"><input id="veteran" role="combobox" aria-autocomplete="list" aria-required="true" autocomplete="off"></div></div></div>
    <div class="select__menu" hidden></div></div>
  <div class="grecaptcha-badge" style="position:fixed;right:0;bottom:0;width:256px;height:60px"><iframe src="/recaptcha/api2/anchor?size=invisible" width="256" height="60"></iframe></div>
  <button type="submit">Submit application</button>
</form>
<script>
  var opts = ${JSON.stringify(veteranOptions)};
  var rs = document.querySelector('.rs'), input = rs.querySelector('input'), menu = rs.querySelector('.select__menu'), vc = rs.querySelector('.select__value-container');
  function render(f) {
    menu.innerHTML = '';
    opts.filter(function (o) { return o.toLowerCase().indexOf(f.toLowerCase()) >= 0; }).forEach(function (o, i) {
      var d = document.createElement('div'); d.className = 'select__option'; d.id = 'react-select-veteran-option-' + i; d.textContent = o; d.style.padding = '6px';
      d.onclick = function () { var old = vc.querySelector('.select__placeholder,.select__single-value'); if (old) old.remove();
        var sv = document.createElement('div'); sv.className = 'select__single-value'; sv.textContent = o; vc.insertBefore(sv, vc.firstChild); input.value = ''; menu.hidden = true; };
      menu.appendChild(d);
    });
    menu.hidden = false;
  }
  rs.querySelector('.select__control').addEventListener('mousedown', function () { render(''); });
  input.addEventListener('input', function () { render(input.value); });
  document.getElementById('application-form').addEventListener('submit', function (e) {
    var sv = document.querySelector('.select__single-value');
    if (!sv || !document.getElementById('tools').value) { e.preventDefault(); return; }
    var h = document.createElement('input'); h.type = 'hidden'; h.name = 'veteran'; h.value = sv.textContent; this.appendChild(h);
  });
</script></body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let body = '';
  for await (const chunk of req) body += chunk;
  const json = (status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  const p = url.pathname;
  if (p === '/api/extension/sync') {
    return json(200, {
      entitled: true,
      settings: { minMatchScore: 0, pacingSeconds: 10, concurrency: 2, autoSubmit: true, platformModes: { generic: 'auto' }, monthlyLimit: 100, dailyLimit: 100 },
      resume: { data: {} },
      appliedThisMonth: seen.submissions.length,
      appliedUrls: [],
      answers: seen.answers.map((a) => ({ key: a.key || null, question: a.question, answer: a.answer })),
    });
  }
  if (p === '/api/extension/package') return json(200, { tailored: false });
  if (p === '/api/extension/run') { seen.heartbeats.push(JSON.parse(body)); return json(200, { ok: true }); }
  if (p === '/api/extension/jobs') return json(200, { jobs: [], scanned: 0, failed: 0, reason: null });
  if (p === '/api/extension/control') { const command = seen.command; seen.command = null; return json(200, { command }); }
  if (p === '/api/extension/disconnect') { seen.disconnects += 1; return json(200, { ok: true }); }
  if (p === '/api/extension/application') { seen.applications.push(JSON.parse(body)); return json(200, { ok: true }); }
  if (p === '/api/extension/answers') { seen.answers.push(...JSON.parse(body).answers); return json(200, { ok: true }); }
  if (p === '/api/extension/jobgpt/generate') return json(422, { error: 'Needs you' }); // the AI can't know this person's tools
  if (p.startsWith('/recaptcha/')) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<html></html>'); }
  if (p === '/apply/1') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(formPage(1, ['I identify as one or more of the classifications of protected veteran', 'I am not a protected veteran', "I don't wish to answer"])); }
  if (p === '/apply/4') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(formPage(4, ['Yes', 'No', 'Decline to self-identify'])); }
  if (p === '/apply/2') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(formPage(2, ['Yes, I am a protected veteran', 'No, I am not a protected veteran', 'I prefer not to answer'])); }
  if (p === '/apply/3') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(`<!doctype html><html><body><h1>Data Analyst</h1><form method="post" action="/submit/3">
      <label for="fn">First name *</label><input id="fn" name="fn" required>
      <label for="ln">Last name *</label><input id="ln" name="ln" required>
      <label for="em">Email *</label><input id="em" name="em" type="email" required>
      <div class="g-recaptcha" style="width:304px;height:78px;border:1px solid #ccc">I'm not a robot</div>
      <textarea name="g-recaptcha-response" style="display:none"></textarea>
      <button type="submit">Submit application</button></form>
      <script>document.querySelector('form').addEventListener('submit', function (e) {
        if (document.querySelector('[name=g-recaptcha-response]').value.length < 20) e.preventDefault(); });</script></body></html>`);
  }
  if (p.startsWith('/submit/')) {
    seen.submissions.push({ id: p.split('/')[2], fields: Object.fromEntries(new URLSearchParams(body)) });
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<html><body><h1>Thank you for applying!</h1><p>Your application has been submitted.</p></body></html>');
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

/* ---------------- the extension, allowed to run on the local test origin ---------------- */

const extDir = mkdtempSync(path.join(tmpdir(), 'careeros-ext-'));
cpSync(ext, extDir, { recursive: true, filter: (src) => !src.includes(`${path.sep}test`) });
const manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
manifest.host_permissions.push(`${origin}/*`);
writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest));

const context = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'careeros-profile-')), {
  headless: true,
  channel: 'chromium',
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');

const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jobState = (id) => sw.evaluate(async (jid) => (await self.CareerOS.Engine.getState()).queue.find((j) => j.id === jid), id);
async function waitFor(fn, ms, what) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(300);
  }
  throw new Error(`Timed out: ${what}`);
}
const pageFor = (p) => waitFor(async () => context.pages().find((pg) => pg.url().includes(p)), 15000, `tab ${p}`);

try {
  await sw.evaluate(async ({ api }) => {
    const { Storage, Permissions } = self.CareerOS;
    await Storage.saveSettings({ apiBase: api, deviceToken: 'test-token', autoSubmit: true, platformModes: { generic: 'auto' }, dailyLimit: 50, tailorScreeningAnswers: true });
    await Storage.saveProfile({ identity: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+1 555 0100', city: 'Austin', country: 'United States' } });
    await Permissions.registerScripts();
  }, { api: `${origin}/api/extension` });

  /* 1. First application: one question only the person can answer. */
  await sw.evaluate(async (o) => {
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-1', url: `${o}/apply/1`, title: 'Support Engineer', company: 'Northwind', ats: 'generic', location: 'Remote' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);

  const waiting = await waitFor(async () => { const j = await jobState('job-1'); return j && j.state === 'waiting' ? j : null; }, 60000, 'job-1 waiting for the person');
  check(/question/i.test(waiting.detail || ''), `waits for the person's answer, not a CAPTCHA (the invisible badge is ignored): "${waiting.detail}"`);
  const page = await pageFor('/apply/1');
  check((await page.inputValue('#first_name')) === 'Ada' && (await page.inputValue('#phone')) === '+1 555 0100', 'filled everything it knows from the profile');
  const outlined = await page.evaluate(() => document.getElementById('tools').classList.contains('careeros-attention'));
  const drawn = await page.evaluate(() => !!document.querySelector('[data-careeros-banner]'));
  check(outlined && !drawn, 'outlines the question that needs the person (nothing else drawn on the page)');

  // The person answers slowly; focus and text stay theirs.
  await page.bringToFront();
  await page.click('#tools');
  for (const ch of 'Zendesk for four years.') { await page.keyboard.type(ch); await sleep(30); }
  await sleep(1500);
  check((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'tools', 'never takes the cursor while the person types');
  check(seen.submissions.length === 0, 'does not submit mid-answer');
  await page.click('.rs .select__control');
  await page.click('.select__option:has-text("I am not a protected veteran")');

  page.on('console', (m) => process.env.DEBUG && console.log('  page:', m.text()));
  await waitFor(async () => (await jobState('job-1')).state === 'submitted', 30000, 'job-1 submitted').catch(async (e) => {
    console.log('  job-1:', JSON.stringify(await jobState('job-1')), 'url:', page.url(), 'submissions:', seen.submissions.length);
    console.log('  active:', JSON.stringify(await sw.evaluate(() => self.CareerOS.Engine.getActive())).slice(0, 600));
    console.log('  page:', (await page.evaluate(() => document.body.innerText)).slice(0, 300));
    throw e;
  });
  check(seen.submissions.length === 1 && seen.submissions[0].fields.tools === 'Zendesk for four years.', 'submitted by itself once answered, exactly once');
  check(seen.applications.some((a) => a.outcome === 'submitted'), 'recorded the submission in Career OS');
  check(seen.heartbeats.some((h) => (h.waiting || []).some((w) => w.title === 'Support Engineer' && w.reason === 'questions')), 'reported the waiting application to Career OS for the "Needs you" list');
  check(seen.answers.some((a) => a.answer === 'Zendesk for four years.') && seen.answers.some((a) => a.key === 'eeo:veteran' && a.answer === 'No'), 'saved the answers to Career OS (veteran status by meaning)');

  /* 2. Next application asks the same questions with different wording: no stopping. */
  const states = new Set();
  await sw.evaluate(async (o) => {
    self.CareerOS.Engine.runtime.gateUntil.clear(); // skip the pacing gap for the test
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-2', url: `${o}/apply/2`, title: 'Support Specialist', company: 'Northwind', ats: 'generic', location: 'Remote' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  await waitFor(async () => { const j = await jobState('job-2'); if (j) states.add(j.state); return j && ['submitted', 'failed', 'skipped'].includes(j.state); }, 60000, 'job-2 finished');
  const j2 = await jobState('job-2');
  check(j2.state === 'submitted' && !states.has('waiting'), `second form reused the answers and submitted without stopping (states: ${[...states].join(' → ')})`);
  const s2 = seen.submissions.find((s) => s.id === '2');
  check(!!s2 && s2.fields.veteran === 'No, I am not a protected veteran' && s2.fields.tools === 'Zendesk for four years.', 'matched the differently worded veteran option');

  /* 3. A visible "I'm not a robot" check: only this application waits, then it submits by itself. */
  await sw.evaluate(async (o) => {
    self.CareerOS.Engine.runtime.gateUntil.clear();
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-3', url: `${o}/apply/3`, title: 'Data Analyst', company: 'Contoso', ats: 'generic', location: 'Remote' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  const w3 = await waitFor(async () => { const j = await jobState('job-3'); return j && j.state === 'waiting' ? j : null; }, 60000, 'job-3 waiting for the CAPTCHA');
  check(/robot|verification/i.test(w3.detail || ''), `waits for the person on a visible CAPTCHA: "${w3.detail}"`);
  const p3 = await pageFor('/apply/3');
  check((await p3.inputValue('#fn')) === 'Ada', 'filled the form before asking for the CAPTCHA');
  check(!seen.submissions.some((x) => x.id === '3'), 'did not try to submit past the CAPTCHA');
  await p3.evaluate(() => { document.querySelector('[name=g-recaptcha-response]').value = 'x'.repeat(40); }); // the person solves it
  await waitFor(async () => (await jobState('job-3')).state === 'submitted', 30000, 'job-3 submitted');
  check(seen.submissions.filter((x) => x.id === '3').length === 1, 'submitted by itself once the CAPTCHA was solved');

  /* 4. Start pressed on the Auto Apply page in Career OS: the browser picks it up and runs. */
  await sw.evaluate(async (o) => {
    self.CareerOS.Engine.runtime.gateUntil.clear();
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-4', url: `${o}/apply/4`, title: 'Support Analyst', company: 'Fabrikam', ats: 'generic', location: 'Remote' }] });
  }, origin);
  seen.command = 'start';
  await sw.evaluate(() => checkRemoteControl()); // the minute alarm, run now
  await waitFor(async () => (await jobState('job-4')).state === 'submitted', 60000, 'job-4 submitted after remote start');
  check(seen.submissions.find((x) => x.id === '4')?.fields.veteran === 'No', 'started from the web page and submitted with the saved answers');

  /* 5. Disconnect ends the session on the server too. */
  await sw.evaluate(() => handleEngineCommand({ command: 'unpair' }));
  check(seen.disconnects === 1 && !(await sw.evaluate(() => self.CareerOS.Api.isPaired())), 'disconnect ends the session on the server and here');
} catch (err) {
  failures.push(err.message);
  console.log(`✗ ${err.message}`);
} finally {
  await context.close();
  server.close();
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
