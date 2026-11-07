/* CareerOS Interview Companion, end to end, against a stand-in CareerOS server.
 *
 * Launches the real app (Electron) on a virtual display with a test tone standing in for the call audio:
 *   - sign in through the extension approval flow, then the one-time disclosure
 *   - the interviews list loads; listening starts
 *   - one clip per thing said, each a complete WebM file; small talk shows nothing, a question shows its
 *     talking points and story; earlier questions are kept
 *   - notes save as a Markdown file with the questions and points
 *   - a "transcription isn't set up" answer stops listening with the reason
 *   - the window is an ordinary visible window: always on top, not hidden from screen capture
 *
 *   xvfb-run -a node test/e2e.mjs        (Linux; on a desktop: node test/e2e.mjs)
 */
import http from 'node:http';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import pw from 'playwright-core';

const { _electron: electron } = pw;
const electronPath = createRequire(import.meta.url)('electron');
const here = path.dirname(new URL(import.meta.url).pathname);
const appDir = path.resolve(here, '..');
const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seen = { clips: [], assists: [], polls: 0, sttMode: 'ok', auth: [], nextTranscript: null, copilotRequests: [] };
let said = 0;
const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const json = (status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
  const p = new URL(req.url, 'http://x').pathname;
  if (req.headers.authorization) seen.auth.push(req.headers.authorization);
  if (p === '/api/extension/connect/start') return json(200, { ok: true });
  if (p === '/api/extension/connect/poll') {
    seen.polls++;
    return json(200, seen.polls < 3 ? { status: 'pending' } : { status: 'approved', token: 'device-token-1', email: 'maya@demo.local' });
  }
  if (p === '/api/extension/interview/targets') {
    return json(200, { jobSpecific: true, targets: [{ applicationId: 'a1', jobId: 'j1', jobTitle: 'Senior Data Analyst', companyName: 'Fabrikam', status: 'INTERVIEW', hasPrepPack: true }] });
  }
  if (p === '/api/extension/interview/live/transcribe') {
    seen.clips.push({ size: body.length, type: req.headers['content-type'], ebml: body.subarray(0, 4).toString('hex') === '1a45dfa3' });
    if (seen.sttMode === 'unset') return json(503, { error: "Live transcription isn't set up yet. Add DEEPGRAM_API_KEY (or OPENAI_API_KEY) on the server to turn it on." });
    said++;
    const nextTranscript = seen.nextTranscript;
    seen.nextTranscript = null;
    return json(200, { transcript: nextTranscript || (said === 1 ? 'Thanks for joining today.' : 'Tell me about a time two teams disagreed on the numbers?') });
  }
  if (p === '/api/extension/interview/copilot/ask') {
    const input = JSON.parse(body.toString());
    seen.copilotRequests.push(input);
    return json(200, { answer: `Mock specialist answer (${input.skill}): ${input.question}`, provider: 'mock' });
  }
  if (p === '/api/extension/interview/live/assist') {
    const a = JSON.parse(body.toString());
    seen.assists.push(a);
    const q = /disagreed/.test(a.transcript);
    return json(200, { assist: q ? { isQuestion: true, question: 'Tell me about a time two teams disagreed on the numbers.', kind: 'behavioral', points: ['Three regional reports, three methods', 'Traced figures to warehouse tables'], story: 'Regional reports → one source of truth' } : { isQuestion: false } });
  }
  json(404, { error: 'not found' });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const notesDir = mkdtempSync(path.join(tmpdir(), 'companion-notes-'));

const app = await electron.launch({
  executablePath: electronPath,
  args: [appDir, '--no-sandbox'],
  env: {
    ...process.env,
    NODE_OPTIONS: '',
    CAREEROS_WEB_URL: origin,
    CAREEROS_API_BASE: `${origin}/api/extension`,
    CAREEROS_TEST_AUDIO: '1',
    CAREEROS_NO_BROWSER: '1',
    CAREEROS_NOTES_DIR: notesDir,
    CAREEROS_USER_DATA: mkdtempSync(path.join(tmpdir(), 'companion-data-')),
  },
});
try {
  const win = await app.firstWindow();
  const errors = [];
  win.on('pageerror', (e) => errors.push(e.message));
  win.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const visible = (sel) => win.locator(sel).isVisible();

  // 1. Sign in, then the disclosure.
  await win.waitForSelector('#signin:not([hidden])');
  check(true, 'opens on Sign in');
  await win.click('#signinBtn');
  await win.waitForSelector('#signinCode:not([hidden])', { timeout: 5000 });
  const code = await win.textContent('#signinCode');
  check(/^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/.test(code), `shows the code to match on the approval page (${code})`);
  await win.waitForSelector('#consent:not([hidden])', { timeout: 15000 });
  check(seen.polls >= 2, `signed in through the approval flow (${seen.polls} polls)`);
  const consent = await win.textContent('#consentText');
  check(/visible like any other app/.test(consent) && /responsibility/.test(consent), 'the disclosure says the window is visible and the user must disclose AI help');
  check(await win.isDisabled('#consentBtn'), 'Continue stays off until they agree');
  await win.check('#consentCheck');
  await win.click('#consentBtn');

  // 2. Ready: interviews list.
  await win.waitForSelector('#home:not([hidden])');
  await win.waitForFunction(() => document.querySelectorAll('#target option').length > 1);
  check((await win.textContent('#pairedAs')).includes('maya@demo.local'), 'shows who is signed in');
  check((await win.$$eval('#target option', (o) => o.map((x) => x.textContent))).some((t) => /Senior Data Analyst @ Fabrikam/.test(t)), 'lists the jobs they applied to');
  await win.selectOption('#target', 'a1');

  // 3. Listen.
  await win.click('#startBtn');
  await win.waitForSelector('#live:not([hidden])');
  check(await visible('#live'), 'starts listening');
  const speak = (on) => win.evaluate((v) => window.__speak(v), on);
  await sleep(1200);
  await speak(true); await sleep(2200); await speak(false); await sleep(1600);   // small talk
  await speak(true); await sleep(2600); await speak(false); await sleep(2600);   // the question
  check(seen.clips.length === 2, `one clip per thing said, silence not sent (${seen.clips.length})`);
  check(seen.clips.every((c) => c.ebml && c.size > 1000 && /webm/.test(c.type)), `every clip is a complete WebM file (${seen.clips.map((c) => `${c.size}B ${c.ebml}`).join(', ')})`);
  check(seen.auth.every((a) => a === 'Bearer device-token-1'), 'every request carries the device token');
  check(seen.assists.length === 2 && seen.assists[1].applicationId === 'a1' && seen.assists[1].recent[0] === 'Thanks for joining today.', 'asks for help with the chosen job and what was said before');
  await win.waitForSelector('.current .q');
  check((await win.textContent('.current .q')).includes('two teams disagreed'), 'shows the question');
  check((await win.$$eval('.points li', (l) => l.map((x) => x.textContent))).includes('Traced figures to warehouse tables'), 'shows talking points from the resume');
  check((await win.textContent('.story')).includes('one source of truth'), 'shows the matching story');
  if (process.env.SHOT) await win.screenshot({ path: process.env.SHOT });

  // 4. Ask AI and session memory (the new specialist endpoint).
  await win.selectOption('#skillPreset', 'dsa');
  await win.fill('#askInput', 'Explain binary search complexity');
  await win.click('#askBtn');
  await win.waitForSelector('#copilotAnswer:not([hidden])');
  check((await win.textContent('#copilotAnswer')).includes('binary search complexity'), 'Ask AI displays specialist answer');
  check((await win.textContent('#copilotAnswer')).includes('dsa'), 'specialist skill reaches the AI endpoint');
  check(Number(await win.textContent('#transcriptCount')) === 2, 'transcript records incoming speech');
  await win.click('#saveSessionBtn');
  await win.waitForFunction(() => document.querySelector('#sessionSaveState').textContent.includes('Saved on this computer'));
  check(true, 'session is saved explicitly on user request');
  await win.click('#clearSessionBtn');
  check((await win.textContent('#transcriptCount')) === '0', 'Clear session resets transcript');
  check(!(await visible('#copilotAnswer')), 'Clear session removes AI answers');
  // Generate another question so the notes flow remains covered.
  await speak(true); await sleep(1500); await speak(false); await sleep(2600);
  await win.waitForSelector('.current .q');

  // 5. Opt-in wake-word command: explicit spoken request may call the specialist API.
  await win.check('#voiceCommandsEnabled');
  seen.nextTranscript = 'CareerOS explain the difference between SQL joins';
  const beforeVoice = seen.copilotRequests.length;
  await speak(true); await sleep(1600); await speak(false); await sleep(2500);
  await win.waitForFunction((n) => document.querySelector('#copilotAnswer').textContent.includes('SQL joins'), null, { timeout: 9000 });
  check(seen.copilotRequests.length === beforeVoice + 1, 'opt-in wake-word triggers one specialist request');
  check(seen.copilotRequests.at(-1)?.question.includes('SQL joins'), 'wake-word passes the spoken question');
  await win.uncheck('#voiceCommandsEnabled');

  // 6. Notes.
  await win.click('#notesBtn');
  await sleep(500);
  const files = readdirSync(notesDir);
  const md = files.length ? readFileSync(path.join(notesDir, files[0]), 'utf8') : '';
  check(/two teams disagreed/.test(md) && /Traced figures/.test(md) && /Senior Data Analyst @ Fabrikam/.test(md), 'notes save with the job, questions and points');

  // 7. Stop, then a server without transcription: stops with the reason.
  await win.click('#stopBtn');
  await win.click('#stopBtn'); // Back
  await win.waitForSelector('#home:not([hidden])');
  await win.waitForFunction(() => document.querySelectorAll('.history-item').length === 1);
  check((await win.textContent('.history-item')).includes('Senior Data Analyst'), 'saved session appears in local history');
  await win.fill('#historySearch', 'binary search complexity');
  check(await win.locator('.history-item').count() === 1, 'saved history searches AI answers');
  await win.fill('#historySearch', 'not-in-session');
  check(await win.locator('.history-item').count() === 0, 'saved history filters nonmatching entries');
  await win.fill('#historySearch', '');
  await win.click('.history-item button.link');
  check((await win.textContent('#historyPreview')).includes('binary search complexity'), 'saved session opens with transcript and AI answers');
  seen.sttMode = 'unset';
  await win.click('#startBtn');
  await win.waitForSelector('#live:not([hidden])');
  await sleep(800);
  await speak(true); await sleep(1500); await speak(false); await sleep(1500);
  await win.waitForFunction(() => /isn't set up/.test(document.getElementById('liveError').textContent), null, { timeout: 8000 });
  check((await win.textContent('#state')) === 'Stopped', 'stops listening and says why when transcription isn’t set up');

  // 8. An ordinary, visible window.
  const props = await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    return { onTop: w.isAlwaysOnTop(), protectedFromCapture: typeof w.isContentProtected === 'function' ? w.isContentProtected() : 'n/a' };
  });
  check(props.onTop === true, 'floats on top of the call');
  check(props.protectedFromCapture === false, `is not hidden from screen capture (isContentProtected: ${props.protectedFromCapture})`);
  check(errors.filter((e) => !/Autofill|DevTools/.test(e)).length === 0, `no errors in the window (${errors.join(' | ')})`);
} catch (err) {
  failures.push(err.message);
  console.log(`✗ ${err.message}`);
} finally {
  await app.close().catch(() => {});
  server.close();
}
if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
