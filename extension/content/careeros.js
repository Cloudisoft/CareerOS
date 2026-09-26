/* CareerOS — page agent (headless)
 *
 * Nothing is drawn on the host page. The only visible trace is an outline on
 * fields that were filled and on required fields that still need the person.
 * Everything else is driven from the popup and the run dashboard.
 *
 * Two modes on the same code path:
 *   driven   The popup or the engine asks it to read, fill or submit.
 *   auto     The engine opened this tab: fill, advance, submit, report back.
 */
(function () {
  'use strict';

  if (window.__careerosLoaded) return;
  window.__careerosLoaded = true;
  if (window.top !== window.self && document.body && document.body.innerText.length < 200) return;

  const { Storage, Profile, ATS, Matcher, Filler, Policy, Flows, Harvest, Api } = window.CareerOS;

  const state = {
    adapter: null,
    posting: null,
    match: null,
    matchAll: null,      // every profile scored against the current posting, best first
    profile: null,       // the active profile, hydrated
    profiles: {},         // { id: profile }, all of them
    activeProfileId: null,
    settings: null,
    resume: null,
    policy: null,
    ready: false,
    busy: false,
    autoRunning: false, // an automated run (runAutomated) is actively working this tab
    report: null
  };

  /* Auto-harvest: what's been sent to the queue during this page-visit, and
     where the scroll/widen loop is. Lives outside `state` since it resets per
     page-life, not per posting. */
  const harvestState = {
    active: false,
    sentIds: new Set(),
    scrollCount: 0,
    timer: null
  };

  init();

  async function init() {
    state.settings = await Storage.getSettings();

    const profilesData = await Storage.getProfiles();
    state.profiles = profilesData.profiles;
    state.activeProfileId = profilesData.activeId;
    state.profile = Profile.hydrate(profilesData.profiles[profilesData.activeId]);

    // Remote selector overrides, if anything was ever fetched — see
    // refreshSelectorOverrides() below and lib/ats.js's applyOverrides().
    // Applied before the first detect() so this very page-load benefits
    // from a patch, not just the next one.
    const cachedOverrides = await Storage.getCachedSelectorOverrides();
    if (cachedOverrides && cachedOverrides.overrides) ATS.applyOverrides(cachedOverrides.overrides);

    state.resume = await Storage.getResume();
    state.adapter = ATS.detect(location);
    state.policy = Policy.for(state.adapter.id, state.settings);
    state.ready = Profile.isReady(state.profile);
    Filler.setHighlight(state.settings.highlightFields);

    refreshSelectorOverrides(cachedOverrides); // fire and forget

    if (Harvest.isSearchPage() && state.settings.autoHarvest !== false) startAutoHarvest();

    if (!state.ready) return;

    // Ask the worker whether this tab belongs to a run.
    const directive = await send({ type: 'careeros:ready' });
    if (directive && directive.job) {
      runAutomated(directive);
      return;
    }

    scan();
    watchForChanges();
  }

  /* A DOM change on some ATS breaking a selector shouldn't need a store
   * release to fix — the backend can push a patch (see
   * src/app/api/extension/selectors and src/app/api/admin/extension/selectors)
   * that this merges over lib/ats.js's hardcoded ADAPTERS. Refetched at most
   * once every few hours per browser, and any failure here just means the
   * extension keeps running on whatever it already had cached, or the
   * hardcoded defaults if it never fetched anything — this must never be a
   * point where a fill can break. */
  const SELECTOR_OVERRIDES_TTL_MS = 6 * 60 * 60 * 1000;

  async function refreshSelectorOverrides(cached) {
    if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < SELECTOR_OVERRIDES_TTL_MS) return;
    try {
      const res = await Api.getSelectorOverrides();
      if (!res || !res.overrides) return;
      await Storage.saveCachedSelectorOverrides(res.overrides);
      ATS.applyOverrides(res.overrides);
      // Re-detect in case this exact page's adapter selectors just changed.
      state.adapter = ATS.detect(location);
      state.policy = Policy.for(state.adapter.id, state.settings);
    } catch (err) {
      // Keep whatever was already applied — never let this block a fill.
    }
  }

  /* ================= reading the page ================= */

  function scan() {
    const posting = ATS.readPosting(state.adapter, document);
    if (!posting.title || posting.description.length < 200) return;
    if (state.posting && state.posting.title === posting.title && state.posting.url === posting.url) return;

    state.posting = posting;

    const ids = Object.keys(state.profiles || {});
    if (ids.length > 1) {
      const hydrated = ids.map((id) => Profile.hydrate(state.profiles[id]));
      state.matchAll = Matcher.scoreAll(hydrated, posting);
      state.match = state.matchAll.find((m) => m.profileId === state.activeProfileId) || state.matchAll[0];
    } else {
      state.matchAll = null;
      state.match = Matcher.score(state.profile, posting);
    }
    state.report = null;
    panelState.selectedProfileId = null;
    panelState.lastError = null;
    panelState.justLogged = false;
    showPanel();
  }

  function watchForChanges() {
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(scan, 800);
      if (harvestState.active) harvestAndQueue();
    }).observe(document.body, { childList: true, subtree: true });

    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        state.posting = null;
        state.report = null;
        hidePanel();
        setTimeout(scan, 1200);
      }
    }, 1000);
  }

  /* ================= the docked panel ================= */

  /* The popup is the full picture, but making someone open it just to start
     a fill is exactly the friction competitors like Simplify don't have —
     their whole pitch is a persistent panel docked to the job page itself.
     This is that panel: header, tabs (Autofill / Match Score / Profile), the
     current posting, a live per-field checklist once state.report exists,
     and a "Run Autofill Again" button wired to the same doFill() the popup
     itself calls. Shown whenever there's a posting to act on — during a
     driven session (scan()) or an automated run (runAutomated()) alike, so
     there's exactly one on-page UI surface, never two overlapping ones. */
  let panel = null;
  const panelState = { collapsed: false, tab: 'autofill', selectedProfileId: null, filling: false };

  function showPanel() {
    if (!document.body) return;
    const isNew = !panel;
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'careeros-panel';
      document.body.appendChild(panel);
    }
    renderPanel();
    // First time this tab shows the panel this page-life, and only once ever
    // per install (gated on settings, not a per-tab flag) — a quick, skippable
    // tour of the panel's own real elements, not the browser toolbar a
    // content script can't point at anyway.
    if (isNew && !panelState.collapsed && !state.settings.panelTutorialSeenAt) startTour();
  }

  function hidePanel() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
  }

  function currentMatch() {
    if (panelState.selectedProfileId && state.matchAll) {
      return state.matchAll.find((m) => m.profileId === panelState.selectedProfileId) || state.match;
    }
    return state.match;
  }

  function renderPanel() {
    if (!panel) return;

    if (panelState.collapsed) {
      const match = currentMatch();
      const score = match && !match.blocked ? match.score : null;
      panel.className = 'careeros-panel careeros-panel--collapsed';
      panel.innerHTML = `
        <button type="button" class="careeros-panel__edge" aria-label="Open CareerOS">
          <img class="careeros-panel__edge-icon" src="${iconUrl()}" alt="">
          <span class="careeros-panel__edge-score" data-tone="${scoreTone(score)}">${score == null ? '—' : score}</span>
        </button>
      `;
      panel.querySelector('.careeros-panel__edge').onclick = () => {
        panelState.collapsed = false;
        renderPanel();
      };
      if (tourState.active) endTour(true); // nothing to point at once collapsed
      return;
    }

    panel.className = 'careeros-panel';
    panel.innerHTML = `
      <div class="careeros-panel__header">
        <img class="careeros-panel__logo" src="${iconUrl()}" alt="">
        <span class="careeros-panel__brand">CareerOS</span>
        <button type="button" class="careeros-panel__icon-btn" data-action="settings" aria-label="Settings">${ICON_GEAR}</button>
        <button type="button" class="careeros-panel__icon-btn" data-action="collapse" aria-label="Collapse">${ICON_CHEVRON}</button>
      </div>
      <div class="careeros-panel__tabs">
        <button type="button" class="careeros-panel__tabbtn${panelState.tab === 'autofill' ? ' is-active' : ''}" data-tab="autofill">Autofill</button>
        <button type="button" class="careeros-panel__tabbtn${panelState.tab === 'match' ? ' is-active' : ''}" data-tab="match">Match Score</button>
        <button type="button" class="careeros-panel__tabbtn${panelState.tab === 'profile' ? ' is-active' : ''}" data-tab="profile">Profile</button>
      </div>
      <div class="careeros-panel__body">${renderPanelBody()}</div>
      <div class="careeros-panel__footer">${renderPanelFooter()}</div>
    `;

    panel.querySelector('[data-action="settings"]').onclick = () => {
      send({ type: 'careeros:openOptions', tab: 'you' });
    };
    panel.querySelector('[data-action="collapse"]').onclick = () => {
      panelState.collapsed = true;
      renderPanel();
    };
    panel.querySelectorAll('.careeros-panel__tabbtn').forEach((btn) => {
      btn.onclick = () => {
        panelState.tab = btn.dataset.tab;
        renderPanel();
      };
    });

    const profileOptions = panel.querySelectorAll('.careeros-panel__profile-option');
    profileOptions.forEach((opt) => {
      opt.onclick = () => {
        panelState.selectedProfileId = opt.dataset.profileId;
        renderPanel();
      };
    });
    const editProfile = panel.querySelector('[data-action="edit-profile"]');
    if (editProfile) editProfile.onclick = () => send({ type: 'careeros:openOptions', tab: 'you' });

    const cta = panel.querySelector('.careeros-panel__cta');
    if (cta && !cta.disabled) {
      cta.onclick = async () => {
        if (tourState.active) endTour(true); // a real click means they don't need the walk-through
        panelState.filling = true;
        renderPanel();
        const res = await doFill(panelState.selectedProfileId);
        panelState.filling = false;
        panelState.lastError = res.ok ? null : res.error;
        // Storage.logApplication (inside doFill) only writes once per URL —
        // priorApplication is set when this posting was already logged, so a
        // real, one-time "saved" note only shows the first time, not on
        // every "Run Autofill Again".
        panelState.justLogged = res.ok && !res.priorApplication;
        renderPanel();
      };
    }

    // Keep the tour's callout pinned to its target through every re-render
    // (a tab switch, a live checklist update while the tour is still up).
    if (tourState.active) renderTour();
  }

  function renderPanelFooter() {
    const match = currentMatch();
    const blocked = Boolean(match && match.blocked);
    if (panelState.filling) return `<button type="button" class="careeros-panel__cta" disabled>Filling…</button>`;
    const label = state.report ? 'Run Autofill Again' : (match && match.score < state.settings.minMatchScore ? 'Fill anyway' : 'Fill this application');
    return `<button type="button" class="careeros-panel__cta" ${blocked ? 'disabled' : ''}>${esc(label)}</button>`;
  }

  function renderPanelBody() {
    if (panelState.tab === 'match') return renderMatchTab();
    if (panelState.tab === 'profile') return renderProfileTab();
    return renderAutofillTab();
  }

  function renderPostingCard() {
    if (!state.posting) {
      return `<div class="careeros-panel__posting careeros-panel__posting--empty">Looking for a job posting on this page…</div>`;
    }
    return `
      <div class="careeros-panel__posting">
        <strong>${esc(state.posting.title || 'Untitled role')}</strong>
        ${state.posting.company ? `<span>${esc(state.posting.company)}</span>` : ''}
      </div>
    `;
  }

  function renderAutofillTab() {
    const parts = [renderPostingCard()];

    if (panelState.filling || state.busy || state.autoRunning) {
      parts.push(`
        <div class="careeros-panel__status">
          <span class="careeros-panel__status-dot"></span>
          <span>Filling…</span>
        </div>
      `);
    } else if (state.report) {
      const needsYou = state.report.skipped.filter((s) => s.required);
      parts.push(`
        <div class="careeros-panel__status" data-tone="${needsYou.length ? 'warn' : 'ok'}">
          ${needsYou.length ? `${needsYou.length} field${needsYou.length > 1 ? 's need' : ' needs'} you` : 'Autofill complete!'}
        </div>
      `);
      parts.push(renderChecklist(state.report));
      if (panelState.justLogged) parts.push(`<div class="careeros-panel__toast">Saved to your tracker.</div>`);
    } else if (panelState.lastError) {
      parts.push(`<div class="careeros-panel__status" data-tone="warn">${esc(panelState.lastError)}</div>`);
    } else {
      parts.push(`<div class="careeros-panel__status">Not filled yet — press the button below.</div>`);
    }

    return parts.join('');
  }

  function renderChecklist(report) {
    const rows = [];
    report.filled.forEach((f) => rows.push(checklistRow(f.label, 'filled')));
    report.generated.forEach((f) => rows.push(checklistRow(f.label, 'generated')));
    report.skipped.filter((s) => s.required).forEach((s) => rows.push(checklistRow(s.label, 'attention', s.reason)));
    if (!rows.length) return '';
    return `<ul class="careeros-panel__checklist">${rows.join('')}</ul>`;
  }

  function checklistRow(label, kind, reason) {
    const icon = kind === 'attention' ? ICON_ATTENTION : ICON_CHECK;
    const badge = kind === 'generated' ? `<span class="careeros-panel__badge" title="Written by JobGPT">${ICON_SPARKLE} AI</span>` : '';
    return `
      <li class="careeros-panel__item" data-kind="${kind}">
        <span class="careeros-panel__item-icon">${icon}</span>
        <span class="careeros-panel__item-label">${esc(label)}${reason ? `<small>${esc(reason)}</small>` : ''}</span>
        ${badge}
      </li>
    `;
  }

  function renderMatchTab() {
    const match = currentMatch();
    if (!match) return `<div class="careeros-panel__status">Scoring this posting…</div>`;
    const blocked = Boolean(match.blocked);
    const score = blocked ? null : match.score;
    const verdict = blocked ? { label: 'On your skip list' } : Matcher.verdict(score, state.settings.minMatchScore);
    const reasons = (blocked ? match.blockers : match.reasons) || [];

    return `
      <div class="careeros-panel__score-row">
        <div class="careeros-panel__score-circle" data-tone="${scoreTone(score)}">${score == null ? '—' : score}</div>
        <div class="careeros-panel__verdict">
          <strong>${esc(verdict.label)}</strong>
          <span>${esc((state.adapter && state.adapter.label) || '')}</span>
        </div>
      </div>
      ${reasons.length ? `<ul class="careeros-panel__reasons">${reasons.slice(0, 4).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    `;
  }

  function renderProfileTab() {
    const ids = Object.keys(state.profiles || {});
    const parts = [];

    if (state.matchAll && state.matchAll.length > 1) {
      const selected = panelState.selectedProfileId || (state.matchAll[0] && state.matchAll[0].profileId) || state.activeProfileId;
      parts.push(`<div class="careeros-panel__profile-list">${state.matchAll.map((m) => `
        <button type="button" class="careeros-panel__profile-option${m.profileId === selected ? ' is-active' : ''}" data-profile-id="${esc(m.profileId)}">
          <span>${esc(m.profileName)}</span>
          <span class="careeros-panel__profile-score">${m.score}</span>
        </button>
      `).join('')}</div>`);
    } else {
      const name = ids.length && state.profiles[ids[0]] ? state.profiles[ids[0]].name : 'your profile';
      parts.push(`<div class="careeros-panel__status">Filling from ${esc(name)}.</div>`);
    }

    parts.push(`<button type="button" class="careeros-panel__link" data-action="edit-profile">Edit your profile in CareerOS settings →</button>`);
    return parts.join('');
  }

  function iconUrl() {
    try { return chrome.runtime.getURL('icons/icon32.png'); } catch (err) { return ''; }
  }

  function scoreTone(score) {
    if (score == null) return 'unknown';
    if (score >= 85) return 'strong';
    if (score >= state.settings.minMatchScore) return 'good';
    return 'weak';
  }

  const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const ICON_ATTENTION = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="13"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  const ICON_SPARKLE = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"></path></svg>';
  const ICON_GEAR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  const ICON_CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  /* ================= first-run tour ================= */

  /* A short, skippable walk-through of the panel's own real elements — shown
     once per install (gated on settings.panelTutorialSeenAt, same
     get/saveSettings pattern as every other one-time flag, not a separate
     storage key), never the ten-step click-through gauntlet a competitor's
     reference screenshot showed. Points at things that actually exist on
     this panel; nothing here claims a feature (like a data-collection
     consent step) CareerOS doesn't really have. */
  const TOUR_STEPS = [
    { selector: '.careeros-panel__tabs', text: 'See your match score and switch profiles here.' },
    { selector: '.careeros-panel__posting', text: 'This is the job CareerOS detected on this page.' },
    { selector: '.careeros-panel__body', text: 'Every field CareerOS fills shows up here as it happens.' },
    { selector: '.careeros-panel__cta', text: 'One click fills the whole form.' },
    { selector: '.careeros-panel__icon-btn[data-action="settings"]', text: 'Manage your profile, resume, and which sites CareerOS can use.' }
  ];
  const tourState = { active: false, step: 0 };
  let tourEl = null;

  function startTour() {
    if (tourState.active || !panel) return;
    panelState.tab = 'autofill'; // steps 2-3 point at elements only on this tab
    renderPanel();
    tourState.active = true;
    tourState.step = 0;
    renderTour();
  }

  function endTour(markSeen) {
    tourState.active = false;
    if (tourEl && tourEl.parentNode) tourEl.parentNode.removeChild(tourEl);
    tourEl = null;
    if (markSeen) {
      state.settings.panelTutorialSeenAt = Date.now();
      Storage.saveSettings({ panelTutorialSeenAt: state.settings.panelTutorialSeenAt });
    }
  }

  function renderTour() {
    if (!tourState.active || !panel) return;
    const step = TOUR_STEPS[tourState.step];
    const target = panel.querySelector(step.selector);
    if (!target) { endTour(true); return; } // e.g. the panel got collapsed mid-tour

    if (!tourEl) {
      tourEl = document.createElement('div');
      tourEl.className = 'careeros-tour';
      document.body.appendChild(tourEl);
    }

    const isLast = tourState.step === TOUR_STEPS.length - 1;
    tourEl.innerHTML = `
      <div class="careeros-tour__count">${tourState.step + 1}/${TOUR_STEPS.length}</div>
      <p class="careeros-tour__text">${esc(step.text)}</p>
      <div class="careeros-tour__actions">
        <button type="button" class="careeros-tour__skip">Skip</button>
        <button type="button" class="careeros-tour__next">${isLast ? 'Got it' : 'Next'}</button>
      </div>
    `;

    const panelRect = panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    tourEl.style.right = `${Math.max(window.innerWidth - panelRect.left + 12, 12)}px`;
    tourEl.style.top = `${Math.min(Math.max(targetRect.top - 6, 12), window.innerHeight - 140)}px`;

    tourEl.querySelector('.careeros-tour__skip').onclick = () => endTour(true);
    tourEl.querySelector('.careeros-tour__next').onclick = () => {
      if (isLast) { endTour(true); return; }
      tourState.step += 1;
      renderTour();
    };
  }

  /* ================= auto-harvest ================= */

  /* Reads whatever cards are on screen right now, sends only the ones this
     page-visit hasn't already sent, and folds their count into the running
     total the popup badge reads from `snapshot()`. */
  async function harvestAndQueue() {
    const collected = Harvest.collect();
    if (!collected.ats) return 0;
    const fresh = collected.jobs.filter((j) => !harvestState.sentIds.has(j.id));
    if (!fresh.length) return 0;
    fresh.forEach((j) => harvestState.sentIds.add(j.id));
    await send({ type: 'careeros:engine', command: 'add', jobs: fresh });
    return fresh.length;
  }

  /* Scrolls to the bottom, or presses a "see more" / pagination control if one
     is there, and reports whether the page actually grew — the signal that
     there's more to collect. */
  function scrollForMore() {
    return new Promise((resolve) => {
      const before = document.body.scrollHeight;
      const more = Flows.byText(['see more jobs', 'show more jobs', 'load more', 'load more jobs', 'next']);
      if (more) Flows.press(more);
      window.scrollTo(0, document.body.scrollHeight);
      setTimeout(() => resolve(Boolean(more) || document.body.scrollHeight > before), 1200);
    });
  }

  /* Periodically harvests and gently auto-scrolls a search page without
     needing a click, capped so it can't run forever unattended. The manual
     "Queue these N" button in the popup still works as a top-up on demand;
     this is what keeps the queue filling while the person is just browsing. */
  async function startAutoHarvest() {
    if (harvestState.active) return;
    harvestState.active = true;

    const maxScrolls = state.settings.harvestMaxScrolls || 12;
    const maxJobs = state.settings.harvestMaxJobsPerVisit || 150;

    const tick = async () => {
      if (!harvestState.active) return;
      await harvestAndQueue();

      if (harvestState.sentIds.size >= maxJobs || harvestState.scrollCount >= maxScrolls) {
        stopAutoHarvest();
        return;
      }

      const grew = await scrollForMore();
      if (!grew) { stopAutoHarvest(); return; }
      harvestState.scrollCount += 1;
      harvestState.timer = setTimeout(tick, 3500);
    };

    tick();
  }

  function stopAutoHarvest() {
    harvestState.active = false;
    clearTimeout(harvestState.timer);
    maybeWidenLinkedInSearch();
  }

  /* If a LinkedIn search settled with almost nothing harvested, the radius is
     probably too tight. Widen it and reload, twice at most, so a thin market
     doesn't just quietly come back empty. */
  function maybeWidenLinkedInSearch() {
    if (state.adapter.id !== 'linkedin') return;
    if (harvestState.sentIds.size >= 5) return;

    let url;
    try { url = new URL(location.href); } catch (err) { return; }
    const steps = [25, 50, 100];
    const current = Number(url.searchParams.get('distance') || 0);
    const next = steps.find((s) => s > current);
    if (!next) return;

    let attempts = 0;
    try { attempts = Number(sessionStorage.getItem('careeros:widenAttempts') || '0'); } catch (err) { /* private mode */ }
    if (attempts >= 2) return;

    try { sessionStorage.setItem('careeros:widenAttempts', String(attempts + 1)); } catch (err) { /* ignore */ }
    url.searchParams.set('distance', String(next));
    location.replace(url.toString());
  }

  /* What the popup renders itself from. */
  function snapshot() {
    const harvest = Harvest.isSearchPage() ? Harvest.collect() : null;
    const permission = Policy.canAutoSubmit(state.adapter.id, state.settings);

    return {
      ok: true,
      ready: state.ready,
      kind: harvest ? 'search' : (state.posting ? 'posting' : 'none'),
      ats: state.adapter.id,
      atsLabel: state.adapter.label,
      policy: state.policy,
      policyLabel: Policy.label(state.policy.mode),
      canSubmit: permission.allowed,
      submitNote: permission.reason,
      posting: state.posting,
      match: state.match,
      matchAll: state.matchAll,
      report: state.report && summarize(state.report),
      // Auto-harvest runs continuously in the background of this tab, so the
      // count is the running total collected this page-visit, not just what
      // happens to be rendered on screen the instant the popup asks.
      harvest: harvest ? {
        ats: harvest.ats,
        count: harvestState.sentIds.size || harvest.jobs.length,
        easy: harvest.jobs.filter((j) => j.easyApply).length
      } : null,
      busy: state.busy
    };
  }

  function summarize(report) {
    const needsYou = report.skipped.filter((s) => s.required);
    return {
      total: report.total,
      filled: report.filled.length + report.generated.length,
      generated: report.generated.length,
      needsYou: needsYou.map((n) => n.label).slice(0, 6),
      needsYouCount: needsYou.length
    };
  }

  /* ================= driven by the popup ================= */

  async function doFill(profileId) {
    if (state.busy) return { ok: false, error: 'Already filling' };

    const cap = await Storage.appliedToday();
    if (cap >= state.settings.dailyLimit) {
      return { ok: false, error: `Daily cap of ${state.settings.dailyLimit} reached` };
    }

    // A profileId lets the popup fill from whichever profile fits this
    // posting best without changing which profile is globally active.
    const override = profileId && state.profiles[profileId] ? Profile.hydrate(state.profiles[profileId]) : null;
    const fillProfile = override || state.profile;
    const match = override && state.matchAll
      ? (state.matchAll.find((m) => m.profileId === profileId) || state.match)
      : state.match;

    state.busy = true;
    if (panel) renderPanel(); // also reflects a fill triggered from the popup, not just the panel's own button
    try {
      const prior = await Storage.alreadyApplied(location.href);
      const form = ATS.findForm(state.adapter, document) || document.body;
      const report = await Filler.fillForm(form, fillProfile, buildContext(null, null, override));
      state.report = report;

      if (!prior) {
        await Storage.logApplication({
          url: location.href,
          title: (state.posting && state.posting.title) || document.title,
          company: state.posting && state.posting.company,
          ats: state.adapter.id,
          score: match ? match.score : null,
          filled: report.filled.length + report.generated.length,
          status: 'filled'
        });
      }

      return { ok: true, report: summarize(report), priorApplication: prior ? prior.at : null };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      state.busy = false;
      if (panel) renderPanel();
    }
  }

  async function doSubmit() {
    const permission = Policy.canAutoSubmit(state.adapter.id, state.settings);
    if (!permission.allowed) return { ok: false, error: permission.reason };

    const form = ATS.findForm(state.adapter, document) || document;
    const button = ATS.findSubmit(state.adapter, form)
      || Flows.byText(['submit application', 'submit', 'send application']);
    if (!button) return { ok: false, error: 'No submit button on this step' };

    await Flows.press(button);
    const confirmed = await Flows.waitFor(() => isConfirmation(), 8000);

    if (confirmed) {
      const applied = await Storage.alreadyApplied(location.href);
      if (applied) await Storage.updateApplication(applied.id, { status: 'submitted', submittedAt: Date.now() });
    }
    return { ok: true, confirmed: Boolean(confirmed) };
  }

  /* ================= automated run ================= */

  async function runAutomated(directive) {
    showAutofillBanner();
    try {
      const flowId = Policy.flow(state.adapter.id);
      if (flowId) return report(await runFlow(Flows.get(flowId), directive));

      const gate = await waitForForm();
      if (gate.blocked) return report({ outcome: 'failed', detail: gate.blocked });

      state.posting = ATS.readPosting(state.adapter, document);
      if (!state.posting.title) state.posting.title = directive.job.title;
      if (!state.posting.company) state.posting.company = directive.job.company;

      return report(await stepThrough(directive.directive));
    } catch (err) {
      return report({ outcome: 'failed', detail: err.message });
    } finally {
      hideAutofillBanner();
    }
  }

  /* A dismissible on-page signal that this tab is being worked automatically
     — the one thing a hidden background tab can't show, but costs nothing to
     add for the times a run tab (or a showApplyTabs window) is actually on
     screen. Rather than a second, separate floating pill, this drives the
     same docked panel scan()/doFill() use — one on-page UI surface, not two
     overlapping ones — showing a "Filling…" status line until the run's
     Filler.fillForm calls land in state.report. Collapsing (or the panel
     never having been shown yet) only hides the status; the fill itself
     keeps going regardless. */
  function showAutofillBanner() {
    state.autoRunning = true;
    showPanel();
  }
  function hideAutofillBanner() {
    state.autoRunning = false;
    if (state.posting) renderPanel();
    else hidePanel();
  }

  /* The generic-ATS and aggregator-flow paths below fill the same form as
     doFill(), just without going through it — this keeps state.report (and
     so the panel's live checklist) current across every step of an
     automated run too, not only a person-driven fill from the popup. */
  async function fillTracked(scope, profile, context) {
    const rep = await Filler.fillForm(scope, profile, context);
    state.report = rep;
    if (panel) renderPanel();
    return rep;
  }

  /* Aggregator flows: open the apply surface, then work it step by step. */
  async function runFlow(flow, directive) {
    if (!flow) return { outcome: 'failed', detail: 'no flow for this platform' };

    // Score from the page, since a harvested card has no description.
    state.posting = ATS.readPosting(state.adapter, document);
    if (state.posting.description.length > 200) {
      const match = Matcher.score(state.profile, state.posting);
      if (match.blocked) return { outcome: 'skipped', detail: match.blockers[0] };
      if (match.score < state.settings.minMatchScore) {
        return { outcome: 'skipped', detail: `scored ${match.score} once the description loaded` };
      }
      state.match = match;
    }

    const opened = await flow.open();
    if (opened.error === 'external_apply') {
      return { outcome: 'skipped', detail: 'applies on the employer site — queue that instead' };
    }
    if (opened.error) return { outcome: 'failed', detail: opened.error };

    const scope = opened.root || document;
    const directiveProfile = directive.directive.profileOverride ? Profile.hydrate(directive.directive.profileOverride) : null;
    const context = buildContext(directive.directive.pregenerated, directive.directive, directiveProfile);
    let filledTotal = 0;

    for (let step = 0; step < directive.directive.maxSteps; step++) {
      const blocked = detectBlocker();
      if (blocked) { await flow.close(); return { outcome: 'failed', detail: blocked }; }
      if (flow.isDone()) return { outcome: 'submitted', detail: `${filledTotal} fields over ${step} step${step === 1 ? '' : 's'}` };

      const before = { sig: formSignature(scope), progress: flow.progress(scope) };
      const filled = await fillTracked(scope, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;
      reportProgress(step + 1, directive.directive.maxSteps, filledTotal);

      const unanswered = filled.skipped.filter((f) => f.required);
      if (unanswered.length) {
        await flow.close();
        return { outcome: 'skipped', detail: `needs you: ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` };
      }

      if (!directive.directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.directive.policyNote}` };
      }

      const c = flow.controls(scope);
      const button = c.submit || c.review || c.next;
      if (!button) {
        await flow.close();
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found nothing to press' }
          : { outcome: 'failed', detail: 'no control on this step' };
      }

      if (!await Flows.press(button)) {
        await flow.close();
        return { outcome: 'skipped', detail: 'the next button was disabled, so something is unanswered' };
      }

      const moved = await Flows.waitFor(() => {
        if (flow.isDone()) return 'done';
        if (flow.progress(scope) !== before.progress) return 'progress';
        if (formSignature(scope) !== before.sig) return 'changed';
        return null;
      }, 14000);

      if (flow.isDone()) {
        return { outcome: 'submitted', detail: `${filledTotal} fields over ${step + 1} step${step ? 's' : ''}` };
      }
      if (!moved) {
        const errors = readFormErrors();
        if (errors) {
          const retry = await retryFlowValidationOnce(flow, scope, context, before);
          filledTotal += retry.filledDelta;
          if (retry.outcome) { await flow.close(); return retry.outcome; }
          reportProgress(step + 1, directive.directive.maxSteps, filledTotal);
          continue; // the retry's press actually moved the form on
        }
        await flow.close();
        return { outcome: 'failed', detail: 'the form did not move' };
      }
    }

    await flow.close();
    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  /* One retry after a submit/next press left validation errors on screen —
   * the classifier may have answered a field wrong (a phone format the form
   * rejected) or skipped a required one it didn't recognise. Re-fills the
   * same scope (a fixed field may now read differently, e.g. a highlighted
   * error) and presses once more. Capped at exactly this one attempt: a
   * regular retry loop on the same failing submission is exactly the
   * metronome pattern lib/policy.js's jitter exists to avoid. Returns
   * {filledDelta, outcome:null} when the retry's press actually moved the
   * form on (caller's step loop should just continue), or {filledDelta,
   * outcome:{...}} with a terminal result otherwise. */
  async function retryFlowValidationOnce(flow, scope, context, before) {
    const retryReport = await fillTracked(scope, context.profileOverride || state.profile, context);
    const filledDelta = retryReport.filled.length + retryReport.generated.length;
    const changed = describeChangedFields(retryReport);

    const unanswered = retryReport.skipped.filter((f) => f.required);
    if (unanswered.length) {
      return { filledDelta, outcome: { outcome: 'skipped', detail: `still needs you after retrying (changed: ${changed}): ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` } };
    }

    const c = flow.controls(scope);
    const button = c.submit || c.review || c.next;
    if (!button || !await Flows.press(button)) {
      return { filledDelta, outcome: { outcome: 'failed', detail: `retried (changed: ${changed}) but found nothing to press` } };
    }

    const movedAgain = await Flows.waitFor(() => {
      if (flow.isDone()) return 'done';
      if (flow.progress(scope) !== before.progress) return 'progress';
      if (formSignature(scope) !== before.sig) return 'changed';
      return null;
    }, 14000);

    if (flow.isDone()) {
      return { filledDelta, outcome: { outcome: 'submitted', detail: `submitted after one retry (changed: ${changed})` } };
    }
    if (!movedAgain) {
      const stillErrors = readFormErrors();
      return {
        filledDelta,
        outcome: {
          outcome: stillErrors ? 'skipped' : 'failed',
          detail: `retried once (changed: ${changed}) — ${stillErrors || 'the form still did not move'}`
        }
      };
    }
    return { filledDelta, outcome: null };
  }

  /* Some flows show the posting first and the form only after a button. */
  async function waitForForm() {
    const deadline = Date.now() + 25000;
    let pressedApply = false;

    while (Date.now() < deadline) {
      const blocked = detectBlocker();
      if (blocked) return { blocked };

      const form = ATS.findForm(state.adapter, document);
      if (form && hasAnswerableFields(form)) return { form };

      if (!pressedApply) {
        const applyBtn = Flows.byText(['apply for this job', 'apply now', 'apply to this job', "i'm interested", 'apply']);
        if (applyBtn) {
          await Flows.press(applyBtn);
          pressedApply = true;
          await sleep(1500);
          continue;
        }
      }
      await sleep(500);
    }
    return { blocked: 'no_form' };
  }

  /* Generic multi-step ATS form. */
  async function stepThrough(directive) {
    const directiveProfile = directive.profileOverride ? Profile.hydrate(directive.profileOverride) : null;
    const context = buildContext(directive.pregenerated, directive, directiveProfile);
    let filledTotal = 0;

    for (let step = 0; step < directive.maxSteps; step++) {
      const blocked = detectBlocker();
      if (blocked) return { outcome: 'failed', detail: blocked };
      if (isConfirmation()) {
        return { outcome: 'submitted', detail: `confirmed after ${step} step${step === 1 ? '' : 's'}` };
      }

      const form = ATS.findForm(state.adapter, document) || document.body;
      const before = formSignature(form);

      const filled = await fillTracked(form, context.profileOverride || state.profile, context);
      filledTotal += filled.filled.length + filled.generated.length;
      reportProgress(step + 1, directive.maxSteps, filledTotal);

      const unanswered = filled.skipped.filter((s) => s.required);
      if (unanswered.length) {
        return { outcome: 'skipped', detail: `needs you: ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` };
      }

      if (!directive.autoSubmit) {
        return { outcome: 'assisted', detail: `${filledTotal} fields filled, ${directive.policyNote}` };
      }

      const button = ATS.findSubmit(state.adapter, form)
        || ATS.findSubmit(state.adapter, document)
        || Flows.byText(['submit application', 'submit', 'send application', 'next', 'continue', 'save and continue', 'review']);

      if (!await Flows.press(button)) {
        return filledTotal
          ? { outcome: 'assisted', detail: 'filled but found no submit or next button' }
          : { outcome: 'failed', detail: 'nothing to fill and nothing to press' };
      }

      const changed = await waitForChange(before);
      if (isConfirmation()) {
        return { outcome: 'submitted', detail: `${filledTotal} fields over ${step + 1} step${step ? 's' : ''}` };
      }
      if (!changed) {
        const errors = readFormErrors();
        if (errors) {
          const retry = await retryFormValidationOnce(form, context, before);
          filledTotal += retry.filledDelta;
          if (retry.outcome) return retry.outcome;
          reportProgress(step + 1, directive.maxSteps, filledTotal);
          continue; // the retry's press actually moved the form on
        }
        return { outcome: 'failed', detail: 'the form did not move after submit' };
      }
    }
    return { outcome: 'failed', detail: 'ran out of steps before a confirmation' };
  }

  /* Generic-ATS counterpart to retryFlowValidationOnce — see its comment for
   * why this is capped at exactly one attempt. */
  async function retryFormValidationOnce(form, context, before) {
    const retryReport = await fillTracked(form, context.profileOverride || state.profile, context);
    const filledDelta = retryReport.filled.length + retryReport.generated.length;
    const changed = describeChangedFields(retryReport);

    const unanswered = retryReport.skipped.filter((s) => s.required);
    if (unanswered.length) {
      return { filledDelta, outcome: { outcome: 'skipped', detail: `still needs you after retrying (changed: ${changed}): ${unanswered.slice(0, 3).map((u) => u.label).join(', ')}` } };
    }

    const button = ATS.findSubmit(state.adapter, form)
      || ATS.findSubmit(state.adapter, document)
      || Flows.byText(['submit application', 'submit', 'send application', 'next', 'continue', 'save and continue', 'review']);

    if (!await Flows.press(button)) {
      return { filledDelta, outcome: { outcome: 'failed', detail: `retried (changed: ${changed}) but found nothing to press` } };
    }

    const movedAgain = await waitForChange(before);
    if (isConfirmation()) {
      return { filledDelta, outcome: { outcome: 'submitted', detail: `submitted after one retry (changed: ${changed})` } };
    }
    if (!movedAgain) {
      const stillErrors = readFormErrors();
      return {
        filledDelta,
        outcome: {
          outcome: stillErrors ? 'skipped' : 'failed',
          detail: `retried once (changed: ${changed}) — ${stillErrors || 'the form still did not move'}`
        }
      };
    }
    return { filledDelta, outcome: null };
  }

  /* A short, human-readable list of what the retry actually changed, for the
   * result detail the dashboard shows — "why did the retry work/fail" is
   * otherwise invisible. */
  function describeChangedFields(report) {
    const labels = report.filled.map((f) => f.label).concat(report.generated.map((f) => f.label));
    if (!labels.length) return 'nothing';
    return labels.slice(0, 4).join(', ') + (labels.length > 4 ? ` +${labels.length - 4} more` : '');
  }

  function report(result) {
    return send({ type: 'careeros:result', result });
  }

  /* Fire-and-forget: lets the dashboard show "step 3 of 7" instead of a flat
     "Applying" pill for however long a multi-step form takes. Losing one of
     these to a suspended service worker is cosmetic, so no response is awaited. */
  function reportProgress(step, maxSteps, filled) {
    try {
      chrome.runtime.sendMessage({ type: 'careeros:progress', step, maxSteps, filled }, () => void chrome.runtime.lastError);
    } catch (err) { /* tab is going away */ }
  }

  /* ================= page signals ================= */

  function detectBlocker() {
    if (document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .h-captcha, .g-recaptcha, [class*="cf-turnstile"]')) {
      return 'captcha';
    }
    const pw = document.querySelector('input[type="password"]');
    if (pw && Flows.visible(pw)) return 'needs_login';
    const text = bodyText();
    if (/sign in to (continue|apply)|log ?in to apply|please sign in/i.test(text)) return 'needs_login';
    if (/no longer accepting applications|this (job|position) (is|has) (closed|expired|been filled)/i.test(text)) return 'closed';
    return null;
  }

  function isConfirmation() {
    return /thank you for (applying|your application)|application (was |has been )?(received|submitted|sent)|we(?:'ve| have) received your application|successfully applied|your application is (in|complete)/i
      .test(bodyText());
  }

  function readFormErrors() {
    const nodes = Array.from(document.querySelectorAll(
      '[role="alert"], .error, .field-error, [class*="errorMessage"], [aria-invalid="true"]'
    )).filter(Flows.visible);
    if (!nodes.length) return null;
    const msgs = nodes
      .map((n) => (n.getAttribute('aria-label') || n.textContent || '').trim())
      .filter((t) => t && t.length < 160);
    return msgs.length ? `form rejected it: ${msgs.slice(0, 2).join('; ')}` : null;
  }

  function hasAnswerableFields(form) {
    return form.querySelectorAll('input:not([type="hidden"]), select, textarea').length >= 2;
  }

  function formSignature(scope) {
    const fields = Array.from(scope.querySelectorAll('input, select, textarea'))
      .map((f) => f.name || f.id || f.type).join('|');
    return `${location.href}::${fields.length}::${fields.slice(0, 400)}`;
  }

  async function waitForChange(before) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      await sleep(400);
      if (isConfirmation()) return true;
      const current = ATS.findForm(state.adapter, document);
      if (!current) return true;
      if (formSignature(current) !== before) return true;
    }
    return false;
  }

  function bodyText() {
    return (document.body.innerText || '').slice(0, 8000);
  }

  /* ================= shared ================= */

  function buildContext(pregenerated, tailored, directiveProfile) {
    /* directiveProfile is the profile this specific job was queued and scored
       against (see Engine.build/add + handleReady) — it may not be whichever
       profile is globally active. Falls back to the active profile, same as
       before, when nothing overrides it. */
    const baseProfile = directiveProfile || state.profile;

    /* When a tailored package exists, the form is filled from the resume
       written for this specific posting rather than the base profile. That
       distinction is the whole product: a spray tool sends one resume
       everywhere, this sends the one written for this role.

       Only narrative.summary is ever overridden today, so this merges one
       level into narrative rather than replacing it outright — a shallow
       Object.assign here would silently drop whyLeaving/availableFrom. */
    const profileForFill = tailored?.tailoredResume
      ? Profile.hydrate(
          Object.assign({}, baseProfile, {
            narrative: Object.assign({}, baseProfile.narrative, tailored.tailoredResume.narrative)
          })
        )
      : baseProfile;

    // Screening answers are scoped to whichever profile is actually being used
    // to fill this form — different profiles reasonably answer the same
    // generic question differently.
    const profileId = baseProfile.id || state.activeProfileId;

    return {
      profileOverride: profileForFill,
      resume: state.resume,

      async answerQuestion(question) {
        /* An answer approved for this specific role wins over the bank, because
           the person reviewed it against this posting. */
        const approved = (tailored?.screeningAnswers || []).find(
          (a) => normalizeQuestion(a.question) === normalizeQuestion(question)
        );
        if (approved && approved.confidence === 'high') return approved.answer;

        const remembered = await Storage.recallAnswer(question, profileId);
        if (remembered) return remembered;
        if (!state.settings.tailorScreeningAnswers) return null;
        const answer = await ask('answerQuestion', { question });
        if (answer) await Storage.rememberAnswer(question, answer, profileId);
        return answer;
      },

      async generate(kind) {
        if (kind === 'coverLetter' && pregenerated) return pregenerated;
        if (kind === 'coverLetter' && !state.settings.tailorCoverLetter) return '';
        return ask(kind, {});
      }
    };
  }

  function ask(kind, payload) {
    return send({
      type: 'careeros:generate',
      kind,
      payload,
      posting: state.posting || {},
      match: state.match || {}
    }).then((res) => (res && res.ok ? res.text : null));
  }

  function send(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (res) => {
          void chrome.runtime.lastError;
          resolve(res);
        });
      } catch (err) {
        resolve(null);
      }
    });
  }

  function normalizeQuestion(q) {
    return String(q || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* ================= popup protocol ================= */

  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'careeros:ping') { respond(snapshot()); return true; }
    if (msg.type === 'careeros:fill') { doFill(msg.profileId).then(respond); return true; }
    if (msg.type === 'careeros:submit') { doSubmit().then(respond); return true; }
    if (msg.type === 'careeros:harvest') {
      const collected = Harvest.collect();
      respond({ ok: true, ats: collected.ats, jobs: collected.jobs });
      return true;
    }
    return false;
  });
})();
