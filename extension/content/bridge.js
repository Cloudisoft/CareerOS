/* CareerOS — website bridge
 *
 * Runs only on the CareerOS website. It tells the page the extension is installed, and passes on one request:
 * "auto apply to this job" from a job's page. The job opens in a new tab and CareerOS fills it there, asking only
 * the questions it doesn't know yet. Nothing else crosses: no profile data, answers or settings go to the page.
 */
(function () {
  'use strict';
  if (window.top !== window) return;
  const version = chrome.runtime.getManifest().version;
  const reply = (data) => window.postMessage(Object.assign({ source: 'careeros-extension' }, data), location.origin);
  const announce = () => reply({ type: 'careeros-extension:ready', version });

  announce();
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data || {};
    if (d.source === 'careeros-extension') return;
    if (d.type === 'careeros-extension:ping') return announce();
    if (d.type !== 'careeros-extension:apply' || !d.job || typeof d.job.url !== 'string') return;
    const job = {
      id: String(d.job.id || '').slice(0, 80),
      url: String(d.job.url).slice(0, 2000),
      title: String(d.job.title || '').slice(0, 200),
      company: String(d.job.company || '').slice(0, 200),
      location: String(d.job.location || '').slice(0, 200),
    };
    try {
      chrome.runtime.sendMessage({ type: 'careeros:applyNow', job }, (res) => {
        const err = chrome.runtime.lastError;
        reply(Object.assign({ type: 'careeros-extension:apply-result', requestId: d.requestId }, err ? { ok: false, reason: 'unavailable' } : (res || { ok: false, reason: 'unavailable' })));
      });
    } catch (err) {
      reply({ type: 'careeros-extension:apply-result', requestId: d.requestId, ok: false, reason: 'unavailable' });
    }
  });
})();
