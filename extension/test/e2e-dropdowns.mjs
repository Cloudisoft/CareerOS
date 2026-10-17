/* Real searchable dropdowns (the react-select library, as on Greenhouse job boards) in a real browser.
 *
 * CareerOS fills what it knows and waits for questions only the person can answer. The person answers the
 * dropdowns while scrolling a long page: their choices must stay put (nothing is written while they work, or
 * over a field they touched), then CareerOS submits by itself. The next application asks the same questions in
 * other words, with other option wording: answered from what the person gave, and submitted without stopping.
 *
 *   node extension/test/e2e-dropdowns.mjs        (needs Playwright's Chromium; set CHROMIUM_PATH to override)
 */
import http from 'node:http';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const ext = path.resolve(here, '..');
const REACT_SELECT = readFileSync(path.join(here, 'fixtures/react-select.bundle.js'));

const seen = { submissions: [], answers: [] };

function select(id, label, options) {
  return `<label for="${id}">${label} *</label><div class="rs-real" data-id="${id}" data-name="${id}" data-options='${JSON.stringify(options).replace(/'/g, '&#39;')}'></div>`;
}
function page(n) {
  const again = n === 2;
  return `<!doctype html><html><head><title>Apply: Support Lead ${n}</title></head><body style="font:15px sans-serif;max-width:700px;margin:auto">
<h1>Support Lead</h1>
<form id="application-form" method="post" action="/submit/${n}">
  <label for="first_name">First name *</label><input id="first_name" name="first_name" required>
  <label for="last_name">Last name *</label><input id="last_name" name="last_name" required>
  <label for="email">Email *</label><input id="email" name="email" type="email" required>
  ${select('team_size', again ? 'How big a support team have you led?' : 'What size of support team have you led?', ['1-3 people', '4-10 people', '11-25 people', 'More than 25 people'])}
  ${select('source', again ? 'How did you first hear about this role?' : 'How did you hear about this role?', again ? ['A job board', 'The company careers site', 'Someone referred me', 'Something else'] : ['Job board', 'Company website', 'Referral', 'Other'])}
  <div style="height:1400px" aria-hidden="true"></div>
  <div id="form-error" role="alert"></div>
  <button type="submit">Submit application</button>
</form>
<script src="/react-select.js"></script>
<script>document.getElementById('application-form').addEventListener('submit', function (e) {
  var bad = [].filter.call(document.querySelectorAll('.rs-real'), function (rs) { var h = rs.querySelector('input[type=hidden]'); return !h || !h.value; });
  if (bad.length) { e.preventDefault(); document.getElementById('form-error').textContent = 'Please answer every required question.'; }
});</script></body></html>`;
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
      settings: { minMatchScore: 0, pacingSeconds: 10, concurrency: 1, autoSubmit: true, platformModes: { generic: 'auto' }, monthlyLimit: 100 },
      resume: { data: {} }, appliedThisMonth: seen.submissions.length, appliedUrls: [],
      answers: seen.answers.map((a) => ({ key: a.key || null, question: a.question, answer: a.answer })),
    });
  }
  if (p === '/api/extension/answers') { seen.answers.push(...JSON.parse(body).answers); return json(200, { ok: true }); }
  if (p === '/api/extension/jobgpt/generate') return json(422, { error: 'Needs you' }); // only the person knows these
  if (p.startsWith('/api/extension/')) return json(200, { ok: true, tailored: false, jobs: [], command: null });
  if (p === '/react-select.js') { res.writeHead(200, { 'content-type': 'application/javascript' }); return res.end(REACT_SELECT); }
  if (p === '/apply/1' || p === '/apply/2') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page(Number(p.slice(-1)))); }
  if (p.startsWith('/submit/')) {
    seen.submissions.push({ id: p.split('/')[2], fields: Object.fromEntries(new URLSearchParams(body)) });
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<html><body><h1>Thank you for applying!</h1><p>Your application has been submitted.</p></body></html>');
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const extDir = mkdtempSync(path.join(tmpdir(), 'careeros-ext-'));
cpSync(ext, extDir, { recursive: true, filter: (src) => !src.includes(`${path.sep}test`) && !src.endsWith('.zip') });
const manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
manifest.host_permissions.push(`${origin}/*`);
writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest));

