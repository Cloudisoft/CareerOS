// @vitest-environment jsdom
//
// Loads a handful of static, anonymized ATS-form fixtures into jsdom and runs
// the extension's own lib/filler.js against them, unmodified — no mocking of
// collectFields/classify/fill, so a real regression in field detection or
// matching shows up here the same way it would on a live page.
//
// The extension has no build step and its lib files are plain IIFEs that
// attach themselves to `self`/`this` rather than exporting a module, so they
// are loaded here the same way the browser loads them: as scripts evaluated
// against the global (jsdom) window, in the same order the manifest's
// content-script registration uses (see lib/permissions.js).
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, '..');

function loadLib(relPath) {
  const code = fs.readFileSync(path.join(EXT_DIR, relPath), 'utf8');
  // Indirect eval — runs in global scope, so the IIFE's `typeof self` sees
  // jsdom's global `self`/`window` the same way a content script would.
  (0, eval)(code);
}

function loadFixture(name) {
  const html = fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
  document.body.innerHTML = html;
  return document.body.querySelector('form');
}

function baseProfile(overrides) {
  const p = window.CareerOS.Profile.blank();
  Object.assign(p.identity, {
    firstName: 'Asha', lastName: 'Rao', email: 'asha.rao@example.com',
    phone: '+91 90000 00000', city: 'Bengaluru', state: 'Karnataka', country: 'India',
    linkedin: 'linkedin.com/in/asharao', portfolio: 'asharao.dev'
  });
  Object.assign(p.experience, { currentTitle: 'Senior Frontend Engineer', totalYears: 6 });
  p.workAuth.needsSponsorship = false;
  p.workAuth.willingToRelocate = true;
  if (overrides) Object.assign(p, overrides);
  return window.CareerOS.Profile.hydrate(p);
}

function noopContext(overrides) {
  return Object.assign({
    resume: null,
    answerQuestion: async () => null,
    generate: async () => null
  }, overrides);
}

beforeAll(() => {
  // jsdom does no layout, so getClientRects()/getBoundingClientRect() are
  // always empty on every element. lib/filler.js's isVisible() correctly (for
  // a real browser) treats an empty rect list as "not visible" and skips the
  // field entirely — which would make every field in every fixture untestable
  // here. This is the standard jsdom workaround: a deterministic non-empty
  // rect for anything that isn't explicitly display:none/visibility:hidden,
  // which is the only kind of "hidden" these fixtures ever use.
  const proto = window.HTMLElement.prototype;
  proto.getClientRects = function () {
    const style = window.getComputedStyle(this);
    if (style.display === 'none' || style.visibility === 'hidden') return [];
    return [{ width: 1, height: 1, top: 0, left: 0, bottom: 1, right: 1 }];
  };
  proto.getBoundingClientRect = function () {
    return this.getClientRects()[0] || { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };
  };

  loadLib('lib/profile.js');
  loadLib('lib/ats.js');
  loadLib('lib/filler.js');
});

describe('Filler against a plain-text-heavy Greenhouse form', () => {
  it('recognises and fills first/last/email/phone/linkedin/portfolio, and routes the free-text question to generate()', async () => {
    const form = loadFixture('greenhouse-plain.html');
    const profile = baseProfile();
    const questions = [];
    const context = noopContext({
      answerQuestion: async (q) => { questions.push(q); return 'Because the mission lines up with what I want to build next.'; }
    });

    const report = await window.CareerOS.Filler.fillForm(form, profile, context);

    expect(form.querySelector('#first_name').value).toBe('Asha');
    expect(form.querySelector('#last_name').value).toBe('Rao');
    expect(form.querySelector('#email').value).toBe('asha.rao@example.com');
    expect(form.querySelector('#phone').value).toBe('+91 90000 00000');
    expect(form.querySelector('#linkedin').value).toBe('linkedin.com/in/asharao');
    expect(form.querySelector('#portfolio').value).toBe('asharao.dev');

    // The "why are you interested" textarea has no FIELD_PATTERN match, so it
    // is classified as an open question and handed to answerQuestion().
    expect(questions).toHaveLength(1);
    expect(form.querySelector('#cover').value).toContain('mission');

    expect(report.filled.length).toBeGreaterThanOrEqual(6);
    expect(report.skipped.find((s) => s.required)).toBeUndefined();
  });
});

