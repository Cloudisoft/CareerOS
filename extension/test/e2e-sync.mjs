/* End-to-end test of sync between the real extension and a real Career OS server.
 *
 * Needs a running Career OS (next dev/start) with a candidate account and an extension token for it:
 *
 *   CAREEROS_URL=http://127.0.0.1:3000 CAREEROS_TOKEN=<device token> \
 *   CAREEROS_EMAIL=<email> CAREEROS_PASSWORD=<password> node extension/test/e2e-sync.mjs
 *
 * Checks, through the options page a person uses: the profile and settings come down from the website;
 * what the person changes in the extension goes up to the website; what they change on the website comes
 * down without undoing their extension edits; restricted boards need the acknowledgment; Disconnect ends
 * the session on the server.
 */
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const { CAREEROS_URL, CAREEROS_TOKEN, CAREEROS_EMAIL, CAREEROS_PASSWORD } = process.env;
if (!CAREEROS_URL || !CAREEROS_TOKEN || !CAREEROS_EMAIL || !CAREEROS_PASSWORD) {
  console.log('Skipped: set CAREEROS_URL, CAREEROS_TOKEN, CAREEROS_EMAIL and CAREEROS_PASSWORD.');
  process.exit(0);
}
const origin = new URL(CAREEROS_URL).origin;
const here = path.dirname(new URL(import.meta.url).pathname);
const ext = path.resolve(here, '..');

/* The website, as the person signed in to it sees it. */
let cookie = '';
async function web(p, init = {}) {
  const res = await fetch(`${origin}${p}`, { ...init, headers: { 'content-type': 'application/json', cookie, ...(init.headers || {}) } });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(/,(?=\s*\w+=)/).map((c) => c.split(';')[0]).join('; ');
  return { status: res.status, body: await res.json().catch(() => null) };
}
const asExtension = (p) => fetch(`${origin}/api/extension${p}`, { headers: { authorization: `Bearer ${CAREEROS_TOKEN}` } }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

const login = await web('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: CAREEROS_EMAIL, password: CAREEROS_PASSWORD }) });
if (login.status !== 200) throw new Error(`Could not sign in to the website: ${login.status}`);

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
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');
const extId = new URL(sw.url()).host;

const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms, what) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) { check(false, `timed out: ${what}`); return v; }
    await sleep(400);
  }
}
const local = () => sw.evaluate(async () => ({ profile: await self.CareerOS.Storage.getProfile(), settings: await self.CareerOS.Storage.getSettings() }));

