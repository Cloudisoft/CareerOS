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
 *   - chunked into short (~3s) segments via MediaRecorder and sent straight
 *     to the CareerOS transcription endpoint as they're produced;
 *   - NEVER written to disk, NEVER buffered beyond the current chunk, and
 *     NEVER accumulated into a full-call recording.
 */
(function () {
  'use strict';

  const { Storage, Api } = self.CareerOSInterviewPrep;

  const CHUNK_MS = 3000;
  const TEST_DURATION_MS = 30000;

  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let recorder = null;
  let levelTimer = null;
  let testTimeout = null;
  let applicationId = '';
  let mode = null; // 'live' | 'test'

  function post(msg) {
    chrome.runtime.sendMessage(Object.assign({ from: 'offscreen' }, msg)).catch(() => {});
  }

  function teardown() {
    if (levelTimer) clearInterval(levelTimer);
    if (testTimeout) clearTimeout(testTimeout);
    levelTimer = null;
    testTimeout = null;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch (err) { /* already stopped */ }
    }
    recorder = null;
    if (audioCtx) {
      try { audioCtx.close(); } catch (err) { /* ignore */ }
    }
    audioCtx = null;
    analyser = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    stream = null;
    mode = null;
  }

  function currentLevel() {
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length); // RMS, roughly 0..1
  }

  async function handleChunk(blob) {
    try {
      const { transcript } = await Api.transcribeChunk(applicationId, blob, blob.type);
      if (transcript && transcript.trim()) {
        post({ type: 'liveCopilot:transcript', transcript });
        if (mode === 'live' && applicationId) {
          try {
            const { hint } = await Api.getLiveHint(applicationId, transcript);
            if (hint && hint.text) post({ type: 'liveCopilot:hint', hint });
          } catch (hintErr) {
            post({ type: 'liveCopilot:error', message: hintErr.message });
          }
        }
      } else if (mode === 'test') {
        post({ type: 'liveCopilot:transcript', transcript: '' });
      }
    } catch (err) {
      post({ type: 'liveCopilot:error', message: err.message });
    }
  }

  async function start({ streamId, applicationId: appId, testMode }) {
    teardown();
    mode = testMode ? 'test' : 'live';
    applicationId = appId || '';

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    // Route back to the speakers so the call audio isn't silenced for the
    // person capturing it.
    source.connect(audioCtx.destination);

    levelTimer = setInterval(() => post({ type: 'liveCopilot:level', level: currentLevel() }), 200);

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    recorder = new MediaRecorder(stream, { mimeType });

    if (mode === 'test') {
      // One clip covering the whole 30s test, transcribed once at the end —
      // proves capture + (if configured) transcription end-to-end without
      // spamming the STT provider for a self-check.
      recorder.ondataavailable = (e) => {
        const finish = () => {
          post({ type: 'liveCopilot:testComplete' });
          teardown();
        };
        if (e.data && e.data.size > 0) handleChunk(e.data).finally(finish);
        else finish();
      };
      recorder.start();
      testTimeout = setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      }, TEST_DURATION_MS);
    } else {
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) handleChunk(e.data);
      };
      recorder.start(CHUNK_MS);
    }

    post({ type: 'liveCopilot:started', mode });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.target !== 'offscreen') return false;
    if (msg.type === 'offscreen:start') {
      start(msg).then(() => sendResponse({ ok: true })).catch((err) => sendResponse({ ok: false, error: err.message }));
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
