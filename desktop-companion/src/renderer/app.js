/* CareerOS Interview Companion — window logic.
 *
 * Captures the call audio (or the microphone), cuts it into clips at the speaker's pauses with the same
 * segmenter as the Interview Prep extension (lib/segmenter.js), and for each clip asks CareerOS for the
 * transcript and, when a question was asked, talking points from the person's own resume. Audio never leaves
 * this window except as those short clips; nothing is written to disk unless the person saves their notes.
 */
(async function () {
  'use strict';

  const C = window.companion;
  const $ = (id) => document.getElementById(id);
  const CONSENT_VERSION = 1;
  const CONSENT_TEXT = [
    'Interview Companion listens to your call audio (or your microphone) while you have it on, and when someone asks you a question it shows a few talking points from your own CareerOS resume and stories. Never a script to read out.',
    'By default, this window is visible like any other app: it can show in screen shares and recordings. Optional screen-share privacy may suppress its image in supported capture software, but it is not guaranteed and does not change consent or disclosure requirements.',
    'Some places require you to tell everyone on a call that it is being transcribed or AI-assisted. That is your responsibility.',
    'Some employers do not allow AI assistance in interviews and treat it as grounds for disqualification. Only use it where you are sure it is allowed.',
    'Audio is never stored. Short clips of speech are sent to CareerOS to be turned into text, used once to find talking points, and discarded.',
  ];
  const TICK_MS = 100;
  const RECENT = 5;

  let st = await C.state();

  function show(view) {
    for (const v of ['signin', 'consent', 'home', 'live']) $(v).hidden = v !== view;
  }
  function setState(text, kind) {
    $('state').textContent = text || '';
    $('state').className = `state ${kind || ''}`;
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- sign in ---------------- */
  C.onConnectCode((code) => {
    $('signinCode').hidden = false;
    $('signinCode').textContent = code;
    $('signinMsg').textContent = 'Approve in the browser window that just opened, only if it shows this same code.';
  });
  $('signinBtn').onclick = async () => {
    $('signinBtn').disabled = true;
    $('signinBtn').textContent = 'Waiting for approval…';
    $('signinMsg').textContent = 'Opening your browser…';
    const res = await C.connect();
    $('signinBtn').disabled = false;
    $('signinBtn').textContent = 'Sign in';
    $('signinCode').hidden = true;
    if (res && res.ok) {
      st = await C.state();
      route();
    } else {
      $('signinMsg').textContent = (res && res.error) || 'Couldn’t sign in.';
    }
  };

  /* ---------------- consent ---------------- */
  $('consentText').innerHTML = CONSENT_TEXT.map((t) => `<li>${esc(t)}</li>`).join('');
  $('consentCheck').onchange = (e) => { $('consentBtn').disabled = !e.target.checked; };
  $('consentBtn').onclick = async () => {
    await C.saveSettings({ consentedVersion: CONSENT_VERSION, consentedAt: Date.now() });
    st = await C.state();
    route();
  };

  /* ---------------- home ---------------- */
  async function loadHome() {
    $('pairedAs').textContent = st.pairedAs ? `Signed in as ${st.pairedAs}` : 'Signed in';
    $('onTop').checked = st.alwaysOnTop;
    $('capturePrivacy').checked = st.capturePrivacy === true;
    $('networkPaused').checked = st.networkPaused === true;
    renderPrivacyStatus();
    $('source').value = st.source === 'mic' ? 'mic' : 'system';
    sourceNote();
    const res = await C.targets();
    const sel = $('target');
    sel.innerHTML = '<option value="">Use my resume (any interview)</option>';
    if (res.ok && res.jobSpecific && res.targets && res.targets.length) {
      sel.innerHTML += res.targets
        .map((t) => `<option value="${esc(t.applicationId)}">${esc(t.jobTitle)} @ ${esc(t.companyName)}${/INTERVIEW/.test(t.status) ? ' · interviewing' : ''}</option>`)
        .join('');
      if (st.lastApplicationId && res.targets.some((t) => t.applicationId === st.lastApplicationId)) sel.value = st.lastApplicationId;
    } else if (res.ok && !res.jobSpecific) {
      $('targetNote').hidden = false;
    } else if (!res.ok) {
      showError('homeError', res.error);
      if (/sign in/i.test(res.error)) { st = await C.state(); route(); }
    }
  }
  function sourceNote() {
    const sys = $('source').value === 'system';
    $('sourceNote').textContent = sys
      ? (st.platform === 'darwin' ? 'macOS asks for Screen Recording permission the first time: it is how a Mac shares call audio. Only the audio is used.' : 'Hears the other people on your call, from any call app.')
      : 'Hears whatever your microphone picks up. Use this if call audio isn’t available, with your speakers on.';
  }
  $('source').onchange = () => { C.saveSettings({ source: $('source').value }); sourceNote(); };
  $('target').onchange = () => C.saveSettings({ lastApplicationId: $('target').value });
  $('onTop').onchange = (e) => C.saveSettings({ alwaysOnTop: e.target.checked });
  function renderPrivacyStatus() {
    $('privacyStatus').textContent = `${st.capturePrivacy ? 'Screen-share privacy requested' : 'Screen-share privacy off'} · ${st.networkPaused ? 'AI/network paused' : 'Network active'}`;
    $('startBtn').disabled = st.networkPaused === true;
    $('startBtn').title = st.networkPaused ? 'Resume AI/network activity to start listening.' : '';
  }
  async function setPrivacy(patch, checkbox, key) {
    checkbox.disabled = true;
    try {
      const result = await C.saveSettings(patch);
      if (result && result.ok) {
        st[key] = result[key] === true;
        checkbox.checked = st[key];
        renderPrivacyStatus();
      } else {
        checkbox.checked = st[key] === true;
        showError('homeError', result?.error || 'Could not update privacy setting.');
      }
    } catch (error) {
      checkbox.checked = st[key] === true;
      showError('homeError', error.message || 'Could not update privacy setting.');
    } finally { checkbox.disabled = false; }
  }
  $('capturePrivacy').onchange = (e) => setPrivacy({ capturePrivacy: e.target.checked }, e.target, 'capturePrivacy');
  $('networkPaused').onchange = (e) => setPrivacy({ networkPaused: e.target.checked }, e.target, 'networkPaused');
  $('quickHideBtn').onclick = () => C.quickHide();
  $('practiceLink').onclick = () => C.openWeb('interview');
  $('signOut').onclick = async () => { await C.signOut(); st = await C.state(); route(); };

  function showError(id, msg) {
    $(id).hidden = !msg;
    $(id).textContent = msg || '';
  }

  /* ---------------- audio pipeline ---------------- */
  let stream = null;
  let ctx = null;
  let analyser = null;
  let recorder = null;
  let ticker = null;
  let segmenter = null;
  let mimeType = 'audio/webm';
  let queue = Promise.resolve();
  let pending = 0;
  let recent = [];
  let lastQuestion = '';
  let running = false;
  let fatal = false;
  let applicationId = '';
  let sessionStartedAt = 0;
  let clockTimer = null;
  let asking = false;
  let screenBusy = false;
  let transcriptCount = 0;
  const chatHistory = [];
  const notes = [];
  const savedAnswers = [];
  let notesBusy = false;
  let savedSessions = [];
  async function refreshHistory() {
    const result = await C.sessionHistoryList();
    if (!result.ok) { $('historyList').textContent = result.error || 'History unavailable.'; return; }
    savedSessions = result.sessions || [];
    renderHistory();
  }
  function renderHistory() {
    const term = $('historySearch').value.trim().toLowerCase();
    const items = savedSessions.filter(item => !term || [item.title, item.skill,
      ...(item.transcript || []), ...(item.answers || []).flatMap(answer => [answer.question, answer.answer])]
      .some(value => String(value || '').toLowerCase().includes(term)));
    $('historyList').replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'muted small';
      empty.textContent = term ? 'No saved sessions matched.' : 'No sessions saved yet.';
      $('historyList').append(empty);
      return;
    }
    for (const item of items.slice(0, 50)) {
      const wrapper = document.createElement('div');
      wrapper.className = 'history-item';
      const content = document.createElement('div');
      content.className = 'history-content';
      const heading = document.createElement('strong');
      heading.textContent = item.title;
      const meta = document.createElement('p');
      meta.className = 'muted small';
      meta.textContent = `${new Date(item.savedAt).toLocaleString()} · ${(item.transcript || []).length} segments · ${(item.answers || []).length} answers`;
      const open = document.createElement('button');
      open.className = 'link';
      open.textContent = 'View';
      open.addEventListener('click', () => {
        const text = [...(item.transcript || []).map((t, i) => `${i + 1}. ${t}`),
          ...(item.answers || []).map(a => `Question: ${a.question}\nAnswer: ${a.answer}`)].join('\n\n');
        $('historyPreview').textContent = text || 'No content.';
        $('historyPreview').hidden = false;
      });
      const del = document.createElement('button');
      del.className = 'link';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', `Delete ${item.title}`);
      del.addEventListener('click', async () => {
        if (!confirm(`Delete saved session "${item.title}" from this computer?`)) return;
        const response = await C.sessionHistoryDelete(item.id);
        if (response.ok) await refreshHistory();
      });
      content.append(heading, meta, open);
      wrapper.append(content, del);
      $('historyList').append(wrapper);
    }
  }
  function sessionTranscript() {
    return Array.from($('transcriptList').children)
      .map(li => li.querySelector('span')?.textContent || '').filter(Boolean);
  }
  async function generateMeetingNotes() {
    if (notesBusy) return;
    const transcript = sessionTranscript();
    if (!transcript.length && !savedAnswers.length) {
      showError('liveError', 'No conversation has been transcribed or answered yet.');
      return;
    }
    notesBusy = true;
    $('generateNotesBtn').disabled = true;
    showError('liveError', '');
    try {
      const result = await C.generateSessionNotes({
        mode: $('target').value ? 'interview' : 'meeting',
        transcript: transcript.slice(-300),
        questions: savedAnswers.slice(-30),
      });
      if (!result.ok) {
        showError('liveError', result.error || 'Notes generation failed.');
        return;
      }
      $('editableNotes').value = result.note || '';
      $('exportNotesBtn').disabled = !$('editableNotes').value.trim();
      $('notesPanel').open = true;
    } catch (error) {
      showError('liveError', error.message || 'Notes generation failed.');
    } finally {
      notesBusy = false;
      $('generateNotesBtn').disabled = false;
    }
  }
  $('generateNotesBtn').addEventListener('click', generateMeetingNotes);
  $('editableNotes').addEventListener('input', () => {
    $('exportNotesBtn').disabled = !$('editableNotes').value.trim();
  });
  $('exportNotesBtn').addEventListener('click', async () => {
    if (!$('editableNotes').value.trim()) return;
    const result = await C.saveNotes($('editableNotes').value);
    if (result?.ok) setState('Summary exported', '');
    else if (result?.error) showError('liveError', result.error);
  });
  $('historySearch').addEventListener('input', renderHistory);
  $('saveSessionBtn').addEventListener('click', async () => {
    if (!running && !transcriptCount && !savedAnswers.length) return;
    const transcript = Array.from($('transcriptList').children).map(li => li.querySelector('span')?.textContent || '').filter(Boolean);
    const result = await C.sessionHistorySave({
      title: $('target').selectedOptions[0]?.textContent || 'CareerOS session',
      skill: $('skillPreset').value,
      transcript,
      answers: savedAnswers.slice(-60),
    });
    $('sessionSaveState').textContent = result.ok ? 'Saved on this computer' : (result.error || 'Could not save');
  });
  const skillPrompts = {
    general: '',
    behavioral: 'Give me concise STAR-method talking points for: ',
    programming: 'Explain a correct programming approach and key trade-offs for: ',
    dsa: 'Explain the algorithm, time and space complexity, and edge cases for: ',
    'system-design': 'Describe requirements, architecture, scaling and trade-offs for: ',
    data: 'Explain the data science approach, validation and metrics for: ',
    sales: 'Give me a practical sales or negotiation framework for: ',
    devops: 'Explain infrastructure, deployment, reliability and security for: ',
  };
  function clearSession() {
    recent = [];
    lastQuestion = '';
    notes.length = 0;
    savedAnswers.length = 0;
    chatHistory.length = 0;
    transcriptCount = 0;
    $('transcriptList').replaceChildren();
    $('transcriptCount').textContent = '0';
    $('transcriptPanel').open = false;
    $('current').replaceChildren();
    const placeholder = document.createElement('p');
    placeholder.className = 'muted';
    placeholder.textContent = 'Session cleared. Listening for the next question.';
    $('current').append(placeholder);
    delete $('current').dataset.q;
    $('earlierList').replaceChildren();
    $('earlier').hidden = true;
    $('heard').hidden = true;
    $('notesBtn').disabled = true;
    $('askInput').value = '';
    $('editableNotes').value = '';
    $('exportNotesBtn').disabled = true;
    $('copilotAnswer').hidden = true;
    $('copilotAnswer').textContent = '';
  }
  $('clearSessionBtn').addEventListener('click', clearSession);
  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || !running) return;
    if (event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('askInput').focus();
    } else if (event.key.toLowerCase() === 'l') {
      event.preventDefault();
      $('transcriptPanel').open = !$('transcriptPanel').open;
    } else if (event.key.toLowerCase() === 'j') {
      event.preventDefault();
      $('screenBtn').click();
    }
  });
  function displayAnswer(text) {
    $('copilotAnswer').hidden = false;
    $('copilotAnswer').textContent = text;
    $('copilotAnswer').scrollIntoView({ block: 'nearest' });
  }
  $('screenBtn').addEventListener('click', async () => {
    if (!running || screenBusy) return;
    const question = $('askInput').value.trim() || 'Explain the selected screenshot and provide practical guidance.';
    screenBusy = true;
    $('screenBtn').disabled = true;
    setState('Analyzing…', 'busy');
    try {
      const result = await C.analyzeScreen(question);
      if (result.ok && result.answer) displayAnswer(result.answer);
      else if (!result.cancelled) showError('liveError', result.error || 'Screenshot analysis failed.');
    } catch (error) {
      showError('liveError', error.message || 'Screenshot analysis failed.');
    } finally {
      screenBusy = false;
      $('screenBtn').disabled = false;
      setState(running ? 'Listening' : '', running ? 'on' : '');
    }
  });
  $('voiceToggleBtn').addEventListener('click', () => {
    if (!running || !stream) return;
    const active = stream.getAudioTracks().some((track) => track.enabled);
    stream.getAudioTracks().forEach((track) => { track.enabled = !active; });
    $('voiceToggleBtn').textContent = active ? 'Resume microphone/call audio' : 'Pause microphone/call audio';
    setState(active ? 'Audio paused' : 'Listening', active ? '' : 'on');
  });
  function updateClock() {
    const seconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
    $('sessionClock').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function appendTranscript(message) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const content = document.createElement('span');
    content.textContent = message;
    li.append(time, content);
    $('transcriptList').append(li);
    transcriptCount++;
    $('transcriptCount').textContent = String(transcriptCount);
    li.scrollIntoView({ block: 'nearest' });
  }

  async function getStream(source) {
    if (st.testAudio) {
      // Automated tests: a tone the test switches on and off stands in for a speaker.
      const tctx = new AudioContext();
      const osc = tctx.createOscillator();
      const gain = tctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      osc.start();
      window.__speak = (on) => gain.gain.setValueAtTime(on ? 0.6 : 0, tctx.currentTime);
      const dest = tctx.createMediaStreamDestination();
      gain.connect(dest);
      return dest.stream;
    }
    if (source === 'mic') {
      if ((await C.micPermission()) !== 'granted') throw new Error('Microphone access is off. Allow it in your system settings, then try again.');
      return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true }, video: false });
    }
    const s = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    s.getVideoTracks().forEach((t) => t.stop());
    if (!s.getAudioTracks().length) {
      s.getTracks().forEach((t) => t.stop());
      throw new Error(st.platform === 'darwin'
        ? 'This Mac didn’t share call audio. Allow Screen Recording for CareerOS Interview Companion in System Settings → Privacy & Security, or choose Microphone.'
        : 'This computer didn’t share call audio. Choose Microphone instead.');
    }
    return new MediaStream(s.getAudioTracks());
  }

  function level() {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / data.length);
  }

  function newClip() {
    if (!stream || !running) return;
    const mine = [];
    const r = new MediaRecorder(stream, { mimeType });
    r.ondataavailable = (e) => { if (e.data && e.data.size > 0) mine.push(e.data); };
    r.__parts = mine;
    r.start();
    recorder = r;
  }

  function endClip(keep) {
    const r = recorder;
    if (r && r.state !== 'inactive') {
      r.onstop = () => { if (keep && r.__parts.length) enqueue(new Blob(r.__parts, { type: mimeType })); };
      try { r.stop(); } catch { /* already stopped */ }
    }
    newClip();
  }

  function enqueue(blob) {
    if (fatal) return;
    pending++;
    queue = queue.then(async () => {
      pending--;
      if (!running || pending > 2) return; // help for an old question is no help
      await handleClip(blob);
    });
  }

  function isFatal(msg) {
    return /isn't set up|not set up|sign in|Premium|upgrade|plan/i.test(msg || '');
  }

  async function handleClip(blob) {
    setState('Hearing…', 'busy');
    const t = await C.transcribe(await blob.arrayBuffer(), blob.type);
    if (!t.ok) return onError(t.error);
    const transcript = (t.transcript || '').trim();
    setState('Listening', 'on');
    if (!transcript) return;
    appendTranscript(transcript);
    // Only act on an explicit wake phrase when this session's opt-in is on.
    // The phrase is transcribed using the existing audio source; no extra capture occurs.
    const voiceCommand = /^careeros[,:]?\s+(?:answer|explain|help(?:\s+me)?(?:\s+with)?)[,:]?\s+(.{3,})$/i.exec(transcript);
    if (voiceCommand && $('voiceCommandsEnabled').checked) {
      const response = await C.askCopilot({
        skill: $('skillPreset').value,
        question: voiceCommand[1].trim(),
        recent: recent.slice(-RECENT),
      });
      if (response.ok && response.answer) displayAnswer(response.answer);
      else showError('liveError', response.error || 'Voice question could not be answered.');
      return;
    }
    $('heard').hidden = false;
    $('heard').textContent = `Heard: “${transcript}”`;
    setState('Thinking…', 'busy');
    const a = await C.assist({ applicationId: applicationId || null, transcript, recent: recent.slice(-RECENT), lastQuestion: lastQuestion || undefined });
    setState(running ? 'Listening' : '', running ? 'on' : '');
    if (!a.ok) return onError(a.error);
    recent.push(transcript);
    if (recent.length > RECENT) recent = recent.slice(-RECENT);
    if (a.assist && a.assist.isQuestion) {
      lastQuestion = a.assist.question;
      recent = [];
      showAssist(a.assist);
    }
  }

  function onError(msg) {
    setState(running ? 'Listening' : '', running ? 'on' : '');
    showError('liveError', msg);
    if (isFatal(msg)) {
      fatal = true;
      stop(msg);
    }
  }

  function showAssist(a) {
    const cur = $('current');
    if (cur.dataset.q) {
      $('earlier').hidden = false;
      $('earlierList').insertAdjacentHTML('afterbegin', `<li>${esc(cur.dataset.q)}</li>`);
    }
    cur.dataset.q = a.question;
    cur.innerHTML = `
      ${a.kind ? `<span class="kind">${esc(a.kind)}</span>` : ''}
      <p class="q">${esc(a.question)}</p>
      ${a.points && a.points.length ? `<ul class="points">${a.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${a.story ? `<p class="story">Your story: ${esc(a.story)}</p>` : ''}`;
    cur.classList.remove('fresh'); void cur.offsetWidth; cur.classList.add('fresh');
    showError('liveError', '');
    notes.push({ at: new Date(), question: a.question, kind: a.kind, points: a.points || [], story: a.story || '' });
    $('notesBtn').disabled = false;
  }

  $('askForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = $('askInput').value.trim();
    const skill = $('skillPreset').value;
    const requested = (skillPrompts[skill] || '') + question;
    if (!running || asking || !question) return;
    asking = true;
    $('askBtn').disabled = true;
    showError('liveError', '');
    setState('Thinking…', 'busy');
    try {
      const conversation = [
        ...recent,
        ...Array.from($('transcriptList').children).slice(-4).map((item) => item.querySelector('span')?.textContent || ''),
        ...chatHistory.slice(-4),
      ].slice(-8);
      const response = await C.askCopilot({ skill, question: requested, recent: conversation });
      if (!response.ok) return onError(response.error);
      if (!response.answer) {
        showError('liveError', 'No answer was generated.');
      } else {
        displayAnswer(response.answer);
        savedAnswers.push({ question, answer: response.answer });
        chatHistory.push('User: ' + question, 'Assistant: ' + response.answer.slice(0, 900));
        if (chatHistory.length > 8) chatHistory.splice(0, chatHistory.length - 8);
        $('askInput').value = '';
      }
    } catch (error) {
      showError('liveError', error.message || 'Could not ask CareerOS.');
    } finally {
      asking = false;
      $('askBtn').disabled = false;
      setState(running ? 'Listening' : '', running ? 'on' : '');
    }
  });

  async function start() {
    if (st.networkPaused) {
      showError('homeError', 'AI/network activity is paused. Resume it in Privacy settings before starting.');
      return;
    }
    showError('homeError', '');
    showError('liveError', '');
    applicationId = $('target').value;
    try {
      stream = await getStream($('source').value);
    } catch (err) {
      return showError('homeError', err.message || 'Couldn’t start listening.');
    }
    running = true;
    sessionStartedAt = Date.now();
    updateClock();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 1000);
    $('askBtn').disabled = false;
    $('voiceToggleBtn').textContent = 'Pause microphone/call audio';
    $('screenBtn').disabled = false;
    fatal = false;
    recent = [];
    lastQuestion = '';
    chatHistory.length = 0;
    savedAnswers.length = 0;
    $('sessionSaveState').textContent = 'Only saved when you choose';
    $('editableNotes').value = '';
    $('exportNotesBtn').disabled = true;
    ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    segmenter = window.CareerOSInterviewPrep.Segmenter();
    newClip();
    let n = 0;
    ticker = setInterval(() => {
      const l = level();
      if (++n % 2 === 0) $('meterFill').style.width = `${Math.min(100, Math.round(l * 260))}%`;
      const action = segmenter.feed(l, performance.now());
      if (action === 'cut') endClip(true);
      else if (action === 'discard') endClip(false);
    }, TICK_MS);
    stream.getAudioTracks().forEach((t) => t.addEventListener('ended', () => stop('The audio source stopped.')));
    show('live');
    setState('Listening', 'on');
  }

  function stop(reason) {
    const shouldGenerateNotes = running && !reason && $('autoNotes').checked;
    running = false;
    if (shouldGenerateNotes) void generateMeetingNotes();
    if (ticker) clearInterval(ticker);
    ticker = null;
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
    $('askBtn').disabled = true;
    $('screenBtn').disabled = true;
    if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; try { recorder.stop(); } catch { /* ignore */ } }
    recorder = null;
    if (ctx) { try { ctx.close(); } catch { /* ignore */ } }
    ctx = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    $('meterFill').style.width = '0%';
    setState(reason ? 'Stopped' : '', '');
    if (reason) showError('liveError', reason);
    $('stopBtn').textContent = 'Back';
  }

  $('startBtn').onclick = start;
  $('stopBtn').onclick = () => {
    if (running) { stop(); return; }
    $('stopBtn').textContent = 'Stop';
    $('current').innerHTML = '<p class="muted">Listening for the interviewer\'s next question. Talking points from your resume will show here.</p>';
    delete $('current').dataset.q;
    $('earlierList').innerHTML = '';
    $('earlier').hidden = true;
    $('heard').hidden = true;
    showError('liveError', '');
    notes.length = 0;
    chatHistory.length = 0;
    savedAnswers.length = 0;
    $('transcriptList').replaceChildren();
    transcriptCount = 0;
    $('transcriptCount').textContent = '0';
    $('transcriptPanel').open = false;
    $('askInput').value = '';
    $('editableNotes').value = '';
    $('exportNotesBtn').disabled = true;
    $('autoNotes').checked = false;
    $('voiceCommandsEnabled').checked = false;
    $('copilotAnswer').hidden = true;
    $('copilotAnswer').textContent = '';
    $('notesBtn').disabled = true;
    route();
  };

  /* Notes: the questions asked and the points shown, saved where the person chooses. */
  function notesMarkdown() {
    const d = notes[0] ? notes[0].at : new Date();
    const lines = [`# Interview notes, ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`, ''];
    const job = $('target').selectedOptions[0];
    if (job && job.value) lines.push(`Interview: ${job.textContent.replace(/ · interviewing$/, '')}`, '');
    notes.forEach((n, i) => {
      lines.push(`## ${i + 1}. ${n.question}`, `_${n.at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}${n.kind ? ` · ${n.kind}` : ''}_`, '');
      n.points.forEach((p) => lines.push(`- ${p}`));
      if (n.story) lines.push(`- Story: ${n.story}`);
      lines.push('');
    });
    lines.push('Next: draft a thank-you email from CareerOS Interview AI, and practise any question that felt shaky.');
    return lines.join('\n');
  }
  $('notesBtn').onclick = async () => {
    const res = await C.saveNotes(notesMarkdown());
    if (res && res.ok) setState('Notes saved', '');
  };

  /* ---------------- routing ---------------- */
  function route() {
    if (!st.signedIn) { show('signin'); setState(''); return; }
    if ((st.consentedVersion || 0) < CONSENT_VERSION) { show('consent'); return; }
    show('home');
    loadHome();
    refreshHistory();
  }
  route();
})();
