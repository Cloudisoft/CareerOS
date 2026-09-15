(async function () {
  'use strict';

  const { Storage } = window.CareerOS;
  const $ = (id) => document.getElementById(id);

  const cmd = (command) =>
    new Promise((resolve) => chrome.runtime.sendMessage({ type: 'careeros:engine', command }, resolve));

  async function showConnected() {
    const settings = await Storage.getSettings();
    $('signinStep').hidden = true;
    $('connectedStep').hidden = false;
    $('connectedAs').textContent = settings.pairedAs
      ? `Connected as ${settings.pairedAs}.`
      : 'Connected.';
  }

  const settings = await Storage.getSettings();
  if (settings.deviceToken) {
    await showConnected();
  } else {
    $('signinBtn').onclick = async () => {
      $('signinBtn').disabled = true;
      $('signinBtn').textContent = 'Waiting for approval…';
      $('signinMsg').textContent = 'Approve it in the tab that just opened.';

      const res = await cmd('connect');

      if (res && res.ok) {
        $('signinMsg').textContent = 'Connected. Pulling your profile…';
        await cmd('sync');
        await showConnected();
      } else {
        $('signinBtn').disabled = false;
        $('signinBtn').textContent = 'Sign in to CareerOS';
        $('signinMsg').textContent = (res && res.error) || 'Could not sign in. Try again.';
      }
    };
  }

  $('startBtn').onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    window.close();
  };
  $('reviewBtn').onclick = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };
})();
