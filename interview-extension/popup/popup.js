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
  $('foot').hidden = false;
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
    $('liveCopilot').hidden = false;

    // Already running somewhere: show that, with a way back to the call and a stop button.
    const state = await chrome.runtime.sendMessage({ type: 'liveCopilot:state?' }).catch(() => null);
    if (state && state.activeTabId != null && (!tab || tab.id !== state.activeTabId)) {
      $('lcRunning').hidden = false;
      $('lcGoToCall').onclick = async () => {
        const t = await chrome.tabs.get(state.activeTabId).catch(() => null);
        if (t) {
          await chrome.tabs.update(t.id, { active: true });
          if (t.windowId != null) await chrome.windows.update(t.windowId, { focused: true });
        }
        window.close();
      };
      $('lcStopRunning').onclick = async () => {
        await chrome.runtime.sendMessage({ type: 'liveCopilot:stop' });
        $('lcRunning').hidden = true;
        initLiveCopilot();
      };
      return;
    }

    if (!platform) {
      // Not on a call tab: explain how to start, and offer any call tabs that are already open.
      $('lcNotOnCall').hidden = false;
      $('lcSettings').onclick = () => chrome.runtime.openOptionsPage();
      const all = await chrome.tabs.query({});
      const calls = all.filter((t) => LiveCopilot.detectPlatform(t.url));
      const names = { meet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams' };
      $('lcCallTabs').innerHTML = '';
      calls.slice(0, 3).forEach((t) => {
        const b = document.createElement('button');
        b.className = 'btn ghost';
        b.style.marginTop = '8px';
        b.textContent = `Switch to your ${names[LiveCopilot.detectPlatform(t.url)]} call`;
        b.onclick = async () => {
          await chrome.tabs.update(t.id, { active: true });
          if (t.windowId != null) await chrome.windows.update(t.windowId, { focused: true });
          window.close();
        };
        $('lcCallTabs').appendChild(b);
      });
      if (calls.length) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.style.marginTop = '6px';
        p.textContent = 'Then click the CareerOS icon again on that tab to start.';
        $('lcCallTabs').appendChild(p);
      }
      return;
    }

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
    if (state && state.activeTabId === tab.id) {
      $('lcStartBtn').hidden = true;
      $('lcStopBtn').hidden = false;
      $('lcStatus').textContent = 'Live Copilot is on for this call.';
    }
  }

  async function loadControls(tab, live) {
    const select = $('lcJobSelect');
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // Help always comes from the person's resume; picking the job adds its description and prep pack.
    select.innerHTML = '<option value="">Use my resume (any interview)</option>';
    try {
      const { targets, jobSpecific } = await Api.listTargets();
      if (jobSpecific && targets && targets.length) {
        select.innerHTML += targets
          .map((t) => `<option value="${esc(t.applicationId)}">${esc(t.jobTitle)} @ ${esc(t.companyName)}${/INTERVIEW/.test(t.status) ? ' · interviewing' : ''}</option>`)
          .join('');
        if (live.lastApplicationId && targets.some((t) => t.applicationId === live.lastApplicationId)) select.value = live.lastApplicationId;
      } else if (!jobSpecific) {
        $('lcUpgradeMsg').hidden = false;
      }
    } catch (err) {
      if (/Premium|upgrade|plan/i.test(err.message)) {
        $('lcUpgradeMsg').hidden = false;
        $('lcStartBtn').disabled = true;
      } else {
        $('lcStatus').textContent = `Couldn't load your jobs: ${err.message}`;
      }
    }

    $('lcTestBtn').onclick = async () => {
      $('lcTestBtn').disabled = true;
      $('lcTestResult').textContent = 'Capturing this tab’s audio for 15 seconds… stay on this call.';
      $('lcMeter').hidden = false;
      const res = await chrome.runtime.sendMessage({ type: 'liveCopilot:startTest', tabId: tab.id });
      if (!res || !res.ok) {
        $('lcTestResult').textContent = `Test failed: ${(res && res.error) || 'unknown error'}`;
        $('lcTestBtn').disabled = false;
      }
    };

    $('lcStartBtn').onclick = async () => {
      const applicationId = select.value;
      $('lcStartBtn').disabled = true;
      const res = await chrome.runtime.sendMessage({ type: 'liveCopilot:start', tabId: tab.id, applicationId });
      $('lcStartBtn').disabled = false;
      if (res && res.ok) {
        $('lcStartBtn').hidden = true;
        $('lcStopBtn').hidden = false;
        $('lcStatus').textContent = 'Live Copilot is on. When the interviewer asks a question, talking points from your resume appear on the call.';
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
