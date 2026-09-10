/* CareerOS API client
 *
 * One place that talks to the backend. Everything else in the extension goes
 * through this, so changing a route or an auth scheme touches one file.
 *
 * Auth is a device token obtained by pairing: the web app shows a six-character
 * code, the person types it here once, and a token comes back. No API key is
 * ever copied by hand, which is the step people abandon setup on.
 */
(function (root) {
  'use strict';

  const { Storage } = root.CareerOS;

  const DEFAULT_BASE = 'http://localhost:3000/api/extension';

  async function base() {
    const settings = await Storage.getSettings();
    return (settings.apiBase || DEFAULT_BASE).replace(/\/$/, '');
  }

  async function token() {
    const settings = await Storage.getSettings();
    return settings.deviceToken || '';
  }

  async function request(path, options = {}) {
    const url = `${await base()}${path}`;
    const auth = await token();

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-CareerOS-Version': chrome.runtime.getManifest().version,
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      throw new Error('This browser is not paired. Open CareerOS and generate a pairing code.');
    }

    let body = null;
    try { body = await res.json(); } catch (err) { body = null; }

    if (!res.ok) {
      throw new Error((body && body.error) || `CareerOS returned ${res.status}`);
    }
    return body;
  }

  const Api = {
    DEFAULT_BASE,

    /* Trades a six-character code for a device token, once. */
    async pair(code) {
      const settings = await Storage.getSettings();
      const url = `${(settings.apiBase || DEFAULT_BASE).replace(/\/$/, '')}/pair`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: String(code).trim().toUpperCase(),
          label: deviceLabel(),
          version: chrome.runtime.getManifest().version,
        }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && body.error) || `Pairing failed (${res.status})`);

      await Storage.saveSettings({
        deviceToken: body.token,
        pairedAs: body.email || body.name || '',
        pairedAt: Date.now(),
      });
      return body;
    },

    /* One-click sign in.
     *
     * The extension never sees a password. It opens the site, where the person
     * is already signed in, and collects a token once they approve. That also
     * means Google sign-in and 2FA keep working, which an email-and-password
     * box inside the extension would have broken. */
    async connect(onStatus) {
      const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

      await fetch(`${await base()}/connect/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          label: deviceLabel(),
          version: chrome.runtime.getManifest().version,
        }),
      });

      const settings = await Storage.getSettings();
      const tab = await chrome.tabs.create({
        url: `${(settings.webAppUrl || 'http://localhost:3000').replace(/\/$/, '')}/extension-connect?state=${state}`,
      });

      /* Poll rather than wait for a redirect, because the person may complete
         this in a different window, or take a detour through a login screen. */
      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));

        const res = await fetch(`${await base()}/connect/poll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        });
        const body = await res.json().catch(() => null);
        if (!body) continue;

        if (body.status === 'approved' && body.token) {
          await Storage.saveSettings({
            deviceToken: body.token,
            pairedAs: body.email || body.name || '',
            pairedAt: Date.now(),
          });
          try { await chrome.tabs.remove(tab.id); } catch (err) { /* already closed */ }
          return { ok: true, pairedAs: body.email || body.name || '' };
        }
        if (body.status === 'denied')  return { ok: false, error: 'You declined the connection.' };
        if (body.status === 'expired') return { ok: false, error: 'That took too long. Press Sign in again.' };
        if (onStatus) onStatus(body.status);
      }
      return { ok: false, error: 'Timed out waiting for approval.' };
    },

    async unpair() {
      await Storage.saveSettings({ deviceToken: '', pairedAs: '', pairedAt: null });
    },

    async isPaired() {
      return Boolean(await token());
    },

    /* Profile, targeting, resume and already-applied URLs in one request. The
       engine calls this at the start of every run, so it is deliberately one
       round trip rather than four. */
    async sync() {
      return request('/sync');
    },

    /* The tailored package for a specific posting — a resume summary and
       cover letter written for it, generated server-side the first time this
       posting is seen and cached after that. Returns { tailored: false } on
       any failure (not entitled, rate-limited, no profile yet), and the
       caller falls back to the base profile rather than refusing — someone
       who navigated to a posting themselves should still get their form
       filled. */
    async getPackage(job) {
      try {
        return await request('/package', {
          method: 'POST',
          body: JSON.stringify({
            jobUrl: job.url,
            title: job.title || '',
            company: job.company || '',
            description: job.description || '',
            ats: job.ats || '',
          }),
        });
      } catch (err) {
        return { tailored: false };
      }
    },

    async markPackageSubmitted(applicationId) {
      return request('/package/submitted', {
        method: 'POST',
        body: JSON.stringify({ applicationId }),
      });
    },

    async logApplication(entry) {
      return request('/application', { method: 'POST', body: JSON.stringify(entry) });
    },

    async heartbeat(run) {
      return request('/run', { method: 'POST', body: JSON.stringify(run) });
    },
  };

  function deviceLabel() {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows'
      : /Mac OS X/.test(ua) ? 'macOS'
      : /Linux/.test(ua) ? 'Linux'
      : /Android/.test(ua) ? 'Android' : '';
    return [browser, os].filter(Boolean).join(' on ');
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Api = Api;
})(typeof self !== 'undefined' ? self : this);