try {
  // Connected, as after Sign in (the token is the one the approval page would hand over).
  await sw.evaluate(async ({ api }) => {
    await self.CareerOS.Storage.saveSettings({ apiBase: api, deviceToken: '' });
  }, { api: `${origin}/api/extension` });

  /* 1. Pasting the token into the options page connects, and the first sync brings the website's data. */
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extId}/options/options.html`);
  await options.click('.tab[data-panel="settings"]');
  await options.fill('[data-setting="deviceToken"]', CAREEROS_TOKEN);
  await options.reload();
  check(await options.isVisible('#pairedBox'), 'a pasted CareerOS token connects this browser');
  await options.click('.tab[data-panel="account"]');
  await options.click('#syncBtn');
  await waitFor(async () => /Up to date/.test(await options.textContent('#syncMsg')), 20000, 'first sync');
  const before = (await asExtension('/sync')).body;
  let mine = await local();
  check(mine.profile.identity.phone === before.resume.data.identity.phone && mine.profile.experience.currentTitle === before.resume.data.experience.currentTitle,
    `the website's profile comes down (phone ${mine.profile.identity.phone}, title ${mine.profile.experience.currentTitle})`);
  check(mine.settings.concurrency === before.settings.concurrency && mine.settings.minMatchScore === before.settings.minMatchScore,
    `the website's run settings come down (concurrency ${mine.settings.concurrency}, minimum match ${mine.settings.minMatchScore})`);
  check(/applications this month/.test(await options.textContent('#syncMsg')), `Sync now reports the month's count: "${await options.textContent('#syncMsg')}"`);

  /* 2. Changes in the options page reach the website. */
  await options.reload();
  await options.click('.tab[data-panel="you"]');
  await options.fill('[data-bind="identity.phone"]', '+1 555 0199');
  await options.fill('[data-bind="identity.city"]', 'Denver');
  await options.click('.tab[data-panel="targeting"]');
  await options.fill('[data-bind="targeting.titles"]', 'QA Engineer, SDET');
  await options.click('.tab[data-panel="history"]');
  await options.click('#addRole');
  await options.fill('#roles .entry:last-child [data-k="title"]', 'Test Lead');
  await options.click('.tab[data-panel="settings"]');
  await options.fill('[data-setting="concurrency"]', '4');
  await options.fill('[data-setting="pacingSeconds"]', '60');
  await options.check('[data-setting="autoSubmit"]');
  await options.click('.tab[data-panel="platforms"]');
  check(await options.isDisabled('select[data-platform="linkedin"]'), 'LinkedIn full automation stays locked until the acknowledgment');
  await options.check('[data-setting="acknowledgedRestricted"]');
  await options.selectOption('select[data-platform="linkedin"]', 'auto');

  const up = await waitFor(async () => {
    const s = (await asExtension('/sync')).body;
    return s.settings.concurrency === 4 && s.settings.platformModes.linkedin === 'auto' && s.resume.data.identity.phone === '+1 555 0199' && s.resume.data.targeting.titles.length === 2 ? s : null;
  }, 20000, 'extension edits on the website');
  if (up) {
    check(true, 'phone, city, target roles and run settings changed in the extension are saved on the website');
    check(up.resume.data.identity.city === 'Denver' && up.settings.pacingSeconds === 60 && up.settings.autoSubmit === true, `…including city ${up.resume.data.identity.city}, pacing ${up.settings.pacingSeconds}s, auto submit ${up.settings.autoSubmit}`);
  }
  const webSettings = (await web('/api/auto-apply/settings')).body.data.settings;
  check(webSettings.concurrency === 4 && webSettings.autoSubmit === true, `the website's Auto Apply page shows them (concurrent tabs ${webSettings.concurrency})`);

  /* 3. Changes on the website come down, without undoing the extension's edits. */
  const saved = await web('/api/auto-apply/settings', { method: 'PATCH', body: JSON.stringify({ ...webSettings, minMatchScore: 85, concurrency: 5 }) });
  check(saved.status === 200, `the website saves up to ${5} concurrent tabs, the extension's own range (${saved.status})`);
  const prof = await web('/api/onboarding/professional', { method: 'POST', body: JSON.stringify({ currentTitle: 'Senior QA Analyst', currentCompany: 'Analytical Engines', totalExperienceYears: 7 }) });
  check(prof.status === 200, `the website saves a profile change (${prof.status})`);

  await options.click('.tab[data-panel="account"]');
  await options.click('#syncBtn');
  await waitFor(async () => /Up to date/.test(await options.textContent('#syncMsg')), 20000, 'second sync');
  mine = await local();
  check(mine.profile.experience.currentTitle === 'Senior QA Analyst' && mine.profile.experience.totalYears === 7, `the website's profile change comes down (${mine.profile.experience.currentTitle}, ${mine.profile.experience.totalYears} years)`);
  check(mine.settings.minMatchScore === 85 && mine.settings.concurrency === 5, `the website's settings change comes down (minimum match ${mine.settings.minMatchScore}, tabs ${mine.settings.concurrency})`);
  check(mine.profile.identity.phone === '+1 555 0199' && mine.profile.experience.history.some((r) => r.title === 'Test Lead'), 'and the extension\'s own edits are still there (phone, the added role)');
  check(mine.settings.platformModes.linkedin === 'auto' && mine.settings.pacingSeconds === 60, 'platform modes and pacing set in the extension survive the sync');
  await options.click('.tab[data-panel="history"]');
  check(await options.inputValue('[data-bind="experience.currentTitle"]') === 'Senior QA Analyst', 'the open options page shows the website\'s change without a reload');
  await options.click('.tab[data-panel="settings"]');
  check(await options.inputValue('[data-setting="minMatchScore"]') === '85', '…in settings too');

  /* 4. Unticking the acknowledgment turns LinkedIn back to "fills, you submit", wherever the override came from. */
  await options.click('.tab[data-panel="platforms"]');
  await options.uncheck('[data-setting="acknowledgedRestricted"]');
  const linkedin = await sw.evaluate(async () => self.CareerOS.Policy.canAutoSubmit('linkedin', await self.CareerOS.Storage.getSettings()));
  check(!linkedin.allowed, `without the acknowledgment LinkedIn is never submitted automatically (${linkedin.reason})`);

  /* 5. Disconnect ends the session on the server. */
  await options.click('.tab[data-panel="account"]');
  options.once('dialog', (d) => d.accept());
  await options.click('#unpairBtn');
  await waitFor(async () => (await asExtension('/sync')).status === 401, 10000, 'session revoked');
  check((await asExtension('/sync')).status === 401, 'Disconnect revokes this browser\'s token on the server');
  mine = await local();
  const copies = await sw.evaluate(() => new Promise((r) => chrome.storage.local.get(['careeros.serverProfile', 'careeros.serverSettings'], r)));
  check(!mine.settings.deviceToken && !Object.keys(copies).length, 'and forgets the account here');
} catch (err) {
  failures.push(err.message);
  console.error(err);
} finally {
  await context.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
