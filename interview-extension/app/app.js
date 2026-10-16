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
    $('startBtn').textContent = 'Thinking of your first question…';
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
      $('startBtn').textContent = 'Start interview';
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
        <div id="recapBox"></div>
        ${s.questions.map(renderAnsweredQuestion).join('')}
        <div class="row">
          ${s.job ? '<button class="btn ghost small" id="thankYouBtn">Draft a thank-you email</button>' : ''}
          <button class="btn ghost small" id="closeSession">Close</button>
        </div>
        <p class="error" id="thankYouError" hidden></p>
        <div id="thankYouBox" hidden></div>
      `;
      $('closeSession').onclick = () => { currentSession = null; view.hidden = true; loadSessions(); };
      loadRecap(s.id);

      if (s.job) {
        $('thankYouBtn').onclick = async () => {
          $('thankYouBtn').disabled = true;
          $('thankYouBtn').textContent = 'Writing…';
          $('thankYouError').hidden = true;
          try {
            const { draft } = await Api.draftThankYou(s.id);
            $('thankYouBox').hidden = false;
            $('thankYouBox').innerHTML = `<pre class="thankYouDraft">${esc(draft)}</pre>`;
          } catch (err) {
            $('thankYouError').hidden = false;
            $('thankYouError').textContent = err.message;
          } finally {
            $('thankYouBtn').disabled = false;
            $('thankYouBtn').textContent = 'Draft a thank-you email';
          }
        };
      }
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
      ${answered.map((q) => renderAnsweredQuestion(q, { canRetry: true })).join('')}
    `;

    $('closeSession').onclick = () => { currentSession = null; view.hidden = true; loadSessions(); };
    wireRetryButtons(s.id);

    if (current) {
      $('submitAnswer').onclick = async () => {
        const answer = $('answerDraft').value.trim();
        if (!answer) return;
        $('submitAnswer').disabled = true;
        $('submitAnswer').textContent = 'Scoring your answer…';
        $('answerError').hidden = true;
        try {
          await Api.submitAnswer(s.id, current.id, answer);
          await openSession(s.id);
        } catch (err) {
          $('answerError').hidden = false;
          $('answerError').textContent = err.message;
          $('submitAnswer').textContent = 'Submit answer';
          $('submitAnswer').disabled = false;
        }
      };
    } else {
      $('finishSession').onclick = async () => {
        $('finishSession').disabled = true;
        $('finishSession').textContent = 'Finishing…';
        await Api.completeSession(s.id);
        await openSession(s.id);
      };
    }
  }

  /* Recap is a cheap read of feedback already generated by scoreAnswer, not
     a new AI call — loaded async so the completed view paints instantly and
     this just fills in above the questions a moment later. */
  async function loadRecap(sessionId) {
    const box = $('recapBox');
    if (!box) return;
    try {
      const { recap } = await Api.getRecap(sessionId);
      if (!recap.wentWell.length && !recap.toImprove.length) return;
      box.innerHTML = `
        <div class="card recap">
          ${recap.wentWell.length ? `<p><strong>Went well:</strong> ${recap.wentWell.map(esc).join(' · ')}</p>` : ''}
          ${recap.toImprove.length ? `<p><strong>Work on:</strong> ${recap.toImprove.map(esc).join(' · ')}</p>` : ''}
        </div>
      `;
    } catch (err) {
      // Cosmetic — the per-question feedback below still tells the full story.
    }
  }

  /* Retrying is only meaningful (and only accepted by the backend) while the
     session is still in progress — a completed session's score is final.
     Reveals an inline textarea pre-filled with the last attempt, the same
     edit-in-place pattern My Stories already uses, rather than a native
     prompt() that would look out of place next to it. */
  function renderAnsweredQuestion(q, opts) {
    const canRetry = opts && opts.canRetry;
    return `
      <div class="qa" data-qid="${esc(q.id)}">
        <p class="q">${esc(q.category)} — ${esc(q.question)}</p>
        ${q.answer ? `<p class="a">${esc(q.answer)}</p>` : ''}
        ${q.score != null ? `<p class="feedback"><span class="badge">${q.score}%</span> ${esc(q.feedback || '')}</p>` : ''}
        ${canRetry ? `
        <button class="btn small ghost" data-action="retryToggle" data-qid="${esc(q.id)}">Try again</button>
        <div class="retryForm" id="retryForm-${esc(q.id)}" hidden>
          <textarea rows="4" id="retryText-${esc(q.id)}">${esc(q.answer || '')}</textarea>
          <button class="btn small" data-action="retrySubmit" data-qid="${esc(q.id)}">Rescore</button>
          <p class="error" id="retryError-${esc(q.id)}" hidden></p>
        </div>` : ''}
      </div>
    `;
  }

  function wireRetryButtons(sessionId) {
    document.querySelectorAll('button[data-action="retryToggle"]').forEach((btn) => {
      btn.onclick = () => {
        const form = $(`retryForm-${btn.dataset.qid}`);
        if (form) form.hidden = !form.hidden;
      };
    });
    document.querySelectorAll('button[data-action="retrySubmit"]').forEach((btn) => {
      btn.onclick = async () => {
        const qid = btn.dataset.qid;
        const textarea = $(`retryText-${qid}`);
        const errorEl = $(`retryError-${qid}`);
        const answer = textarea ? textarea.value.trim() : '';
        if (!answer) return;
        errorEl.hidden = true;
        btn.disabled = true;
        btn.textContent = 'Scoring…';
        try {
          await Api.retryAnswer(sessionId, qid, answer);
          await openSession(sessionId);
        } catch (err) {
          errorEl.hidden = false;
          errorEl.textContent = err.message;
          btn.disabled = false;
          btn.textContent = 'Rescore';
        }
      };
    });
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
        const originalLabel = btn.textContent;
        try {
          if (btn.dataset.action === 'practice') {
            if (!answer) throw new Error('Write an answer first.');
            btn.textContent = 'Scoring…';
            await Api.practiceStory(question, answer);
          } else if (btn.dataset.action === 'lock') {
            if (!answer) throw new Error('Write an answer first.');
            btn.textContent = 'Locking…';
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
          btn.textContent = originalLabel;
        }
      };
    });
  }
})();
