/* CareerOS Live Copilot — offscreen audio pipeline.
 *
 * MV3 service workers have no DOM or media APIs, so this is the documented
 * pattern for tab-audio capture: the service worker gets a streamId via
 * chrome.tabCapture.getMediaStreamId({targetTabId}) and hands it here, where
 * getUserMedia can actually turn it into a MediaStream.
 *
 * This is the ONLY place raw audio ever exists in this feature. It is:
 *   - re-routed to the AudioContext destination so the person still hears
 *     their own call (capturing a tab's audio via getUserMedia otherwise
 *     mutes it for the capturing party);
 *   - recorded one stretch of speech at a time (lib/segmenter.js cuts at the
 *     interviewer's pauses), each clip a complete audio file the transcription
 *     service can read on its own; clips with no speech are dropped unsent;
 *   - NEVER written to disk and NEVER accumulated into a full-call recording.
 *
 * Each transcript goes to /interview/live/assist with the last few things the
 * interviewer said, which decides whether a question was just asked and, if
 * so, returns talking points from the person's own resume and stories.
 */
(function () {
  'use strict';

  const { Api, Segmenter } = self.CareerOSInterviewPrep;

  const TICK_MS = 100;
  const TEST_DURATION_MS = 15000;
  const RECENT = 5;

  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let recorder = null;
  let parts = [];
  let ticker = null;
  let testTimeout = null;
  let segmenter = null;
  let applicationId = '';
  let mode = null; // 'live' | 'test'
  let mimeType = 'audio/webm';
  let queue = Promise.resolve();
  let pending = 0;
  let recent = [];
  let lastQuestion = '';
  let stopped = true;
  let fatal = false;

  function post(msg) {
    chrome.runtime.sendMessage(Object.assign({ from: 'offscreen' }, msg)).catch(() => {});
  }

  function teardown() {
    stopped = true;
    if (ticker) clearInterval(ticker);
    if (testTimeout) clearTimeout(testTimeout);
    ticker = null;
    testTimeout = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      try { recorder.stop(); } catch (err) { /* already stopped */ }
    }
    recorder = null;
    parts = [];
    if (audioCtx) {
      try { audioCtx.close(); } catch (err) { /* ignore */ }
    }
    audioCtx = null;
    analyser = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    mode = null;
    recent = [];
    lastQuestion = '';
  }

  function currentLevel() {
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length); // RMS, roughly 0..1
  }

  /* A new clip: a fresh MediaRecorder, so every clip starts with its own file header. */
  function newClip() {
    if (!stream || stopped) return;
    // Each recorder keeps its own pieces: the last piece of a stopped clip arrives after the next one starts.
    const mine = [];
    parts = mine;
    const r = new MediaRecorder(stream, { mimeType });
    r.ondataavailable = (e) => { if (e.data && e.data.size > 0) mine.push(e.data); };
    r.start();
    recorder = r;
  }

  /* Ends the current clip and starts the next right away; `keep` sends the finished clip. */
  function endClip(keep) {
    const r = recorder;
    if (!r || r.state === 'inactive') { newClip(); return; }
    const mine = parts;
    r.onstop = () => {
      if (keep && mine.length) {
        const blob = new Blob(mine, { type: mimeType });
        enqueue(blob);
      }
    };
    try { r.stop(); } catch (err) { /* already stopped */ }
    newClip();
  }

  function friendly(err) {
    const m = String((err && err.message) || err || '');
    if (/isn't set up|not configured|STT_NOT_CONFIGURED/i.test(m)) return { message: m, fatal: true };
    if (/401|sign in|unauthori[sz]ed|paired/i.test(m)) return { message: 'Your CareerOS sign-in expired. Open the extension and sign in again.', fatal: true };
    if (/402|Premium|upgrade|plan/i.test(m)) return { message: m, fatal: true };
    if (/Failed to fetch|NetworkError|network/i.test(m)) return { message: 'Connection problem: retrying with the next thing said.', fatal: false };
    return { message: m || 'Something went wrong; still listening.', fatal: false };
  }

  /* Clips are transcribed in order, one at a time; if they pile up (slow network), only the newest few are
     worth sending — help for a question asked a minute ago is no help. */
  function enqueue(blob) {
    if (fatal) return;
    pending++;
    queue = queue.then(async () => {
      pending--;
      if (stopped || (pending > 2 && mode === 'live')) return;
      await handleClip(blob);
    });
  }

  async function handleClip(blob) {
    let transcript = '';
    try {
      post({ type: 'liveCopilot:status', status: 'transcribing' });
      ({ transcript } = await Api.transcribeChunk(applicationId, blob, blob.type));
    } catch (err) {
      const f = friendly(err);
      post({ type: 'liveCopilot:error', message: f.message, fatal: f.fatal });
      if (f.fatal) { fatal = true; }
      return;
    } finally {
      post({ type: 'liveCopilot:status', status: 'listening' });
    }
    transcript = (transcript || '').trim();
    post({ type: 'liveCopilot:transcript', transcript });
    if (!transcript || mode !== 'live') return;

    try {
      post({ type: 'liveCopilot:status', status: 'thinking' });
      const { assist } = await Api.liveAssist({ applicationId: applicationId || null, transcript, recent: recent.slice(-RECENT), lastQuestion });
      recent.push(transcript);
      if (recent.length > RECENT) recent = recent.slice(-RECENT);
      if (assist && assist.isQuestion) {
        lastQuestion = assist.question;
        recent = []; // a new question starts fresh context
        post({ type: 'liveCopilot:assist', assist });
      }
    } catch (err) {
      const f = friendly(err);
      post({ type: 'liveCopilot:error', message: f.message, fatal: f.fatal });
      if (f.fatal) fatal = true;
    } finally {
      post({ type: 'liveCopilot:status', status: 'listening' });
    }
  }

  async function start({ streamId, applicationId: appId, testMode }) {
    teardown();
    stopped = false;
    fatal = false;
    mode = testMode ? 'test' : 'live';
    applicationId = appId || '';

    stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
      video: false,
    });

    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    // Route back to the speakers so the call audio isn't silenced for the person capturing it.
    source.connect(audioCtx.destination);

    mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';

    if (mode === 'test') {
      // One clip for the whole test, transcribed once at the end: proves capture and transcription work.
      let meter = 0;
      ticker = setInterval(() => { meter = currentLevel(); post({ type: 'liveCopilot:level', level: meter }); }, 200);
      newClip();
      testTimeout = setTimeout(() => {
        const r = recorder;
        const mine = parts;
        if (!r) return;
        r.onstop = async () => {
          const blob = new Blob(mine, { type: mimeType });
          if (blob.size) await handleClip(blob);
          post({ type: 'liveCopilot:testComplete' });
          teardown();
        };
        r.stop();
      }, TEST_DURATION_MS);
    } else {
      segmenter = Segmenter();
      newClip();
      let n = 0;
      ticker = setInterval(() => {
        const level = currentLevel();
        if (++n % 2 === 0) post({ type: 'liveCopilot:level', level });
        const action = segmenter.feed(level, performance.now());
        if (action === 'cut') endClip(true);
        else if (action === 'discard') endClip(false);
      }, TICK_MS);
    }

    // The call ended or the tab stopped sharing audio.
    stream.getAudioTracks().forEach((t) => t.addEventListener('ended', () => {
      post({ type: 'liveCopilot:error', message: 'The call audio stopped (tab closed or navigated). Live Copilot is off.', fatal: true });
      teardown();
    }));

    post({ type: 'liveCopilot:started', mode });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.target !== 'offscreen') return false;
    if (msg.type === 'offscreen:start') {
      start(msg).then(() => sendResponse({ ok: true })).catch((err) => {
        teardown();
        sendResponse({ ok: false, error: err.message });
      });
      return true;
    }
    if (msg.type === 'offscreen:stop') {
      teardown();
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });
})();
