/* CareerOS Interview Prep — the mock interview room.
 *
 * An in-progress mock interview as a conversation: the interviewer asks each question out loud (the browser's
 * own speech voice), the candidate answers out loud (short clips sent to /interview/live/transcribe, the same
 * speech-to-text the Live Copilot uses) or by typing, and the whole exchange builds up as a transcript with
 * feedback on each answer. A suggested answer, written from the candidate's own resume and saved stories, is
 * one click away for practice.
 *
 * Audio: the microphone is only on while the candidate is answering. Clips are cut at pauses
 * (lib/segmenter.js), sent one at a time, and never stored; only the text comes back.
 */
(function (root) {
  'use strict';

  const { Segmenter } = root.CareerOSInterviewPrep;
  const PREFS_KEY = 'careeros.room.prefs';
  const TICK_MS = 100;

  function loadPrefs() {
    try { return Object.assign({ voice: true, autoListen: true }, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { return { voice: true, autoListen: true }; }
  }
  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) { /* private window */ }
  }

  function pickVoice() {
    if (!('speechSynthesis' in root)) return null;
    const voices = root.speechSynthesis.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
    if (!voices.length) return null;
    const good = /natural|google|samantha|daniel|aria|jenny|guy|serena|karen/i;
    return voices.find((v) => good.test(v.name)) || voices[0];
  }

  function fmtTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  /**
   * Mounts the room into `el`.
   * opts: { session, totalQuestions, api, esc, renderPlan, refresh(): Promise<session>, onClose(), onCompleted() }
   */
  function mount(el, opts) {
    const { api, esc } = opts;
    let session = opts.session;
    const total = opts.totalQuestions || 7;
    const prefs = loadPrefs();
    const suggestions = {};
    let destroyed = false;

    // mic state
    let stream = null, audioCtx = null, analyser = null, recorder = null, parts = [], ticker = null, seg = null;
    let mimeType = 'audio/webm';
    let queue = Promise.resolve();
    let inFlight = 0;
    let listening = false;
    let answerStartedAt = 0;
    let clock = null;
    let spokenFor = null; // question id last read aloud

    const canSpeak = 'speechSynthesis' in root;
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder);

    el.innerHTML = `
      <div class="room">
        <aside class="roomSide">
          <div class="interviewer" id="rmInterviewer" data-state="idle">
            <div class="avatar"><span>AI</span><i></i><i></i></div>
            <p class="ivName">Alex</p>
            <p class="ivRole">CareerOS interviewer</p>
            <p class="ivState" id="rmState">Getting ready…</p>
          </div>
          <div class="progress">
            <div class="progressTop"><span id="rmProgressLabel"></span><span id="rmClock" class="muted"></span></div>
            <div class="bar"><div id="rmBar"></div></div>
          </div>
          <div class="toggles">
            <label class="switch"><input type="checkbox" id="rmVoice"> <span>Interviewer speaks</span></label>
            <label class="switch"><input type="checkbox" id="rmAuto"> <span>Listen when they finish</span></label>
          </div>
          <div id="rmPlan"></div>
          <button class="btn ghost small" id="rmClose">Save and close</button>
        </aside>

        <section class="roomMain">
          <div class="transcript" id="rmTranscript" aria-live="polite"></div>
          <div class="composer" id="rmComposer"></div>
        </section>
      </div>`;

    const $ = (id) => el.querySelector(`#${id}`);
    $('rmVoice').checked = prefs.voice && canSpeak;
    $('rmVoice').disabled = !canSpeak;
    $('rmAuto').checked = prefs.autoListen && canRecord;
    $('rmAuto').disabled = !canRecord;
    $('rmVoice').onchange = (e) => { prefs.voice = e.target.checked; savePrefs(prefs); if (!prefs.voice && canSpeak) root.speechSynthesis.cancel(); setState(listening ? 'listening' : 'idle'); };
    $('rmAuto').onchange = (e) => { prefs.autoListen = e.target.checked; savePrefs(prefs); };
    $('rmClose').onclick = () => { destroy(); opts.onClose(); };

    const STATE_TEXT = { idle: 'Waiting for your answer', speaking: 'Asking a question…', listening: 'Listening to you…', thinking: 'Reviewing your answer…', done: 'Interview complete' };
    function setState(s) {
      $('rmInterviewer').dataset.state = s;
      $('rmState').textContent = STATE_TEXT[s] || '';
    }

    function current() { return session.questions.find((q) => q.answer == null) || null; }

    /* ---------------- transcript ---------------- */
    function feedbackHtml(q) {
      if (q.score == null) {
        return q.answer ? '<div class="fb pending">Your answer is saved; scoring didn’t finish. Use “Try again” to rescore it.</div>' : '';
      }
      const tone = q.score >= 75 ? 'good' : q.score >= 50 ? 'ok' : 'low';
      return `
        <div class="fb ${tone}">
          <div class="fbHead"><span class="score">${q.score}</span><span>${esc(q.feedback || '')}</span></div>
          ${q.strengths && q.strengths.length ? `<ul class="plus">${q.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
          ${q.improvements && q.improvements.length ? `<ul class="next">${q.improvements.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
          <button class="linkish" data-retry="${esc(q.id)}">Try this one again</button>
          <div class="retry" id="retry-${esc(q.id)}" hidden>
            <textarea rows="4">${esc(q.answer || '')}</textarea>
            <button class="btn small" data-rescore="${esc(q.id)}">Rescore</button>
            <p class="error" hidden></p>
          </div>
        </div>`;
    }

    function renderTranscript() {
      const qs = [...session.questions].sort((a, b) => a.order - b.order);
      const cur = current();
      $('rmTranscript').innerHTML = qs.map((q) => `
        <div class="msg them">
          <div class="who">Alex · ${esc(q.category)}</div>
          <div class="bubble">${esc(q.question)}${q === cur ? ` <button class="replay" data-replay="${esc(q.id)}" title="Hear it again">▶ Replay</button>` : ''}</div>
        </div>
        ${q.answer != null ? `
        <div class="msg me">
          <div class="who">You</div>
          <div class="bubble">${esc(q.answer)}</div>
        </div>
        ${feedbackHtml(q)}` : ''}
      `).join('') + (cur ? '' : '<div class="msg sys">That’s all ${total} questions. Finish the interview to see your overall score and recap.</div>'.replace('${total}', String(total)));

      el.querySelectorAll('[data-replay]').forEach((b) => { b.onclick = () => { const q = current(); if (q) speakQuestion(q, true); }; });
      el.querySelectorAll('[data-retry]').forEach((b) => { b.onclick = () => { const box = $(`retry-${b.dataset.retry}`); if (box) box.hidden = !box.hidden; }; });
      el.querySelectorAll('[data-rescore]').forEach((b) => {
        b.onclick = async () => {
          const box = $(`retry-${b.dataset.rescore}`);
          const text = box.querySelector('textarea').value.trim();
          const err = box.querySelector('.error');
          if (!text) return;
          b.disabled = true; b.textContent = 'Scoring…'; err.hidden = true;
          try {
            await api.retryAnswer(session.id, b.dataset.rescore, text);
            session = await opts.refresh();
            renderAll();
          } catch (e) {
            err.hidden = false; err.textContent = e.message; b.disabled = false; b.textContent = 'Rescore';
          }
        };
      });
      const t = $('rmTranscript');
      t.scrollTop = t.scrollHeight;
    }

    /* ---------------- composer ---------------- */
    function renderComposer() {
      const cur = current();
      if (!cur) {
        $('rmComposer').innerHTML = `
          <div class="composerDone">
            <button class="btn" id="rmFinish">Finish interview and see my score</button>
            <p class="error" id="rmFinishErr" hidden></p>
          </div>`;
        $('rmFinish').onclick = async () => {
          $('rmFinish').disabled = true; $('rmFinish').textContent = 'Finishing…';
          try {
            await api.completeSession(session.id);
            destroy();
            opts.onCompleted();
          } catch (e) {
            $('rmFinishErr').hidden = false; $('rmFinishErr').textContent = e.message;
            $('rmFinish').disabled = false; $('rmFinish').textContent = 'Finish interview and see my score';
          }
        };
        setState('done');
        return;
      }
      $('rmComposer').innerHTML = `
        <div class="composerTop">
          <button class="mic" id="rmMic" ${canRecord ? '' : 'disabled'} aria-pressed="false">
            <span class="micIcon">🎙</span><span id="rmMicLabel">${canRecord ? 'Answer out loud' : 'Microphone not available'}</span>
          </button>
          <div class="meter" aria-hidden="true">${'<b></b>'.repeat(12)}</div>
          <span class="muted" id="rmHeard"></span>
          <button class="btn ghost small" id="rmSuggest">Suggest an answer</button>
        </div>
        <div id="rmSuggestion"></div>
        <textarea id="rmDraft" rows="4" placeholder="Speak, or type your answer here. Your words appear as you talk, and you can edit them before sending."></textarea>
        <div class="composerBottom">
          <p class="error" id="rmErr" hidden></p>
          <button class="btn" id="rmSend">Send answer</button>
        </div>`;
      $('rmMic').onclick = () => (listening ? stopListening(true) : startListening());
      $('rmSend').onclick = () => submit();
      $('rmSuggest').onclick = () => showSuggestion(cur);
      $('rmDraft').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(); });
      if (suggestions[cur.id]) paintSuggestion(suggestions[cur.id]);
    }

    function paintSuggestion(s) {
      $('rmSuggestion').innerHTML = `
        <div class="suggest">
          <div class="suggestHead"><strong>Suggested answer</strong>${s.basedOn ? `<span class="muted"> · from ${esc(s.basedOn)}</span>` : ''}<button class="linkish" id="rmHideSug">Hide</button></div>
          <ol>${s.outline.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>
          <p class="sample">${esc(s.sample)}</p>
          <div class="row">
            ${canSpeak ? '<button class="btn ghost small" id="rmHearSug">Read it to me</button>' : ''}
            <button class="btn ghost small" id="rmUseSug">Use as my draft</button>
          </div>
          <p class="muted">Practise saying it in your own words. You’re scored on what you actually say.</p>
        </div>`;
      $('rmHideSug').onclick = () => { $('rmSuggestion').innerHTML = ''; };
      if ($('rmHearSug')) $('rmHearSug').onclick = () => speak(s.sample);
      $('rmUseSug').onclick = () => { $('rmDraft').value = s.sample; $('rmDraft').focus(); };
    }

    async function showSuggestion(q) {
      if (suggestions[q.id]) return paintSuggestion(suggestions[q.id]);
      const btn = $('rmSuggest');
      btn.disabled = true; btn.textContent = 'Writing a suggestion…';
      try {
        const { suggestion } = await api.suggestAnswer(session.id, q.id);
        suggestions[q.id] = suggestion;
        if (current() && current().id === q.id) paintSuggestion(suggestion);
      } catch (e) {
        $('rmSuggestion').innerHTML = `<p class="error">${esc(e.message)}</p>`;
      } finally {
        if ($('rmSuggest')) { $('rmSuggest').disabled = false; $('rmSuggest').textContent = 'Suggest an answer'; }
      }
    }

    function renderProgress() {
      const answered = session.questions.filter((q) => q.answer != null).length;
      const cur = current();
      $('rmProgressLabel').textContent = cur ? `Question ${cur.order + 1} of ${total}` : `${answered} of ${total} answered`;
      $('rmBar').style.width = `${Math.round((answered / total) * 100)}%`;
      if (opts.renderPlan) $('rmPlan').innerHTML = opts.renderPlan(session.plan);
    }

    function renderAll() {
      renderProgress();
      renderTranscript();
      renderComposer();
    }

    /* ---------------- interviewer voice ---------------- */
    function speak(text) {
      return new Promise((resolve) => {
        if (!canSpeak || !prefs.voice || destroyed) return resolve();
        root.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice();
        if (v) u.voice = v;
        u.rate = 1;
        let done = false;
        const finish = () => { if (done) return; done = true; clearTimeout(safety); resolve(); };
        const safety = setTimeout(finish, Math.max(6000, text.length * 90)); // never wait forever on a lost "end" event
        u.onend = finish;
        u.onerror = finish;
        root.speechSynthesis.speak(u);
      });
    }

    async function speakQuestion(q, replay) {
      if (listening) await stopListening(false);
      spokenFor = q.id;
      if (prefs.voice && canSpeak) {
        setState('speaking');
        await speak(q.question);
      }
      if (destroyed || !current() || current().id !== q.id) return;
      setState('idle');
      if (!replay && prefs.autoListen && canRecord) startListening();
    }

    /* ---------------- microphone ---------------- */
    function level() {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      return Math.sqrt(sum / data.length);
    }

    function newClip() {
      if (!stream || !listening) return;
      const mine = [];
      parts = mine;
      const r = new MediaRecorder(stream, { mimeType });
      r.ondataavailable = (e) => { if (e.data && e.data.size > 0) mine.push(e.data); };
      r.start();
      recorder = r;
    }

    function endClip(keep, restart) {
      const r = recorder;
      const mine = parts;
      recorder = null;
      if (r && r.state !== 'inactive') {
        r.onstop = () => { if (keep && mine.length) enqueue(new Blob(mine, { type: mimeType })); };
        try { r.stop(); } catch (e) { /* already stopped */ }
      }
      if (restart) newClip();
    }

    function enqueue(blob) {
      inFlight++;
      paintHeard();
      queue = queue.then(async () => {
        try {
          const { transcript } = await api.transcribeChunk('', blob, blob.type);
          const text = (transcript || '').trim();
          const box = $('rmDraft');
          if (text && box) box.value = (box.value.trim() ? `${box.value.trim()} ` : '') + text;
        } catch (e) {
          const m = String(e.message || e);
          showErr(/isn't set up|not configured/i.test(m) ? 'Voice answers aren’t switched on for CareerOS yet. Type your answer instead.' : `Couldn’t turn that into text: ${m}`);
        } finally {
          inFlight--;
          paintHeard();
        }
      });
    }

    function paintHeard() {
      const h = $('rmHeard');
      if (h) h.textContent = inFlight > 0 ? 'Writing down what you said…' : listening ? 'Speak naturally; pause when you’re done with a thought.' : '';
    }

    function showErr(m) {
      const e = $('rmErr');
      if (!e) return;
      e.hidden = !m;
      e.textContent = m || '';
    }

    async function startListening() {
      if (listening || destroyed || !current()) return;
      if (canSpeak) root.speechSynthesis.cancel();
      showErr('');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (e) {
        showErr('Chrome blocked the microphone. Allow it from the icon in the address bar, or type your answer.');
        return;
      }
      if (destroyed) { stream.getTracks().forEach((t) => t.stop()); return; }
      mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      seg = Segmenter({ silenceMs: 1100, maxMs: 15000 });
      listening = true;
      answerStartedAt = answerStartedAt || Date.now();
      newClip();
      setState('listening');
      const mic = $('rmMic');
      if (mic) { mic.classList.add('on'); mic.setAttribute('aria-pressed', 'true'); $('rmMicLabel').textContent = 'Stop listening'; }
      paintHeard();
      const bars = el.querySelectorAll('.meter b');
      ticker = setInterval(() => {
        const lv = level();
        bars.forEach((b, i) => { b.style.height = `${Math.max(3, Math.min(22, lv * 260 * (0.6 + ((i * 7) % 5) / 6)))}px`; });
        const act = seg.feed(lv, performance.now());
        if (act === 'cut') endClip(true, true);
        else if (act === 'discard') endClip(false, true);
      }, TICK_MS);
    }

    /** Stops the mic; `keep` sends what was said since the last pause. Resolves once every clip is written down. */
    async function stopListening(keep) {
      if (!listening) return queue;
      listening = false;
      if (ticker) clearInterval(ticker);
      ticker = null;
      // Only send the last bit if it holds speech; a trailing pause is just silence (and speech-to-text can
      // "hear" words in silence).
      endClip(keep && seg && seg.speechMs >= 300, false);
      await new Promise((r) => setTimeout(r, 60)); // let the last clip's stop event queue it
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (audioCtx) { try { audioCtx.close(); } catch (e) { /* ignore */ } }
      audioCtx = null; analyser = null;
      el.querySelectorAll('.meter b').forEach((b) => { b.style.height = '3px'; });
      const mic = $('rmMic');
      if (mic) { mic.classList.remove('on'); mic.setAttribute('aria-pressed', 'false'); $('rmMicLabel').textContent = 'Answer out loud'; }
      if (!destroyed && current()) setState('idle');
      paintHeard();
      return queue;
    }

    /* ---------------- answering ---------------- */
    async function submit() {
      const cur = current();
      if (!cur) return;
      const send = $('rmSend');
      send.disabled = true;
      send.textContent = 'Sending…';
      await stopListening(true);
      const answer = ($('rmDraft').value || '').trim();
      if (!answer) {
        showErr('Say or type an answer first.');
        send.disabled = false; send.textContent = 'Send answer';
        return;
      }
      setState('thinking');
      send.textContent = 'Reviewing your answer…';
      try {
        await api.submitAnswer(session.id, cur.id, answer);
        session = await opts.refresh();
        answerStartedAt = 0;
        renderAll();
        const next = current();
        if (next) speakQuestion(next, false);
      } catch (e) {
        setState('idle');
        showErr(e.message);
        send.disabled = false; send.textContent = 'Send answer';
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (canSpeak) root.speechSynthesis.cancel();
      stopListening(false);
      if (clock) clearInterval(clock);
    }

    clock = setInterval(() => {
      const c = $('rmClock');
      if (c) c.textContent = answerStartedAt && current() ? `answering ${fmtTime(Date.now() - answerStartedAt)}` : '';
    }, 500);

    if (canSpeak) root.speechSynthesis.getVoices(); // some browsers load the voice list on first ask
    renderAll();
    const first = current();
    if (first && spokenFor !== first.id) setTimeout(() => { if (!destroyed) speakQuestion(first, false); }, 400);
    else if (!first) setState('done');

    return { destroy };
  }

  root.CareerOSInterviewPrep = root.CareerOSInterviewPrep || {};
  root.CareerOSInterviewPrep.Room = { mount };
})(typeof self !== 'undefined' ? self : this);
