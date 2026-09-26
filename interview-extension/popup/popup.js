(async function () {
  'use strict';

  const { Storage, Api } = window.CareerOSInterviewPrep;
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
})();
