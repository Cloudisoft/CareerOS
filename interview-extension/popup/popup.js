(async function () {
  'use strict';

  const { Storage, Api, LiveCopilot } = window.CareerOSInterviewPrep;
  const $ = (id) => document.getElementById(id);

  const settings = await Storage.getSettings();

  function openApp(tab) {
    const url = chrome.runtime.getURL(`app/app.html#${tab}`);
    chrome.tabs.query({ url: `${chrome.runtime.getURL('app/app.html')}*` }, (tabs) => {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, { active: true, url });
        if (tabs[0].windowId != null) chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        chrome.tabs.create({ url });
      }
      window.close();
    });
  }

  if (!settings.deviceToken) {
    $('signin').hidden = false;

    $('connectBtn').onclick = async () => {
      $('connectBtn').disabled = true;
      $('connectBtn').textContent = 'Waiting for approval…';
      $('connectMsg').textContent = 'Approve it in the tab that just opened.';

      const res = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: 'careerosInterviewPrep:connect' }, resolve)
      );

      $('connectBtn').disabled = false;
      $('connectBtn').textContent = 'Sign in';
      if (res && res.ok) {
        $('connectMsg').textContent = 'Signed in. Reopen this to continue.';
      } else {
        $('connectMsg').textContent = (res && res.error) || 'Could not sign in.';
      }
    };

    $('pairBtn').onclick = async () => {
      const code = $('codeInput').value.trim();
      if (!code) return;
      $('pairBtn').disabled = true;
      $('pairMsg').textContent = '';
      try {
        await Api.pair(code);
        $('pairMsg').textContent = 'Paired. Reopen this to continue.';
      } catch (err) {
        $('pairMsg').textContent = err.message;
      } finally {
        $('pairBtn').disabled = false;
      }
    };

    return;
  }

  $('home').hidden = false;
  $('pairedAs').textContent = settings.pairedAs ? `Signed in as ${settings.pairedAs}` : 'Signed in';
  $('openInterview').onclick = () => openApp('interview');
  $('openStories').onclick = () => openApp('stories');
  $('signOut').onclick = async () => {
    await Api.unpair();
    window.close();
  };

  await initLiveCopilot();

  async function initLiveCopilot() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const platform = tab && LiveCopilot.detectPlatform(tab.url);
    if (!platform) return; // Only ever appears on a Meet/Zoom/Teams tab.

    $('liveCopilot').hidden = false;
    const live = await Storage.getLiveCopilotSettings();

    if (live.consentedVersion < LiveCopilot.CONSENT_VERSION) {
      $('lcConsent').hidden = false;
      $('lcConsentText').textContent = LiveCopilot.CONSENT_TEXT.join(' ');
      $('lcConsentCheck').onchange = (e) => {
        $('lcConsentContinue').disabled = !e.target.checked;
      };
      $('lcConsentContinue').onclick = async () => {
        await Storage.saveLiveCopilotSettings({ consentedVersion: LiveCopilot.CONSENT_VERSION, consentedAt: Date.now() });
        $('lcConsent').hidden = true;
        $('lcControls').hidden = false;
        await loadControls(tab, live);
      };
      return;
    }

    $('lcControls').hidden = false;
    await loadControls(tab, live);
  }

  async function loadControls(tab, live) {
    const select = $('lcJobSelect');
    try {
      const { prepPacks } = await Api.listPrepPacks();
      if (!prepPacks || prepPacks.length === 0) {
        select.innerHTML = '<option value="">No prep packs yet — get invited to interview first</option>';
      } else {
        select.innerHTML = prepPacks
          .map((p) => `<option value="${p.applicationId}">${p.jobTitle} @ ${p.companyName}</option>`)
          .join('');
        if (live.lastApplicationId) select.value = live.lastApplicationId;
      }
    } catch (err) {
      if (/Premium/.test(err.message)) {
        $('lcUpgradeMsg').hidden = false;
      }
      select.innerHTML = '<option value="">Unavailable</option>';
    }

    $('lcTestBtn').onclick = async () => {
      $('lcTestBtn').disabled = true;
      $('lcTestResult').textContent = 'Capturing this tab’s audio for 30 seconds… stay on this call.';
      $('lcMeter').hidden = false;
      const res = await chrome.runtime.sendMessage({ type: 'liveCopilot:startTest', tabId: tab.id });
      if (!res || !res.ok) {
        $('lcTestResult').textContent = `Test failed: ${(res && res.error) || 'unknown error'}`;
        $('lcTestBtn').disabled = false;
      }
    };

    $('lcStartBtn').onclick = async () => {
      const applicationId = select.value;
      if (!applicationId) {
        $('lcStatus').textContent = 'Pick which interview this is first.';
        return;
      }
      $('lcStartBtn').disabled = true;
      const res = await chrome.runtime.sendMessage({ type: 'liveCopilot:start', tabId: tab.id, applicationId });
      $('lcStartBtn').disabled = false;
      if (res && res.ok) {
        $('lcStartBtn').hidden = true;
        $('lcStopBtn').hidden = false;
        $('lcStatus').textContent = 'Live Copilot is on. Hints will appear as an overlay on this call.';
      } else {
        $('lcStatus').textContent = `Couldn't start: ${(res && res.error) || 'unknown error'}`;
      }
    };

    $('lcStopBtn').onclick = async () => {
      await chrome.runtime.sendMessage({ type: 'liveCopilot:stop' });
      $('lcStopBtn').hidden = true;
      $('lcStartBtn').hidden = false;
      $('lcStatus').textContent = 'Live Copilot stopped.';
    };

    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg) return;
      if (msg.type === 'liveCopilot:level') {
        $('lcMeterFill').style.width = `${Math.min(100, Math.round(msg.level * 260))}%`;
      }
      if (msg.type === 'liveCopilot:transcript' && $('lcTestResult').textContent.includes('Capturing')) {
        $('lcTestResult').textContent = msg.transcript
          ? `Capture confirmed — heard: "${msg.transcript.slice(0, 80)}"`
          : 'Capture confirmed — audio levels detected, but nothing was transcribed (silence, or no speech-to-text provider configured).';
      }
      if (msg.type === 'liveCopilot:error' && $('lcTestResult').textContent.includes('Capturing')) {
        $('lcTestResult').textContent = `Test error: ${msg.message}`;
      }
      if (msg.type === 'liveCopilot:testComplete') {
        $('lcTestBtn').disabled = false;
        $('lcMeter').hidden = true;
        $('lcMeterFill').style.width = '0%';
        Storage.saveLiveCopilotSettings({ testPassedAt: Date.now() });
      }
    });
  }
})();
