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
    'This window is visible like any other app: it shows up if you share your screen or record.',
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
  let transcriptCount = 0;
  const notes = [];
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
    if (!running || asking || !question) return;
    asking = true;
    $('askBtn').disabled = true;
    showError('liveError', '');
    setState('Thinking…', 'busy');
    try {
      const response = await C.assist({
        applicationId: applicationId || null,
        transcript: question,
        recent: recent.slice(-RECENT),
        lastQuestion: lastQuestion || undefined,
      });
      if (!response.ok) return onError(response.error);
      if (response.assist && response.assist.isQuestion) {
        lastQuestion = response.assist.question || question;
        showAssist(response.assist);
      } else {
        showError('liveError', 'No answer was generated. Try asking a specific interview question.');
      }
      $('askInput').value = '';
    } catch (error) {
      showError('liveError', error.message || 'Could not ask CareerOS.');
    } finally {
      asking = false;
      $('askBtn').disabled = false;
      setState(running ? 'Listening' : '', running ? 'on' : '');
    }
  });

  async function start() {
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
    fatal = false;
    recent = [];
    lastQuestion = '';
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
    running = false;
    if (ticker) clearInterval(ticker);
    ticker = null;
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
    $('askBtn').disabled = true;
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
    $('transcriptList').replaceChildren();
    transcriptCount = 0;
    $('transcriptCount').textContent = '0';
    $('transcriptPanel').open = false;
    $('askInput').value = '';
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
  }
  route();
})();
