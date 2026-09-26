/* CareerOS Live Copilot — shared constants and small helpers.
 *
 * Loaded by background/service-worker.js, offscreen/offscreen.js,
 * content/live-copilot.js, options/options.js and popup/popup.js. This is
 * the ONE genuinely separate, opt-in, browser-extension-only feature in
 * this extension: real-time tab-audio capture on a call platform requires
 * extension-level permissions a web page can't get, which is why this lives
 * here and not in the main CareerOS web app's Prepare/Practice/Review flow.
 *
 * Non-negotiable: this never activates without the person explicitly
 * turning it on AND having agreed to CONSENT_VERSION's disclosure text.
 * Bump CONSENT_VERSION whenever the disclosure text changes materially —
 * anyone who consented to an older version is re-prompted.
 */
(function (root) {
  'use strict';

  const CONSENT_VERSION = 1;

  const CONSENT_TEXT = [
    'CareerOS Live Copilot listens to the OTHER participant’s audio during a video call ' +
      '(Google Meet, or Zoom/Teams joined in your browser) to surface short, private hints — never a script to read aloud.',
    'Some jurisdictions require you to tell everyone on the call that the conversation is being ' +
      'transcribed or AI-assisted. It is your responsibility to disclose this, not CareerOS’s.',
    'Some employers explicitly prohibit real-time AI assistance during interviews and treat it as ' +
      'grounds for disqualification. Only use this where you’re certain it’s allowed.',
    'No audio is ever stored. Only short text transcript snippets are processed, in memory, to generate ' +
      'your hint, then discarded.',
    'This is entirely separate from, and off by default relative to, normal mock-interview Practice.',
  ];

  /* Which platform a tab is, if any. Live Copilot only activates on these
   * three, browser-joined only — no phone companion, no desktop app. */
  function detectPlatform(url) {
    if (!url) return null;
    if (/^https:\/\/meet\.google\.com\//.test(url)) return 'meet';
    if (/^https:\/\/([a-z0-9-]+\.)?zoom\.us\//.test(url)) return 'zoom';
    if (/^https:\/\/teams\.microsoft\.com\//.test(url)) return 'teams';
    return null;
  }

  root.CareerOSInterviewPrep = root.CareerOSInterviewPrep || {};
  root.CareerOSInterviewPrep.LiveCopilot = { CONSENT_VERSION, CONSENT_TEXT, detectPlatform };
})(typeof self !== 'undefined' ? self : this);
