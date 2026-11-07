'use strict';
// User-owned, opt-in local archive. Transcripts are never persisted unless "Save session" is clicked.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_SESSIONS = 100;
const MAX_SEGMENTS = 800;
const MAX_TEXT = 1600;
const MAX_ANSWERS = 60;
function storageFile(userDataDir) { return path.join(userDataDir, 'companion-session-history.json'); }
function normalizeString(value, limit) { return typeof value === 'string' ? value.slice(0, limit) : ''; }
function load(userDataDir) {
  try {
    const stored = JSON.parse(fs.readFileSync(storageFile(userDataDir), 'utf8'));
    return Array.isArray(stored) ? stored.slice(0, MAX_SESSIONS) : [];
  } catch { return []; }
}
function save(userDataDir, payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid session');
  const transcript = Array.isArray(payload.transcript)
    ? payload.transcript.slice(0, MAX_SEGMENTS).map(line => normalizeString(line, MAX_TEXT)).filter(Boolean)
    : [];
  const answers = Array.isArray(payload.answers)
    ? payload.answers.slice(0, MAX_ANSWERS).map(item => ({
      question: normalizeString(item && item.question, MAX_TEXT),
      answer: normalizeString(item && item.answer, 6000),
    })).filter(item => item.question || item.answer)
    : [];
  if (!transcript.length && !answers.length) throw new Error('Nothing to save yet.');
  const item = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    title: normalizeString(payload.title, 120) || 'CareerOS session',
    skill: normalizeString(payload.skill, 40),
    transcript,
    answers,
  };
  const current = load(userDataDir);
  const next = [item, ...current].slice(0, MAX_SESSIONS);
  fs.mkdirSync(userDataDir, { recursive: true });
  const target = storageFile(userDataDir);
  const temp = target + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify(next), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, target);
  } finally {
    try { fs.unlinkSync(temp); } catch { /* renamed */ }
  }
  return { id: item.id, savedAt: item.savedAt, title: item.title };
}
function remove(userDataDir, id) {
  if (typeof id !== 'string' || !/^[\da-f-]{36}$/i.test(id)) return false;
  const current = load(userDataDir);
  if (!current.some(item => item.id === id)) return false;
  fs.writeFileSync(storageFile(userDataDir), JSON.stringify(current.filter(item => item.id !== id)), { mode: 0o600 });
  return true;
}
module.exports = { load, save, remove };
