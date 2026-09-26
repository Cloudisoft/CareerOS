(async function () {
  'use strict';

  const { Storage, Api } = window.CareerOSInterviewPrep;
  const $ = (id) => document.getElementById(id);

  const settings = await Storage.getSettings();
  if (!settings.deviceToken) {
    document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">Not signed in. Open the CareerOS Interview Prep icon in your toolbar to sign in.</p>';
    return;
  }

  // ---------------- tabs ----------------
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-on', t.dataset.panel === name));
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== `panel-${name}`; });
    if (name === 'stories' && !storiesLoaded) loadStories();
  }
  document.querySelectorAll('.tab').forEach((t) => t.onclick = () => {
    location.hash = t.dataset.panel;
    showTab(t.dataset.panel);
  });
  showTab((location.hash || '#interview').slice(1));

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  function isUpgradeError(err) {
    return /plan upgrade|requires a plan|Standard or higher|Premium or higher/i.test(err.message || '');
  }

  document.querySelectorAll('.upgradeLink').forEach((a) => {
    a.href = `${(settings.webAppUrl || '').replace(/\/$/, '')}/settings/billing`;
    a.target = '_blank';
    a.rel = 'noreferrer';
  });

  // ================== Mock Interview ==================
  let currentSession = null;

  async function loadSessions() {
    try {
      const { sessions } = await Api.listSessions();
      renderSessionList(sessions);
      $('interviewStart').hidden = false;
    } catch (err) {
      if (isUpgradeError(err)) { $('interviewNotEntitled').hidden = false; return; }
      $('startError').hidden = false;
      $('startError').textContent = err.message;
      $('interviewStart').hidden = false;
    }
  }

  function renderSessionList(sessions) {
    $('sessionsEmpty').hidden = sessions.length > 0;
    $('sessionList').innerHTML = sessions.map((s) => `
      <li data-id="${esc(s.id)}">
        <span>
          <span class="title">${s.job ? `${esc(s.job.title)} @ ${esc(s.job.company.name)}` : 'General practice'}</span>
          <div class="meta">${esc(s.type)} · ${new Date(s.createdAt).toLocaleDateString()} · ${s._count.questions} question${s._count.questions === 1 ? '' : 's'}</div>
        </span>
        <span>${s.overallScore != null ? `${s.overallScore}%` : esc(s.status)}</span>
      </li>
    `).join('');
    $('sessionList').querySelectorAll('li').forEach((li) => {
      li.onclick = () => openSession(li.dataset.id);
    });
  }

  $('startBtn').onclick = async () => {
    $('startBtn').disabled = true;
    $('startError').hidden = true;
    try {
      const { session } = await Api.startSession($('typeSelect').value);
      currentSession = session;
      renderSession();
    } catch (err) {
      $('startError').hidden = false;
      $('startError').textContent = err.message;
    } finally {
      $('startBtn').disabled = false;
    }
  };

  async function openSession(id) {
    const { session } = await Api.getSession(id);
    currentSession = session;
    renderSession();
  }

  function renderSession() {
    const s = currentSession;
    const view = $('sessionView');
    view.hidden = false;

    if (s.status === 'COMPLETED') {
      view.innerHTML = `
        <h2>${s.job ? `${esc(s.job.title)} @ ${esc(s.job.company.name)}` : 'General practice'} <span class="badge">${s.overallScore ?? 0}%</span></h2>
        ${s.questions.map(renderAnsweredQuestion).join('')}
        <button class="btn ghost small" id="closeSession">Close</button>
      `;
      $('closeSession').onclick = () => { currentSession = null; view.hidden = true; loadSessions(); };
      return;
    }

    const current = s.questions.find((q) => q.answer == null);
    const answered = s.questions.filter((q) => q.answer != null);

    view.innerHTML = `
      <h2>Question ${s.questions.length} of 5</h2>
      ${current ? `
        <p class="qa q">${esc(current.category)}</p>
        <p class="q">${esc(current.question)}</p>
        <textarea id="answerDraft" rows="6" placeholder="Type your answer…"></textarea>
        <p class="error" id="answerError" hidden></p>
        <button class="btn" id="submitAnswer">Submit answer</button>
      ` : `
        <p>All questions answered.</p>
        <button class="btn" id="finishSession">Finish session</button>
      `}
      <button class="btn ghost small" id="closeSession">Close</button>
      ${answered.map(renderAnsweredQuestion).join('')}
    `;

    $('closeSession').onclick = () => { currentSession = null; view.hidden = true; loadSessions(); };

    if (current) {
      $('submitAnswer').onclick = async () => {
        const answer = $('answerDraft').value.trim();
        if (!answer) return;
        $('submitAnswer').disabled = true;
        $('answerError').hidden = true;
        try {
          await Api.submitAnswer(s.id, current.id, answer);
          await openSession(s.id);
        } catch (err) {
          $('answerError').hidden = false;
          $('answerError').textContent = err.message;
          $('submitAnswer').disabled = false;
        }
      };
    } else {
      $('finishSession').onclick = async () => {
        await Api.completeSession(s.id);
        await openSession(s.id);
      };
    }
  }

  function renderAnsweredQuestion(q) {
    return `
      <div class="qa">
        <p class="q">${esc(q.category)} — ${esc(q.question)}</p>
        ${q.answer ? `<p class="a">${esc(q.answer)}</p>` : ''}
        ${q.score != null ? `<p class="feedback"><span class="badge">${q.score}%</span> ${esc(q.feedback || '')}</p>` : ''}
      </div>
    `;
  }

  loadSessions();

  // ================== My Stories ==================
  let storiesLoaded = false;

  async function loadStories() {
    storiesLoaded = true;
    try {
      const { stories } = await Api.listStories();
      renderStories(stories);
    } catch (err) {
      if (isUpgradeError(err)) { $('storiesNotEntitled').hidden = false; $('storiesIntro').hidden = true; return; }
      $('storyList').innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  function renderStories(stories) {
    $('storyList').innerHTML = stories.map((s, i) => `
      <div class="card storyCard" data-q="${esc(s.question)}">
        <div class="qHeader">
          <strong>${esc(s.question)}</strong>
          ${s.lockedAt ? '<span class="badge">Locked</span>' : ''}
        </div>
        <textarea rows="4" id="story-${i}" ${s.lockedAt ? 'disabled' : ''}>${esc(s.answer || '')}</textarea>
        ${s.feedback ? `<p class="feedback" style="margin-top:8px">${s.score != null ? `<span class="badge">${s.score}%</span> ` : ''}${esc(s.feedback)}</p>` : ''}
        <p class="error" id="storyError-${i}" hidden></p>
        ${s.lockedAt
          ? `<button class="btn small ghost" data-action="unlock" data-i="${i}">Unlock to edit</button>`
          : `<button class="btn small" data-action="practice" data-i="${i}">Score this answer</button>
             <button class="btn small ghost" data-action="lock" data-i="${i}">Lock final answer</button>`
        }
      </div>
    `).join('');

    $('storyList').querySelectorAll('button[data-action]').forEach((btn) => {
      btn.onclick = async () => {
        const i = Number(btn.dataset.i);
        const question = stories[i].question;
        const textarea = $(`story-${i}`);
        const errorEl = $(`storyError-${i}`);
        const answer = textarea ? textarea.value.trim() : '';
        errorEl.hidden = true;
        btn.disabled = true;
        try {
          if (btn.dataset.action === 'practice') {
            if (!answer) throw new Error('Write an answer first.');
            await Api.practiceStory(question, answer);
          } else if (btn.dataset.action === 'lock') {
            if (!answer) throw new Error('Write an answer first.');
            await Api.lockStory(question, answer);
          } else if (btn.dataset.action === 'unlock') {
            await Api.unlockStory(question);
          }
          const { stories: refreshed } = await Api.listStories();
          renderStories(refreshed);
        } catch (err) {
          errorEl.hidden = false;
          errorEl.textContent = err.message;
          btn.disabled = false;
        }
      };
    });
  }
})();
