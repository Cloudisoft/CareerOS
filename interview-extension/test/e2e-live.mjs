/* Live Copilot audio pipeline in a real browser (offscreen/offscreen.js + lib/segmenter.js).
 *
 * A simulated call: an "interviewer" tone that speaks, pauses, speaks again, then goes quiet. Checks:
 *   - one clip is sent per stretch of speech, cut at the pause (not fixed 3-second pieces)
 *   - every clip is a complete audio file the browser can decode on its own (the old pipeline's later
 *     pieces had no file header, so transcription failed after the first few seconds)
 *   - silence is never sent
 *   - each transcript goes to the assist call with what was said before; a question's help reaches the overlay
 *   - a "not set up" transcription error stops the pipeline with a clear message instead of retrying forever
 *
 *   node interview-extension/test/e2e-live.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => readFileSync(path.resolve(here, '..', p), 'utf8');

const browser = await chromium.launch({ channel: 'chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };

// Media capture needs a secure page: serve a blank one from localhost.
await page.route('http://localhost/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>call</title>' }));
await page.goto('http://localhost/call');
await page.evaluate(() => {
  // A fake call: an oscillator whose volume the test switches on ("speaking") and off ("pause").
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = 220;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  osc.start();
  window.__speak = (on) => { gain.gain.setValueAtTime(on ? 0.6 : 0.0, ctx.currentTime); };
  // Each capture gets its own stream, as tabCapture gives (stopping one ends only that one).
  navigator.mediaDevices.getUserMedia = async () => {
    const dest = ctx.createMediaStreamDestination();
    gain.connect(dest);
    return dest.stream;
  };

  window.__sent = [];
  window.__assist = [];
  window.__messages = [];
  window.__sttMode = 'ok';
  let n = 0;
  window.chrome = {
    runtime: {
      sendMessage: (m) => { window.__messages.push(m); return Promise.resolve(); },
      onMessage: { addListener: (fn) => { window.__listener = fn; } },
    },
  };
  self.CareerOSInterviewPrep = {
    Api: {
      async transcribeChunk(_app, blob) {
        const buf = await blob.arrayBuffer();
        let decoded = false;
        try { await new AudioContext().decodeAudioData(buf.slice(0)); decoded = true; } catch (e) { decoded = false; }
        window.__sent.push({ size: blob.size, type: blob.type, decoded, at: performance.now() });
        if (window.__sttMode === 'unset') throw new Error("Live transcription isn't set up yet. Add DEEPGRAM_API_KEY (or OPENAI_API_KEY) on the server to turn it on.");
        n++;
        return { transcript: n === 1 ? 'Thanks for joining today.' : 'Tell me about a time you improved performance?' };
      },
      async liveAssist(payload) {
        window.__assist.push(payload);
        const q = /performance/.test(payload.transcript);
        return { assist: q ? { isQuestion: true, question: 'A performance win', kind: 'behavioral', points: ['Northwind payments', 'p95 -40%'], story: '' } : { isQuestion: false } };
      },
    },
  };
});
await page.addScriptTag({ content: read('lib/segmenter.js') });
await page.addScriptTag({ content: read('offscreen/offscreen.js') });

const start = () => page.evaluate(() => new Promise((resolve) => window.__listener({ target: 'offscreen', type: 'offscreen:start', streamId: 'x', applicationId: '' }, {}, resolve)));
const speak = (on) => page.evaluate((v) => window.__speak(v), on);
const wait = (ms) => page.waitForTimeout(ms);

const started = await start();
check(started && started.ok, `capture starts (${JSON.stringify(started)})`);
await wait(1500);           // silence before anyone speaks
await speak(true); await wait(2200); await speak(false); await wait(1600);   // "Thanks for joining today."
await speak(true); await wait(2600); await speak(false); await wait(2500);   // the question

const sent = await page.evaluate(() => window.__sent);
check(sent.length === 2, `one clip per stretch of speech, silence not sent (${sent.length} clips)`);
check(sent.every((c) => c.decoded), `every clip is a complete audio file (${sent.map((c) => c.decoded).join(', ')})`);
check(sent.every((c) => /webm|ogg/.test(c.type) && c.size > 1000), `clips are real audio (${sent.map((c) => `${c.type} ${c.size}B`).join(', ')})`);

const assist = await page.evaluate(() => window.__assist);
check(assist.length === 2 && assist[1].recent[0] === 'Thanks for joining today.', `the question is read with what was said before it (${JSON.stringify(assist.map((a) => a.recent))})`);
const shown = await page.evaluate(() => window.__messages.filter((m) => m.type === 'liveCopilot:assist'));
check(shown.length === 1 && shown[0].assist.points.includes('p95 -40%'), 'only the real question produces help for the overlay');

// Transcription not configured on the server: one clear message, then it stops.
await page.evaluate(() => { window.__sttMode = 'unset'; window.__sent = []; window.__messages = []; });
await start();
await speak(true); await wait(1500); await speak(false); await wait(1300);
await speak(true); await wait(1500); await speak(false); await wait(1300);
const errs = await page.evaluate(() => window.__messages.filter((m) => m.type === 'liveCopilot:error'));
const tries = await page.evaluate(() => window.__sent.length);
check(errs.length === 1 && errs[0].fatal && /isn't set up/.test(errs[0].message), `"not set up" is reported once, as fatal (${errs.length} errors)`);
check(tries === 1, `no more clips are sent after a fatal error (${tries})`);

await page.evaluate(() => new Promise((r) => window.__listener({ target: 'offscreen', type: 'offscreen:stop' }, {}, r)));

/* The in-call overlay (content/live-copilot.js) on a call page. */
const call = await browser.newPage({ viewport: { width: 1100, height: 700 } });
await call.route('http://localhost/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0;background:#202124;height:100vh"></body>' }));
await call.goto('http://localhost/meet');
await call.evaluate(() => {
  window.__sentUp = [];
  window.chrome = { runtime: {
    sendMessage: (m) => { window.__sentUp.push(m); return Promise.resolve({ active: false }); },
    onMessage: { addListener: (fn) => { window.__overlay = fn; } },
  } };
});
await call.addScriptTag({ content: read('content/live-copilot.js') });
const send = (m) => call.evaluate((msg) => window.__overlay(msg), m);
await send({ type: 'liveCopilot:started', mode: 'live' });
await send({ type: 'liveCopilot:transcript', transcript: 'Tell me about a time you improved performance?' });
await send({ type: 'liveCopilot:assist', assist: { isQuestion: true, question: 'Tell me about a time you improved performance.', kind: 'behavioral', points: ['Northwind payments rebuild', 'p95 latency -40%', 'Your part: profiling + caching'], story: 'Payments rebuild → p95 -40%' } });
await send({ type: 'liveCopilot:assist', assist: { isQuestion: true, question: 'How did you measure the 40%?', kind: 'experience', points: ['APM p95, before/after', 'Two-week baseline'], story: '' } });
const overlay = await call.evaluate(() => {
  const root = document.getElementById('careeros-live-copilot-root').shadowRoot;
  return {
    visible: getComputedStyle(root.querySelector('.panel')).display !== 'none',
    q: root.querySelector('.q').textContent,
    points: Array.from(root.querySelectorAll('li')).map((l) => l.textContent),
    earlier: root.querySelector('.prev .list').textContent,
    state: root.querySelector('.state').textContent,
  };
});
check(overlay.visible && overlay.q === 'How did you measure the 40%?' && overlay.points.length === 2, `the overlay shows the latest question and its points (${JSON.stringify(overlay)})`);
check(/improved performance/.test(overlay.earlier), 'earlier questions stay available');
if (process.env.SHOT) await call.screenshot({ path: process.env.SHOT });
await call.evaluate(() => document.getElementById('careeros-live-copilot-root').shadowRoot.querySelector('.stop').click());
check(await call.evaluate(() => window.__sentUp.some((m) => m.type === 'liveCopilot:stop')), 'Stop on the overlay stops Live Copilot');
await send({ type: 'liveCopilot:stopped', reason: "Live transcription isn't set up yet." });
check(/isn't set up/.test(await call.evaluate(() => document.getElementById('careeros-live-copilot-root').shadowRoot.querySelector('.err').textContent)), 'why it stopped is shown on the call');
await browser.close();
if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
