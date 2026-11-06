/* CareerOS Live Copilot — speech segmenter.
 *
 * Decides where to cut the call audio into clips for transcription. Each clip is one stretch of the
 * interviewer speaking, cut when they pause, so a question arrives whole instead of chopped into fixed
 * 3-second pieces mid-word. Clips with no speech are thrown away (nothing is sent while nobody talks).
 *
 * Pure logic, no audio APIs: the offscreen document feeds it a loudness reading (RMS, 0..1) every ~100ms
 * and acts on what it returns:
 *   'cut'     — the clip so far holds speech that just ended (or ran long): send it, start a new clip
 *   'discard' — the clip so far is only silence or noise: drop it, start a new clip
 *   null      — keep recording
 */
(function (root) {
  'use strict';

  function Segmenter(opts) {
    const o = Object.assign({
      silenceMs: 900,       // a pause this long ends what was being said
      minSpeechMs: 350,     // less loud time than this is a cough or a click, not speech
      maxMs: 20000,         // never let one clip grow past this (long monologues are cut anyway)
      idleMs: 15000,        // drop a clip of pure silence after this, so clips stay small
      floor: 0.012,         // the quietest level ever counted as speech
    }, opts || {});

    let start = null;
    let last = null;
    let speechMs = 0;
    let lastLoud = 0;
    let noise = 0.005;      // running estimate of the background level

    function reset(now) {
      start = now;
      last = now;
      speechMs = 0;
      lastLoud = 0;
    }

    function threshold() {
      return Math.max(o.floor, noise * 3);
    }

    function feed(level, now) {
      if (start === null) reset(now);
      const dt = Math.max(0, Math.min(500, now - last));
      last = now;
      const loud = level >= threshold();
      if (loud) {
        speechMs += dt;
        lastLoud = now;
      } else {
        // Learn the background level only from quiet moments.
        noise = noise * 0.95 + level * 0.05;
      }
      const hasSpeech = speechMs >= o.minSpeechMs;
      const age = now - start;
      if (hasSpeech && !loud && now - lastLoud >= o.silenceMs) { reset(now); return 'cut'; }
      if (age >= o.maxMs) { const a = hasSpeech ? 'cut' : 'discard'; reset(now); return a; }
      if (!hasSpeech && age >= o.idleMs && now - lastLoud >= o.silenceMs) { reset(now); return 'discard'; }
      return null;
    }

    return { feed, reset, threshold, get speechMs() { return speechMs; } };
  }

  root.CareerOSInterviewPrep = root.CareerOSInterviewPrep || {};
  root.CareerOSInterviewPrep.Segmenter = Segmenter;
  if (typeof module !== 'undefined' && module.exports) module.exports = { Segmenter };
})(typeof self !== 'undefined' ? self : this);
