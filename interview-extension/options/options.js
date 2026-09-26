(async function () {
  'use strict';

  const { Storage, LiveCopilot } = window.CareerOSInterviewPrep;
  const $ = (id) => document.getElementById(id);

  $('consentList').innerHTML = LiveCopilot.CONSENT_TEXT.map((line) => `<li>${line}</li>`).join('');

  async function render() {
    const live = await Storage.getLiveCopilotSettings();
    if (live.consentedVersion >= LiveCopilot.CONSENT_VERSION) {
      $('consentState').textContent = `You agreed to this disclosure (version ${live.consentedVersion}) on ${new Date(live.consentedAt).toLocaleString()}.`;
    } else {
      $('consentState').textContent = "You haven't agreed to this disclosure yet — you'll be asked the next time you open the popup on a call.";
    }
  }

  $('resetConsent').onclick = async () => {
    await Storage.saveLiveCopilotSettings({ consentedVersion: 0, consentedAt: null, enabled: false });
    await render();
  };

  await render();
})();
