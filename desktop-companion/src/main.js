/* CareerOS Interview Companion — main process.
 *
 * A small, always-on-top window that works beside any call app (Zoom, Teams, Meet, Webex...). When the person
 * starts it, it listens to the computer's call audio (or the microphone), and when the interviewer asks a
 * question it shows a few talking points from the person's own CareerOS resume and saved stories.
 *
 * The window is an ordinary, visible window: it appears in screen shares and recordings like any other app.
 *
 * All AI runs on the CareerOS server (the same endpoints as the Interview Prep extension): the app signs in
 * with a device token and sends short speech clips to /interview/live/transcribe and the text to
 * /interview/live/assist. Requests go from this process (Node), because the API only accepts browser-extension
 * origins from web pages. No audio or transcript is written to disk; only notes the person chooses to save.
 */
const { app, BrowserWindow, ipcMain, shell, dialog, session, desktopCapturer, systemPreferences, globalShortcut } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_WEB = 'https://careeros.silverspringstaffing.com';
const WEB_URL = (process.env.CAREEROS_WEB_URL || DEFAULT_WEB).replace(/\/$/, '');
const API_BASE = (process.env.CAREEROS_API_BASE || `${WEB_URL}/api/extension`).replace(/\/$/, '');
const VERSION = app.getVersion();

// macOS shares system audio through ScreenCaptureKit; this lets Chromium use it for the call audio.
if (process.platform === 'darwin') app.commandLine.appendSwitch('enable-features', 'MacLoopbackAudioForScreenShare');
if (process.env.CAREEROS_USER_DATA) app.setPath('userData', process.env.CAREEROS_USER_DATA);