describe('Filler against a select/radio/checkbox Lever-style form', () => {
  it('picks the best-matching select option, the right radio, and checks the checkbox truthfully', async () => {
    const form = loadFixture('lever-select-radio.html');
    const profile = baseProfile();

    const report = await window.CareerOS.Filler.fillForm(form, profile, noopContext());

    expect(form.querySelector('#current_title').value).toBe('Senior Frontend Engineer');
    expect(form.querySelector('#location').value).toBe('blr'); // "Bengaluru" beats "Remote"/"New York"
    expect(form.querySelector('input[name="work_auth"][value="yes"]').checked).toBe(true);
    expect(form.querySelector('input[name="work_auth"][value="no"]').checked).toBe(false);
    expect(form.querySelector('#relocate').checked).toBe(true); // willingToRelocate: true

    expect(report.filled.length).toBe(4);
  });

  it('leaves the work-auth radio unset and flags it when neither option\'s text actually matches', async () => {
    // Sanity check on the matcher, not just the happy path: when the
    // resolved value ("Yes"/"No") doesn't textually match either option, the
    // filler must report it as needing the person rather than guessing.
    const form = loadFixture('lever-select-radio.html');
    form.querySelectorAll('input[name="work_auth"]').forEach((radio) => {
      radio.closest('label').lastChild.textContent = radio.value === 'yes'
        ? ' I am authorized to work here'
        : ' I am not authorized to work here';
    });
    const profile = baseProfile();

    const report = await window.CareerOS.Filler.fillForm(form, profile, noopContext());
    const skippedAuth = report.skipped.find((s) => /authorized/i.test(s.label));
    expect(skippedAuth).toBeDefined();
    expect(form.querySelector('input[name="work_auth"]:checked')).toBeNull();
  });
});

describe('Filler against a resume-upload step', () => {
  it('recognises the file input as the resume field regardless of its position in the DOM', () => {
    const form = loadFixture('resume-upload.html');
    const fields = window.CareerOS.Filler.collectFields(form);

    const fileField = fields.find((f) => f.kind === 'file');
    expect(fileField).toBeDefined();
    expect(window.CareerOS.Filler.classify(fileField)).toEqual({ key: 'resume', file: 'resume' });

    // Item 2 (resume-upload-first ordering) depends on fillForm() being able
    // to pick the file field out of collectFields()'s DOM-order list even
    // when it comes last, which this fixture deliberately does.
    expect(fields[fields.length - 1].kind).toBe('file');
  });

  it('fills the resume field before the rest even though it is last in the DOM, then re-collects for the remaining fields', async () => {
    const form = loadFixture('resume-upload.html');
    const profile = baseProfile();

    // Filler is a plain object (no build step / module exports to spy through
    // otherwise), so its own .fill method can be wrapped directly to record
    // the true call order — the most direct way to prove item 2's ordering
    // without needing jsdom's incomplete File/DataTransfer support to exercise
    // attachFile() itself (that part is covered by the fixture/classify test
    // above; jsdom has no constructible FileList to hand a real input.files).
    const Filler = window.CareerOS.Filler;
    const order = [];
    const originalFill = Filler.fill;
    Filler.fill = async function (field, ...rest) {
      order.push(field.label);
      return originalFill.call(Filler, field, ...rest);
    };

    let report;
    try {
      report = await Filler.fillForm(form, profile, noopContext());
    } finally {
      Filler.fill = originalFill;
    }

    expect(order[0]).toMatch(/resume/i);
    expect(order.slice(1)).toEqual(expect.arrayContaining(['First Name', 'Email Address']));
    expect(form.querySelector('#first_name').value).toBe('Asha');
    expect(form.querySelector('#email').value).toBe('asha.rao@example.com');
    // No resume was actually attached (context.resume is null), so the
    // resume field itself is correctly reported as needing the person.
    expect(report.skipped.find((s) => /resume/i.test(s.label))).toBeDefined();
  });
});

describe('Filler against a Workday-style form (aria-labelledby, no <label for>, data-automation-id)', () => {
  it('reads labels from aria-labelledby text rather than a <label for>', async () => {
    const form = loadFixture('workday-tricky.html');
    const profile = baseProfile();

    const report = await window.CareerOS.Filler.fillForm(form, profile, noopContext());

    expect(form.querySelector('[data-automation-id="legalNameSection_firstName"]').value).toBe('Asha');
    expect(form.querySelector('[data-automation-id="legalNameSection_lastName"]').value).toBe('Rao');
    expect(form.querySelector('[data-automation-id="email"]').value).toBe('asha.rao@example.com');

    // "Will you require visa sponsorship?" -> needsSponsorship: false -> "No".
    expect(form.querySelector('input[name="sponsorship"][value="no"]').checked).toBe(true);
    expect(form.querySelector('input[name="sponsorship"][value="yes"]').checked).toBe(false);

    // The ranged "3-5 years" style select has no value that matches a bare
    // "6" from totalYears — this is a known, honest limitation (see
    // lib/filler.js's pickOption matching rules), and the required field
    // must be left alone and flagged rather than guessed at.
    const yearsSelect = form.querySelector('[data-automation-id="yearsExperience"]');
    expect(yearsSelect.value).toBe('');
    const skippedYears = report.skipped.find((s) => /years of relevant experience/i.test(s.label));
    expect(skippedYears).toBeDefined();
    expect(skippedYears.required).toBe(true);
  });
});