const context = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'careeros-profile-')), {
  headless: true,
  channel: 'chromium',
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, '--no-proxy-server'],
  viewport: { width: 1280, height: 800 },
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
    await Storage.saveSettings({ apiBase: api, deviceToken: 'test-token', autoSubmit: true, platformModes: { generic: 'auto' }, reviewCountdown: 2, launcherTipSeenAt: 1, panelTutorialSeenAt: 1 });
    await Storage.saveProfile({ identity: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+1 555 0100', city: 'Austin', country: 'United States' } });
    await Permissions.registerScripts();
  }, { api: `${origin}/api/extension` });

  /* 1. Questions only the person can answer, in real react-select dropdowns. */
  await sw.evaluate(async (o) => {
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-1', url: `${o}/apply/1`, title: 'Support Lead', company: 'Northwind', ats: 'generic', location: 'Remote' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  await waitFor(async () => { const j = await jobState('job-1'); return j && j.state === 'waiting'; }, 60000, 'job-1 waiting for the person');
  const page1 = await pageFor('/apply/1'); page1.on('console', (m) => { if (m.text().includes('CAREEROS-DBG')) console.log(m.text()); });
  await page1.bringToFront();
  check((await page1.inputValue('#first_name')) === 'Ada', 'filled what it knows (name)');

  const shown = (id) => page1.evaluate((i) => document.querySelector(`.rs-real[data-id="${i}"] .select__single-value`)?.textContent ?? '', id);
  const kept = (id) => page1.evaluate((i) => document.querySelector(`.rs-real[data-id="${i}"] input[type=hidden]`)?.value ?? '', id);
  const picks = [['team_size', '4-10 people'], ['source', 'Referral']];
  for (const [id, option] of picks) {
    await page1.locator(`.rs-real[data-id="${id}"] .select__control`).click();
    await page1.locator(`.rs-real[data-id="${id}"] .select__option`, { hasText: option }).click();
    await page1.mouse.wheel(0, 900);
    await sleep(700);
    await page1.mouse.wheel(0, -900);
    await sleep(700);
    check((await shown(id)) === option && (await kept(id)) === option, `${id}: the person's choice stays after scrolling ("${await shown(id)}")`);
  }
  check(!seen.submissions.length, 'does not submit while the person is still answering');

  await waitFor(async () => (await jobState('job-1')).state === 'submitted', 60000, 'job-1 submitted by itself');
  const s1 = seen.submissions.find((s) => s.id === '1');
  check(!!s1 && s1.fields.team_size === '4-10 people' && s1.fields.source === 'Referral', `submitted by itself with the person's choices (${JSON.stringify(s1 && s1.fields)})`);
  check(seen.submissions.filter((s) => s.id === '1').length === 1, 'submitted exactly once');
  check(seen.answers.some((a) => a.answer === '4-10 people'), 'saved the person\'s answers to Career OS');

  /* 2. The same questions, worded differently, with different option wording: no stopping. */
  const states = new Set();
  await sw.evaluate(async (o) => {
    self.CareerOS.Engine.runtime.gateUntil.clear();
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-2', url: `${o}/apply/2`, title: 'Support Team Lead', company: 'Fabrikam', ats: 'generic', location: 'Remote' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  await waitFor(async () => { const j = await jobState('job-2'); if (j) states.add(j.state); return j && ['submitted', 'failed', 'skipped', 'assisted'].includes(j.state); }, 60000, 'job-2 finished').catch(async (e) => { console.log('job-2', JSON.stringify(await jobState('job-2')), [...states]); const p2 = context.pages().find((pg) => pg.url().includes('/apply/2')); console.log('answers', JSON.stringify(seen.answers), JSON.stringify(await sw.evaluate(() => self.CareerOS.Storage.getAnswers()))); if (p2) console.log('page2', JSON.stringify(await p2.evaluate(() => [...document.querySelectorAll('.rs-real')].map((r) => [r.dataset.id, r.querySelector('.select__single-value')?.textContent])))); throw e; });
  const s2 = seen.submissions.find((s) => s.id === '2');
  check((await jobState('job-2')).state === 'submitted' && !states.has('waiting'), `the next form was answered and submitted without stopping (states: ${[...states].join(' → ')})`);
  check(!!s2 && s2.fields.team_size === '4-10 people' && s2.fields.source === 'Someone referred me', `reworded questions and options answered by meaning (${JSON.stringify(s2 && s2.fields)})`);
} catch (err) {
  failures.push(err.message);
  console.log(`✗ ${err.message}`);
} finally {
  await context.close();
  server.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
