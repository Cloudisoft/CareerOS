/* CareerOS Interview Prep — background service worker
 *
 * The only thing that needs to outlive the popup is the one-click sign-in
 * poll (see lib/api.js Api.connect) — the popup usually loses focus, and
 * closes, the moment the approval tab opens. Everything else this extension
 * does is a plain request made directly from popup.js / app.js.
 */
importScripts('../lib/storage.js', '../lib/api.js', '../lib/live-copilot.js');

const { Api, Storage, LiveCopilot } = self.CareerOSInterviewPrep;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'careerosInterviewPrep:connect') return false;
  Api.connect().then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
  return true; // keep the message channel open for the async response
});

/* ---------------- Live Copilot (opt-in, off by default) ----------------
 * The only capture path this extension has: a person clicks a button in
 * OUR OWN popup while a Meet/Zoom/Teams tab is active (the required user
 * gesture for chrome.tabCapture), we grab a stream id for that tab, and an
 * offscreen document (the only context with real media APIs in MV3) turns
 * it into transcribed hints. Nothing here starts on its own.
 */
const OFFSCREEN_PATH = 'offscreen/offscreen.html';
let activeCaptureTabId = null;

async function ensureOffscreenDocument() {
  const has = await chrome.offscreen.hasDocument?.();
  if (has) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ['USER_MEDIA'],
    justification: 'Captures the other call participant’s tab audio for opt-in Live Copilot hints.',
  });
}

async function closeOffscreenDocument() {
  const has = await chrome.offscreen.hasDocument?.();
  if (has) await chrome.offscreen.closeDocument();
}

async function startCapture({ tabId, applicationId, testMode }) {
  const streamId = await new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
      if (chrome.runtime.lastError || !id) reject(new Error(chrome.runtime.lastError?.message || 'Could not capture this tab’s audio.'));
      else resolve(id);
    });
  });

  await ensureOffscreenDocument();
  activeCaptureTabId = tabId;
  const res = await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'offscreen:start',
    streamId,
    applicationId,
    testMode: Boolean(testMode),
  });
  if (!res || !res.ok) throw new Error((res && res.error) || 'Could not start audio capture.');
  return res;
}

async function stopCapture() {
  const hadDoc = await chrome.offscreen.hasDocument?.();
  if (hadDoc) {
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'offscreen:stop' }).catch(() => {});
    await closeOffscreenDocument();
  }
  activeCaptureTabId = null;
  await Storage.saveLiveCopilotSettings({ enabled: false });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return false;

  if (msg.type === 'liveCopilot:start') {
    (async () => {
      try {
        await Storage.saveLiveCopilotSettings({ enabled: true, lastApplicationId: msg.applicationId || '' });
        const res = await startCapture({ tabId: msg.tabId, applicationId: msg.applicationId, testMode: false });
        sendResponse({ ok: true, ...res });
      } catch (err) {
        await Storage.saveLiveCopilotSettings({ enabled: false });
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (msg.type === 'liveCopilot:startTest') {
    (async () => {
      try {
        const res = await startCapture({ tabId: msg.tabId, applicationId: '', testMode: true });
        sendResponse({ ok: true, ...res });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (msg.type === 'liveCopilot:stop') {
    stopCapture().then(() => sendResponse({ ok: true }));
    return true;
  }

  // Relay offscreen document events (level, transcript, hint, errors) to the
  // content script overlay on the tab actually being captured, and to any
  // open popup/options page listening.
  if (msg.from === 'offscreen') {
    if (activeCaptureTabId != null) {
      chrome.tabs.sendMessage(activeCaptureTabId, msg).catch(() => {});
    }
    chrome.runtime.sendMessage(msg).catch(() => {});
    if (msg.type === 'liveCopilot:testComplete') {
      closeOffscreenDocument().catch(() => {});
      activeCaptureTabId = null;
    }
    // Something that won't fix itself (no transcription service, signed out, plan): stop listening rather
    // than keep capturing audio that can't help. The overlay shows why.
    if (msg.type === 'liveCopilot:error' && msg.fatal) {
      const tab = activeCaptureTabId;
      stopCapture().catch(() => {}).finally(() => {
        if (tab != null) chrome.tabs.sendMessage(tab, { type: 'liveCopilot:stopped', reason: msg.message }).catch(() => {});
      });
    }
    return false;
  }

  return false;
});

// Belt-and-braces: if the captured tab closes or navigates away mid-call,
// stop capture rather than silently keep listening to nothing.
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeCaptureTabId) stopCapture().catch(() => {});
});
chrome.tabs.onUpdated.addListener((tabId, info) => {
  // Leaving the call (navigating the tab elsewhere) ends Live Copilot too.
  if (tabId === activeCaptureTabId && info.url && !LiveCopilot.detectPlatform(info.url)) stopCapture().catch(() => {});
});

/* The popup asks which tab Live Copilot is running on, if any. */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'liveCopilot:state?') return false;
  sendResponse({ activeTabId: activeCaptureTabId });
  return false;
});

/* The overlay asks whether Live Copilot is running on its tab (e.g. after the page re-renders). */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'liveCopilot:status?') return false;
  sendResponse({ active: sender.tab != null && sender.tab.id === activeCaptureTabId });
  return false;
});
