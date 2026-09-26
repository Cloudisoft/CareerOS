/* CareerOS Interview Prep — API client
 *
 * Own small copy of the device-token pairing pattern Auto Apply's
 * extension/lib/careeros-api.js uses — same backend endpoints (device
 * pairing is account-level, not feature-specific), but this file is not
 * shared code: it's written fresh for this extension so the two packages
 * have no runtime dependency on each other.
 */
(function (root) {
  'use strict';

  const { Storage } = root.CareerOSInterviewPrep;

  async function base() {
    const settings = await Storage.getSettings();
    return (settings.apiBase || '').replace(/\/$/, '');
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
      throw new Error('This browser is not paired. Sign in again from the popup.');
    }

    let body = null;
    try { body = await res.json(); } catch (err) { body = null; }

    if (!res.ok) {
      throw new Error((body && body.error) || `CareerOS returned ${res.status}`);
    }
    return body;
  }

  function deviceLabel() {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows'
      : /Mac OS X/.test(ua) ? 'macOS'
      : /Linux/.test(ua) ? 'Linux'
      : /Android/.test(ua) ? 'Android' : '';
    return [browser, os, '(Interview Prep)'].filter(Boolean).join(' ');
  }

  const Api = {
    /* Six-character code from the CareerOS site, typed here once. */
    async pair(code) {
      const settings = await Storage.getSettings();
      const url = `${(settings.apiBase || '').replace(/\/$/, '')}/pair`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: String(code).trim().toUpperCase(), label: deviceLabel(), version: chrome.runtime.getManifest().version }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && body.error) || `Pairing failed (${res.status})`);

      await Storage.saveSettings({ deviceToken: body.token, pairedAs: body.email || body.name || '', pairedAt: Date.now() });
      return body;
    },

    /* One-click sign-in: opens the CareerOS site, where the person is
     * already signed in, and polls for their approval. Long-running, so the
     * caller (background/service-worker.js) is what actually invokes this —
     * a popup closing when the approval tab gets focus would otherwise kill
     * an in-progress poll. */
    async connect() {
      const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const apiBase = await base();

      await fetch(`${apiBase}/connect/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, label: deviceLabel(), version: chrome.runtime.getManifest().version }),
      });

      const settings = await Storage.getSettings();
      const tab = await chrome.tabs.create({
        url: `${(settings.webAppUrl || '').replace(/\/$/, '')}/extension-connect?state=${state}`,
      });

      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await fetch(`${apiBase}/connect/poll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        });
        const body = await res.json().catch(() => null);
        if (!body) continue;

        if (body.status === 'approved' && body.token) {
          await Storage.saveSettings({ deviceToken: body.token, pairedAs: body.email || body.name || '', pairedAt: Date.now() });
          try { await chrome.tabs.remove(tab.id); } catch (err) { /* already closed */ }
          return { ok: true, pairedAs: body.email || body.name || '' };
        }
        if (body.status === 'denied') return { ok: false, error: 'You declined the connection.' };
        if (body.status === 'expired') return { ok: false, error: 'That took too long. Press Sign in again.' };
      }
      return { ok: false, error: 'Timed out waiting for approval.' };
    },

    async unpair() {
      await Storage.saveSettings({ deviceToken: '', pairedAs: '', pairedAt: null });
    },

    async isPaired() {
      return Boolean(await token());
    },

    // ---------------- Mock interviews ----------------
    async listSessions() {
      return request('/interview/sessions');
    },
    async startSession(type, jobId) {
      return request('/interview/sessions', { method: 'POST', body: JSON.stringify({ type, jobId: jobId || '' }) });
    },
    async getSession(id) {
      return request(`/interview/sessions/${id}`);
    },
    async submitAnswer(sessionId, questionId, answer) {
      return request(`/interview/sessions/${sessionId}/questions/${questionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });
    },
    async completeSession(sessionId) {
      return request(`/interview/sessions/${sessionId}/complete`, { method: 'POST' });
    },

    // ---------------- My Stories ----------------
    async listStories() {
      return request('/interview/stories');
    },
    async practiceStory(question, answer) {
      return request('/interview/stories', { method: 'POST', body: JSON.stringify({ question, answer }) });
    },
    async lockStory(question, answer) {
      return request('/interview/stories/lock', { method: 'POST', body: JSON.stringify({ question, answer }) });
    },
    async unlockStory(question) {
      return request('/interview/stories/lock', { method: 'DELETE', body: JSON.stringify({ question }) });
    },
  };

  root.CareerOSInterviewPrep = root.CareerOSInterviewPrep || {};
  root.CareerOSInterviewPrep.Api = Api;
})(typeof self !== 'undefined' ? self : this);
