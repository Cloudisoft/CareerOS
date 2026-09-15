#!/usr/bin/env node
/**
 * Drives the extension's real, unmodified filler code (lib/profile.js,
 * lib/ats.js, lib/filler.js) against a realistic static Greenhouse-form
 * fixture in a real Chromium page, and asserts on the actual resulting DOM
 * state. This is not a reimplementation of the logic under test — it loads
 * the exact files that ship in the extension.
 *
 * Written after a real bug hunt (see git history on this file's addition):
 * live-testing this exact way caught two regexes in lib/ats.js that
 * silently failed to match extremely common real-world question phrasing
 * ("...legally authorized to work..." and "...require sponsorship...")
 * because of a `\bword\b` word-boundary bug that doesn't match the word
 * with a suffix attached. Code review alone did not catch either.
 *
 * Usage: node extension/test/field-matching.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');
const fixtureUrl = 'file://' + path.join(__dirname, 'greenhouse-fixture.html');

const PROFILE = {
  identity: {
    firstName: 'Priya', lastName: 'Nair', preferredName: '', email: 'priya.nair@example.com',
    phone: '+91 98765 43210', city: 'Bengaluru', state: 'Karnataka', country: 'India',
    postalCode: '560001', addressLine1: '', linkedin: 'linkedin.com/in/priyanair',
    github: 'github.com/priyanair', portfolio: ''
  },
  targeting: {
    titles: ['Software Engineer', 'Backend Engineer'], excludeTitles: [], excludeCompanies: [],
    seniority: 'mid', workModes: ['remote'], locations: ['Bengaluru', 'Remote'],
    minSalary: 2500000, salaryCurrency: 'INR', salaryPeriod: 'year'
  },
  experience: {
    totalYears: 4, currentTitle: 'Software Engineer', currentCompany: 'Initech',
    noticePeriod: '30 days',
    history: [{ title: 'Software Engineer', company: 'Initech', start: '2022-01', end: '', location: 'Bengaluru', bullets: ['Built payment APIs'] }]
  },
  skills: { core: ['Go', 'TypeScript', 'PostgreSQL'], familiar: ['Python'], tools: ['Docker', 'Kubernetes'], languages: ['English', 'Hindi'] },
  education: [{ degree: 'B.Tech', field: 'Computer Science', school: 'IIT Bombay', year: 2020, gpa: '' }],
  certifications: [],
  strengths: ['Ships fast without breaking things'],
  workAuth: { authorizedIn: ['IN'], needsSponsorship: false, requiresVisa: '', willingToRelocate: true },
  voluntary: { gender: 'Decline to self identify', race: 'Decline to self identify', veteran: "I don't wish to answer", disability: "I don't wish to answer" },
  narrative: { summary: 'Backend engineer focused on reliable distributed systems.', whyLeaving: '', availableFrom: 'Immediately' }
};

const RESUME = {
  name: 'priya-nair-resume.pdf',
  mime: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2c+PgplbmRvYmoKJSVFT0Y=',
};

function resolveExecutablePath() {
  // Prefer Playwright's normal managed browser; fall back to this sandbox's
  // pre-installed Chromium (see AGENTS/environment docs) if that's missing.
  const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return existsSync(fallback) ? fallback : undefined;
}

async function main() {
  const browser = await chromium.launch({ executablePath: resolveExecutablePath() });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(fixtureUrl);
  for (const rel of ['lib/profile.js', 'lib/ats.js', 'lib/filler.js']) {
    await page.addScriptTag({ path: path.join(repoRoot, 'extension', rel) });
  }

  const result = await page.evaluate(async ({ profile, resume }) => {
    const { Filler } = window.CareerOS;
    const context = {
      resume,
      async answerQuestion(question) {
        if (/favorite color/i.test(question)) return null; // nothing in a real profile could answer this
        return 'A generated answer grounded in the profile.';
      },
      async generate(kind) {
        if (kind === 'coverLetter') return 'A short, grounded cover letter for this role.';
        if (kind === 'whyCompany') return 'A short, targeted answer about why this specific role.';
        return '';
      }
    };
    const report = await Filler.fillForm(document, profile, context);
    const val = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
    return {
      report: { total: report.total, filled: report.filled.length, generated: report.generated.length, skipped: report.skipped.map((s) => s.label) },
      values: {
        first_name: val('first_name'), last_name: val('last_name'), email: val('email'), phone: val('phone'),
        cover_letter: val('cover_letter'), q_why: val('q_why'), work_auth: val('work_auth'), sponsorship: val('sponsorship'),
        react_first_name: val('react_first_name'),
      },
      radioRelocateChecked: document.querySelector('input[name="relocate"][value="Yes"]').checked,
      resumeAttached: document.getElementById('resume').files.length === 1,
      favoriteColorFlagged: document.getElementById('favorite_color').classList.contains('careeros-attention'),
    };
  }, { profile: PROFILE, resume: RESUME });

  await browser.close();

  const checks = [
    ['first name filled correctly', result.values.first_name === 'Priya'],
    ['last name filled correctly', result.values.last_name === 'Nair'],
    ['email filled correctly', result.values.email === 'priya.nair@example.com'],
    ['phone filled correctly', result.values.phone === '+91 98765 43210'],
    ['resume file attached', result.resumeAttached === true],
    ['relocate radio picked "Yes"', result.radioRelocateChecked === true],
    ['work-auth select answered ("...legally authorized to work..." phrasing)', result.values.work_auth === 'Yes'],
    ['sponsorship select answered ("...require sponsorship..." phrasing)', result.values.sponsorship === 'No'],
    ['cover letter field got cover-letter text', result.values.cover_letter === 'A short, grounded cover letter for this role.'],
    ['"why interested" question got its OWN answer, not the cover letter verbatim',
      result.values.q_why === 'A short, targeted answer about why this specific role.' && result.values.q_why !== result.values.cover_letter],
    ['React-controlled input survived a simulated re-render', result.values.react_first_name === 'Priya'],
    ['field with no matching pattern is flagged for the human, not guessed', result.favoriteColorFlagged === true],
    ['no console errors while filling', consoleErrors.length === 0],
  ];

  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`);
    if (!ok) failed++;
  }
  console.log(`\n${checks.length - failed}/${checks.length} checks passed.`);
  if (consoleErrors.length) console.log('Console errors:', consoleErrors);
  if (failed) process.exit(1);
}

main().catch((err) => { console.error('FATAL', err); process.exit(1); });
