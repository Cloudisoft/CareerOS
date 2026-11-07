/* The mock interview room (app/room.js) in a real browser.
 *
 * A stubbed CareerOS API and a fake microphone (a tone the test switches on and off). Checks:
 *   - the interviewer reads the question aloud, then the mic opens on its own
 *   - what the candidate says is written into the answer box, clip by clip, cut at pauses
 *   - "Suggest an answer" shows an outline and a sample, and can become the draft
 *   - sending the answer adds it to the transcript with its feedback, and the next question is asked aloud
 *   - after the last question, "Finish interview" completes the session
 *
 *   node interview-extension/test/e2e-room.mjs [screenshot-dir]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => readFileSync(path.resolve(here, '..', p), 'utf8');
const shots = process.argv[2] || '';

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: shots ? 2 : 1 });
const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.route('http://localhost/**', (route) => route.fulfill({
  contentType: 'text/html',
  body: `<!doctype html><html><head><meta charset="utf-8"><style>${read('app/app.css')}</style></head><body class="inRoom"><main class="wrap"><div id="view"></div></main></body></html>`,
}));
await page.goto('http://localhost/room');

await page.evaluate(() => {
  // Fake microphone: a tone the test switches on ("talking") and off ("pause").
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = 200;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  osc.start();
  window.__talk = (on) => gain.gain.setValueAtTime(on ? 0.6 : 0, ctx.currentTime);
  navigator.mediaDevices.getUserMedia = async () => { const d = ctx.createMediaStreamDestination(); gain.connect(d); return d.stream; };

  // Fake interviewer voice: records what was said and "finishes" after a moment.
  window.__spoken = [];
  const synth = { speaking: false, getVoices: () => [], cancel() {}, speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 300); } };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };

  const q = (order, question, extra) => Object.assign({ id: `q${order}`, order, category: order === 0 ? 'Motivation' : 'Project deep-dive', question, answer: null, score: null, feedback: null, strengths: [], improvements: [] }, extra || {});
  window.__session = { id: 's1', status: 'IN_PROGRESS', plan: null, questions: [q(0, 'Walk me through your background.')] };
  window.__clips = 0;
  window.__calls = [];
  self.CareerOSInterviewPrep = self.CareerOSInterviewPrep || {};
  self.CareerOSInterviewPrep.__api = {
    async transcribeChunk(_a, blob) {
      window.__clips++;
      const buf = await blob.arrayBuffer();
      return { transcript: buf.byteLength > 0 ? (window.__clips === 1 ? 'I have five years building checkout systems.' : 'Most recently I led the Northwind checkout rebuild.') : '' };
    },
    async suggestAnswer() {
      window.__calls.push('suggest');
      return { suggestion: { outline: ['Where you are now', 'The rebuild you led', 'Why this role'], sample: 'I am a backend engineer with five years in payments.', basedOn: 'Northwind' } };
    },
    async submitAnswer(_s, qid, answer) {
      window.__calls.push(`submit:${qid}`);
      const s = window.__session;
      const cur = s.questions.find((x) => x.id === qid);
      Object.assign(cur, { answer, score: 78, feedback: 'Clear and specific.', strengths: ['Concrete example'], improvements: ['Add the result'] });
      if (s.questions.length < 2) s.questions.push(q(1, 'Tell me about the checkout rebuild. What was the hardest part?'));
      return { question: cur };
    },
    async retryAnswer() { return {}; },
    async completeSession() { window.__calls.push('complete'); window.__session.status = 'COMPLETED'; return {}; },
  };
});
await page.addScriptTag({ content: read('lib/segmenter.js') });
await page.addScriptTag({ content: read('app/room.js') });
await page.evaluate(() => {
  const NS = self.CareerOSInterviewPrep;
  const esc = (s) => { const d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; };
  window.__done = false;
  NS.Room.mount(document.getElementById('view'), {
    session: JSON.parse(JSON.stringify(window.__session)),
    totalQuestions: 2,
    api: NS.__api,
    esc,
    renderPlan: () => '',
    refresh: async () => JSON.parse(JSON.stringify(window.__session)),
    onClose() {},
    onCompleted() { window.__done = true; },
  });
});

const wait = (ms) => page.waitForTimeout(ms);
await wait(1200);
check((await page.evaluate(() => window.__spoken[0])) === 'Walk me through your background.', 'the interviewer reads the first question aloud');
check(await page.locator('#rmMic.on').count() === 1, 'the microphone opens by itself after the question');

// Candidate talks, pauses, talks again, pauses.
await page.evaluate(() => window.__talk(true)); await wait(1500);
await page.evaluate(() => window.__talk(false)); await wait(1700);
await page.evaluate(() => window.__talk(true)); await wait(1500);
await page.evaluate(() => window.__talk(false)); await wait(1800);
const draft = await page.inputValue('#rmDraft');
check(/five years/.test(draft) && /Northwind/.test(draft) && draft.split('Northwind').length === 2, `the answer box fills in as the candidate talks (${JSON.stringify(draft)})`);
check((await page.evaluate(() => window.__clips)) === 2, 'one clip per stretch of speech, cut at the pause');
if (shots) await page.screenshot({ path: `${shots}/room-answering.png` });

await page.click('#rmSuggest');
await page.waitForSelector('.suggest');
check(await page.locator('.suggest ol li').count() === 3, 'a suggested answer shows its outline');
check(/five years in payments/.test(await page.textContent('.suggest .sample')), 'and a sample answer');
if (shots) await page.screenshot({ path: `${shots}/room-suggestion.png` });

await page.click('#rmSend');
await wait(1500);
check((await page.evaluate(() => window.__calls)).includes('submit:q0'), 'sending submits the answer');
check(await page.locator('.msg.me').count() === 1, 'the answer joins the transcript');
check((await page.textContent('.msg.me .bubble')).split('Northwind').length === 2, 'a trailing pause adds nothing to the answer');
check(/Clear and specific/.test(await page.textContent('.fb')), 'with its feedback and score');
check((await page.evaluate(() => window.__spoken)).includes('Tell me about the checkout rebuild. What was the hardest part?'), 'the next question is asked aloud');
check(await page.locator('.msg.them').count() === 2, 'the transcript shows both questions');
if (shots) await page.screenshot({ path: `${shots}/room-feedback.png` });

// Type the last answer instead of speaking.
await page.click('#rmMic'); // stop listening
await page.fill('#rmDraft', 'The hardest part was migrating live payments without downtime.');
await page.click('#rmSend');
await page.waitForSelector('#rmFinish');
await page.click('#rmFinish');
await wait(400);
check(await page.evaluate(() => window.__done && window.__calls.includes('complete')), 'finishing completes the session');
check(errors.length === 0, `no page errors ${errors.length ? JSON.stringify(errors) : ''}`);

await browser.close();
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll room checks passed.');
