/* Ask once, then remember: question cards in a real browser.
 *
 * The first application re-draws its whole form a moment after it loads (as React sites do while they start up)
 * and asks two things CareerOS can't know: a required question about the office, and an optional
 * self-identification question it has never been told. Checks:
 *   - the form that's actually on the page gets filled, not the discarded first copy
 *   - one small card per question appears beside it ("Question 1 of 2"), without blocking the page
 *   - answering moves the card on by itself; "Prefer not to say" on the card answers the sensitive one
 *   - the run then submits by itself, and the answers are saved (self-identification by meaning)
 *   - the next form asks the same things in other words: filled from the saved answers and submitted without
 *     stopping or showing a card; the postal code typed on the first form fills "Postal code" on the next
 *   - "Auto apply" on a job's page on the CareerOS website (content/bridge.js): the extension announces itself, the
 *     posting opens in a new tab, and it's filled and submitted from what CareerOS remembers
 *
 *   node extension/test/e2e-ask-once.mjs        (needs Playwright's Chromium; set CHROMIUM_PATH to override)
 */
import http from 'node:http';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const ext = path.resolve(here, '..');
const seen = { submissions: [], answers: [] };

function page(n) {
  const office = n === 1 ? 'Are you open to working in-person in our office 3 days a week?' : 'Can you work from the office three days per week?';
  const gender = n === 1 ? 'Gender' : 'What is your gender identity?';
  // The postal code isn't in the profile: asked once on the first form, then filled however it's worded.
  const zip = n === 1 ? 'Zip Code / Postal Code (Non-U.S. based candidates, please enter "00000")' : 'Postal code';
  const genderOptions = n === 1 ? ['Male', 'Female', 'Non-binary', 'Decline to self identify'] : ['Man', 'Woman', 'Non-binary', "I don't wish to answer"];
  const form = `<form id="application-form" method="post" action="/submit/${n}">
    <p><label for="first_name">First name *</label><input id="first_name" name="first_name" required></p>
    <p><label for="last_name">Last name *</label><input id="last_name" name="last_name" required></p>
    <p><label for="email">Email *</label><input id="email" name="email" type="email" required></p>
    <div style="height:900px"></div>
    <p><label for="office">${office} *</label><select id="office" name="office" required><option value="">Select...</option><option>Yes</option><option>No</option></select></p>
    <p><label for="zip">${zip} *</label><input id="zip" name="zip" required></p>
    <p><label for="gender">${gender}</label><select id="gender" name="gender"><option value="">Select...</option>${genderOptions.map((o) => `<option>${o}</option>`).join('')}</select></p>
    <button type="submit">Submit application</button></form>`;
  // The first form is replaced by an identical new one shortly after load (a client-side re-render).
  return `<!doctype html><html><head><title>Apply: Office Manager ${n}</title></head><body style="font:15px sans-serif;max-width:700px;margin:auto">
<h1>Office Manager</h1><div id="root">${form}</div>
<script>${n === 1 ? `setTimeout(function () { document.getElementById('root').innerHTML = ${JSON.stringify(form)}; }, 400);` : ''}</script>
</body></html>`;
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
  if (p === '/apply/1' || p === '/apply/2' || p === '/apply/3') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page(Number(p.slice(-1)))); }
  if (p === '/jobs/abc') {
    // Stand-in for a job's page on the CareerOS website, with the "Auto apply" button's message.
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(`<!doctype html><html><body><h1>Office Manager at Fabrikam</h1><button id="auto">Auto apply</button><pre id="log"></pre>
<script>
  window.addEventListener('message', function (e) { if (e.data && e.data.source === 'careeros-extension') document.getElementById('log').textContent += JSON.stringify(e.data) + '\\n'; });
  window.postMessage({ type: 'careeros-extension:ping' }, location.origin);
  document.getElementById('auto').onclick = function () {
    window.postMessage({ type: 'careeros-extension:apply', requestId: 'r1', job: { id: 'abc', url: location.origin + '/apply/3', title: 'Office Manager', company: 'Fabrikam', location: 'Austin' } }, location.origin);
  };
</script></body></html>`);
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

const extDir = mkdtempSync(path.join(tmpdir(), 'careeros-ext-'));
cpSync(ext, extDir, { recursive: true, filter: (src) => !src.includes(`${path.sep}test`) && !src.endsWith('.zip') });
const manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
manifest.host_permissions.push(`${origin}/*`);
manifest.content_scripts[0].matches.push(`${origin}/*`); // the website bridge, on the stand-in website
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
const card = (pg) => pg.evaluate(() => {
  const host = document.querySelector('[data-careeros-asker]');
  const c = host && host.shadowRoot && host.shadowRoot.querySelector('.card');
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { step: c.querySelector('.step')?.textContent, q: c.querySelector('.q')?.textContent, decline: !!c.querySelector('[data-act="decline"]'), top: r.top, bottom: r.bottom, inside: r.top >= 0 && r.bottom <= innerHeight };
});

try {
  await sw.evaluate(async ({ api }) => {
    const { Storage, Permissions } = self.CareerOS;
    await Storage.saveSettings({ apiBase: api, deviceToken: 'test-token', autoSubmit: true, platformModes: { generic: 'auto' }, reviewCountdown: 2, launcherTipSeenAt: 1, panelTutorialSeenAt: 1 });
    await Storage.saveProfile({ identity: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+1 555 0100', city: 'Austin', country: 'United States' } });
    await Permissions.registerScripts();
  }, { api: `${origin}/api/extension` });

  /* 1. First form: re-drawn after load, one required question and one sensitive one. */
  await sw.evaluate(async (o) => {
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-1', url: `${o}/apply/1`, title: 'Office Manager', company: 'Northwind', ats: 'generic', location: 'Austin' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  const waiting = await waitFor(async () => { const j = await jobState('job-1'); return j && j.state === 'waiting' ? j : null; }, 60000, 'job-1 waiting for the person');
  const p1 = await pageFor('/apply/1');
  check((await p1.inputValue('#first_name')) === 'Ada' && (await p1.inputValue('#email')) === 'ada@example.com', 'filled the form that is on the page after it was re-drawn');
  check(/3 questions/.test(waiting.detail || ''), `asks the three questions, the optional self-identification one included ("${waiting.detail}")`);

  const c1 = await waitFor(() => card(p1), 10000, 'first card');
  check(c1.step === 'Question 1 of 3' && /office/i.test(c1.q), `shows a card beside the first question ("${c1.step}: ${c1.q}")`);
  check(c1.inside, 'the card sits inside the window');
  if (process.env.SHOT) { await sleep(1200); await p1.screenshot({ path: process.env.SHOT }); }
  // The card doesn't block the page: the person can use the form under it.
  await p1.bringToFront();
  await p1.selectOption('#office', 'Yes');
  const cz = await waitFor(async () => { const c = await card(p1); return c && c.step === 'Question 2 of 3' ? c : null; }, 10000, 'card moves to the postal code');
  check(/zip/i.test(cz.q), `moved on by itself to the postal code ("${cz.q}")`);
  await p1.fill('#zip', '78701');
  const c2 = await waitFor(async () => { const c = await card(p1); return c && c.step === 'Question 3 of 3' ? c : null; }, 10000, 'card moves to the third question');
  check(/gender/i.test(c2.q) && c2.decline, 'moved on by itself to the self-identification question, which offers "Prefer not to say"');
  check(!seen.submissions.length, 'does not submit while a question is still open');

  await p1.evaluate(() => document.querySelector('[data-careeros-asker]').shadowRoot.querySelector('[data-act="decline"]').click());
  await waitFor(async () => (await jobState('job-1')).state === 'submitted', 60000, 'job-1 submitted by itself');
  const s1 = seen.submissions.find((s) => s.id === '1');
  check(!!s1 && s1.fields.office === 'Yes' && s1.fields.gender === 'Decline to self identify', `submitted by itself with the person's answers (${JSON.stringify(s1 && s1.fields)})`);
  check(seen.answers.some((a) => a.key === 'eeo:gender' && a.answer === 'Prefer not to say'), 'saved the self-identification answer by meaning');
  check(seen.answers.some((a) => /office/i.test(a.question) && a.answer === 'Yes'), 'saved the office answer');
  check(seen.answers.some((a) => a.key === 'profile:postal' && a.answer === '78701'), 'saved the postal code by meaning');

  /* 2. Same questions, other words and options: answered from memory, no card, no stop. */
  await sw.evaluate(() => self.CareerOS.Engine.runtime.gateUntil.clear());
  await sw.evaluate(() => syncOnce());
  const states = new Set();
  await sw.evaluate(async (o) => {
    await handleEngineCommand({ command: 'add', jobs: [{ id: 'job-2', url: `${o}/apply/2`, title: 'Office Manager', company: 'Contoso', ats: 'generic', location: 'Austin' }] });
    return handleEngineCommand({ command: 'start' });
  }, origin);
  let cardSeen = false;
  await waitFor(async () => {
    const j = await jobState('job-2');
    if (j) states.add(j.state);
    const pg = context.pages().find((x) => x.url().includes('/apply/2'));
    if (pg && (await card(pg).catch(() => null))) cardSeen = true;
    return j && ['submitted', 'failed', 'skipped', 'assisted'].includes(j.state);
  }, 60000, 'job-2 finished').catch(async (e) => { console.log('job-2', JSON.stringify(await jobState('job-2')), [...states], 'card', cardSeen); throw e; });
  const s2 = seen.submissions.find((s) => s.id === '2');
  check((await jobState('job-2')).state === 'submitted' && !states.has('waiting') && !cardSeen, `the next form was answered and submitted without asking again (states: ${[...states].join(' → ')})`);
  check(!!s2 && s2.fields.office === 'Yes' && s2.fields.gender === "I don't wish to answer" && s2.fields.zip === '78701', `reworded questions answered from memory (${JSON.stringify(s2 && s2.fields)})`);

  /* 3. "Auto apply" on the website: a new tab, filled and submitted from memory. */
  await sw.evaluate(() => self.CareerOS.Engine.runtime.gateUntil.clear());
  const site = await context.newPage();
  await site.goto(`${origin}/jobs/abc`);
  await waitFor(async () => /careeros-extension:ready/.test(await site.textContent('#log')), 10000, 'extension announced itself');
  check(true, 'the extension announces itself on the CareerOS website');
  const tabsBefore = context.pages().length;
  await site.click('#auto');
  const result = await waitFor(async () => { const m = (await site.textContent('#log')).match(/\{"source":"careeros-extension","type":"careeros-extension:apply-result"[^\n]*/); return m && JSON.parse(m[0]); }, 15000, 'apply result');
  check(result.ok && result.mode === 'auto', `the website's request is accepted (${result.message || result.reason})`);
  const p3 = await pageFor('/apply/3');
  check(context.pages().length > tabsBefore, 'the posting opens in a new tab');
  await waitFor(() => seen.submissions.find((s) => s.id === '3'), 60000, 'website job submitted');
  const s3 = seen.submissions.find((s) => s.id === '3');
  check(!!p3 && s3.fields.first_name === 'Ada' && s3.fields.office === 'Yes', `filled and submitted from what CareerOS remembers (${JSON.stringify(s3.fields)})`);
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