/* ---------------- settings (sign-in token, consent, preferences) ---------------- */
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch { return {}; }
}
function writeSettings(patch) {
  const next = { ...readSettings(), ...patch };
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

/* ---------------- CareerOS API ---------------- */
function deviceLabel() {
  const name = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux';
  return `Interview Companion (${name}, ${os.hostname().slice(0, 40)})`;
}

async function api(pathname, { method = 'GET', body, raw, contentType } = {}) {
  const token = readSettings().deviceToken;
  const headers = { 'X-CareerOS-Version': `companion-${VERSION}` };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (raw) headers['Content-Type'] = contentType || 'audio/webm';
  else if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`${API_BASE}${pathname}`, { method, headers, body: raw ? Buffer.from(raw) : body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    throw new Error('Couldn’t reach CareerOS. Check your internet connection.');
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (res.status === 401) {
    writeSettings({ deviceToken: '', pairedAs: '' });
    throw new Error('Your CareerOS sign-in expired. Sign in again.');
  }
  if (!res.ok) throw new Error((json && json.error) || `CareerOS returned ${res.status}`);
  return json || {};
}

/* The code the approval page shows for this request (mirrors connectCode() in src/lib/extension/service.ts):
   the person approves only when the app shows the same code. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function connectCode(state) {
  const bytes = crypto.createHash('sha256').update(state, 'utf8').digest();
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

/* Sign in: the same one-click approval the browser extensions use. */
let connecting = null;
async function connect() {
  if (connecting) return connecting;
  connecting = (async () => {
    const state = crypto.randomBytes(32).toString('hex');
    await api('/connect/start', { method: 'POST', body: { state, label: deviceLabel(), version: `companion-${VERSION}` } });
    if (win) win.webContents.send('connectCode', connectCode(state));
    // Automated tests have no browser; they approve the sign-in on the stand-in server instead.
    if (process.env.CAREEROS_NO_BROWSER !== '1') await shell.openExternal(`${WEB_URL}/extension-connect?state=${state}`);
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      let body = null;
      try { body = await api('/connect/poll', { method: 'POST', body: { state } }); } catch { continue; }
      if (body.status === 'approved' && body.token) {
        writeSettings({ deviceToken: body.token, pairedAs: body.email || body.name || '' });
        return { ok: true, pairedAs: body.email || body.name || '' };
      }
      if (body.status === 'denied') return { ok: false, error: 'The sign-in was declined.' };
      if (body.status === 'expired') return { ok: false, error: 'That took too long. Press Sign in again.' };
    }
    return { ok: false, error: 'Timed out waiting for approval in your browser.' };
  })().finally(() => { connecting = null; });
  return connecting;
}

/* ---------------- window ---------------- */
let win = null;
function createWindow() {
  const s = readSettings();
  win = new BrowserWindow({
    width: 400,
    height: 620,
    minWidth: 320,
    minHeight: 220,
    x: s.bounds?.x,
    y: s.bounds?.y,
    title: 'CareerOS Interview Companion',
    alwaysOnTop: s.alwaysOnTop !== false,
    backgroundColor: '#16131b',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('close', () => { if (win) writeSettings({ bounds: win.getBounds() }); });
  win.on('closed', () => { win = null; });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  // Media: the microphone, and the computer's call audio through a screen source (the video is discarded).
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media' || permission === 'display-capture'));
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (!sources.length) return cb({});
      cb({ video: sources[0], audio: process.platform === 'linux' ? undefined : 'loopback' });
    }).catch(() => cb({}));
  });
  createWindow();
  // User-triggered keyboard shortcut brings the visible assistant into focus.
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!win) createWindow();
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  app.on('activate', () => { if (!win) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());

/* ---------------- IPC ---------------- */
ipcMain.handle('state', () => {
  const s = readSettings();
  return {
    signedIn: Boolean(s.deviceToken),
    pairedAs: s.pairedAs || '',
    consentedVersion: s.consentedVersion || 0,
    alwaysOnTop: s.alwaysOnTop !== false,
    source: s.source || 'system',
    lastApplicationId: s.lastApplicationId || '',
    platform: process.platform,
    version: VERSION,
    webUrl: WEB_URL,
    testAudio: process.env.CAREEROS_TEST_AUDIO === '1',
  };
});
ipcMain.handle('connect', () => connect().catch((err) => ({ ok: false, error: err.message })));
ipcMain.handle('signOut', () => { writeSettings({ deviceToken: '', pairedAs: '' }); return { ok: true }; });
ipcMain.handle('saveSettings', (_e, patch) => {
  const allowed = {};
  for (const k of ['consentedVersion', 'consentedAt', 'source', 'lastApplicationId', 'alwaysOnTop']) if (k in patch) allowed[k] = patch[k];
  const s = writeSettings(allowed);
  if ('alwaysOnTop' in allowed && win) win.setAlwaysOnTop(allowed.alwaysOnTop !== false);
  return { ok: true, alwaysOnTop: s.alwaysOnTop !== false };
});
ipcMain.handle('targets', async () => {
  try { return { ok: true, ...(await api('/interview/targets')) }; } catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('transcribe', async (_e, { audio, mimeType }) => {
  try { return { ok: true, ...(await api('/interview/live/transcribe', { method: 'POST', raw: audio, contentType: mimeType })) }; } catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('assist', async (_e, payload) => {
  try { return { ok: true, ...(await api('/interview/live/assist', { method: 'POST', body: payload })) }; } catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('askCopilot', async (_e, payload) => {
  try { return { ok: true, ...(await api('/interview/copilot/ask', { method: 'POST', body: payload })) }; }
  catch (err) { return { ok: false, error: err.message }; }
});
// User explicitly triggers each capture. No background screenshots, clipboard or monitoring.
ipcMain.handle('analyzeScreen', async (_e, question) => {
  try {
    if (typeof question !== 'string' || question.trim().length < 2 || question.length > 1500) {
      return { ok: false, error: 'Enter a question (2–1500 characters) about the screenshot.' };
    }
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: { width: 1280, height: 800 },
    });
    if (!sources.length) return { ok: false, error: 'No screen source was available.' };
    const choices = sources.slice(0, 5);
    const selection = await dialog.showMessageBox(win, {
      type: 'question',
      title: 'Share a screenshot with CareerOS AI?',
      message: 'Choose the screen to capture and send to CareerOS for analysis.',
      detail: 'The captured image may contain private information. Close sensitive windows first. CareerOS will send this image to its AI provider to answer your question.',
      buttons: [...choices.map((item, i) => `Screen ${i + 1}: ${item.name}`), 'Cancel'],
      defaultId: choices.length,
      cancelId: choices.length,
      noLink: true,
    });
    if (selection.response >= choices.length) return { ok: false, cancelled: true };
    const screenshot = choices[selection.response].thumbnail.toJPEG(75);
    if (!screenshot.length || screenshot.length > 2_000_000) {
      return { ok: false, error: 'Screenshot too large. Try a lower display resolution.' };
    }
    const image = 'data:image/jpeg;base64,' + screenshot.toString('base64');
    return { ok: true, ...(await api('/interview/copilot/vision', {
      method: 'POST', body: { screenshot: image, question: question.trim() },
    })) };
  } catch (err) { return { ok: false, error: err.message || 'Screen analysis failed.' }; }
});
ipcMain.handle('micPermission', async () => {
  if (process.platform !== 'darwin') return 'granted';
  const status = systemPreferences.getMediaAccessStatus('microphone');
  if (status === 'granted') return status;
  return (await systemPreferences.askForMediaAccess('microphone')) ? 'granted' : 'denied';
});
ipcMain.handle('saveNotes', async (_e, markdown) => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  if (process.env.CAREEROS_NOTES_DIR) {
    // Automated tests: save without the file dialog.
    const file = path.join(process.env.CAREEROS_NOTES_DIR, `Interview notes ${stamp}.md`);
    fs.writeFileSync(file, markdown, 'utf8');
    return { ok: true, path: file };
  }
  const res = await dialog.showSaveDialog(win, {
    title: 'Save interview notes',
    defaultPath: path.join(app.getPath('documents'), `Interview notes ${stamp}.md`),
    filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }],
  });
  if (res.canceled || !res.filePath) return { ok: false };
  fs.writeFileSync(res.filePath, markdown, 'utf8');
  return { ok: true, path: res.filePath };
});
ipcMain.handle('openWeb', (_e, where) => shell.openExternal(`${WEB_URL}${where === 'interview' ? '/interview-ai' : where === 'support' ? '/support' : ''}`));
