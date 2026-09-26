/* CareerOS Interview Prep — background service worker
 *
 * The only thing that needs to outlive the popup is the one-click sign-in
 * poll (see lib/api.js Api.connect) — the popup usually loses focus, and
 * closes, the moment the approval tab opens. Everything else this extension
 * does is a plain request made directly from popup.js / app.js.
 */
importScripts('../lib/storage.js', '../lib/api.js');

const { Api } = self.CareerOSInterviewPrep;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'careerosInterviewPrep:connect') return false;
  Api.connect().then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
  return true; // keep the message channel open for the async response
});
