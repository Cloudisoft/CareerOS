/* CareerOS — filler
 * Reads a form, works out what each field is asking for, and answers it from
 * the profile. Anything it can't answer confidently is left alone and reported
 * back so the person can finish it themselves.
 */
(function (root) {
  'use strict';

  const { Profile } = root.CareerOS;

  const SKIP_TYPES = ['hidden', 'submit', 'button', 'image', 'reset'];

  const Filler = {
    /* Collect every answerable control inside a scope. */
    collectFields(scope) {
      const el = scope || document;
      const nodes = Array.from(el.querySelectorAll('input, select, textarea'));
      const groups = new Map();
      const fields = [];

      nodes.forEach((node) => {
        if (SKIP_TYPES.includes(node.type)) return;
        if (node.disabled || node.readOnly) return;
        if (!isVisible(node)) return;

        if (node.type === 'radio') {
          const key = node.name || labelFor(node);
          if (groups.has(key)) { groups.get(key).options.push(node); return; }
          const g = { kind: 'radio', name: key, options: [node], label: groupLabel(node), node };
          groups.set(key, g);
          fields.push(g);
          return;
        }
        fields.push({
          kind: node.tagName === 'SELECT' ? 'select' : (node.type === 'checkbox' ? 'checkbox' : (node.type === 'file' ? 'file' : 'text')),
          node,
          label: labelFor(node),
          required: isRequired(node)
        });
      });

      return fields;
    },

    /* Work out what a field is asking for. */
    classify(field) {
      const label = normalize(field.label);
      if (!label) return null;
      if (field.kind === 'file') return { key: 'resume', file: 'resume' };
      for (const pattern of root.CareerOS.ATS.FIELD_PATTERNS) {
        if (pattern.re.test(label)) return pattern;
      }
      return null;
    },

    /* Fill one field. Returns a small report object. */
    async fill(field, profile, context) {
      const pattern = Filler.classify(field);
      const label = field.label || '(unlabelled)';

      if (!pattern) {
        // Unrecognised — if it's a free-text box with a real question, hand it
        // to the answer bank / JobGPT rather than guessing.
        if (field.kind === 'text' && field.node.tagName === 'TEXTAREA' && label.length > 12) {
          const answer = await context.answerQuestion(label);
          if (answer) {
            setValue(field.node, answer);
            return { label, status: 'generated', value: answer };
          }
        }
        return { label, status: 'skipped', reason: 'Not recognised', required: field.required };
      }

      if (pattern.file) {
        const ok = await attachFile(field.node, context.resume);
        return { label, status: ok ? 'filled' : 'skipped', reason: ok ? null : 'No resume saved', value: context.resume && context.resume.name };
      }

      let value = pattern.generated
        ? await context.generate(pattern.generated, label)
        : resolveValue(pattern, profile);

      if (value === undefined || value === null || value === '') {
        return { label, status: 'skipped', reason: 'Nothing in your profile for this', required: field.required };
      }

      if (field.kind === 'select') {
        const picked = pickOption(field.node, value);
        if (!picked) return { label, status: 'skipped', reason: `No option matching "${value}"`, required: field.required };
        return { label, status: 'filled', value: picked };
      }

      if (field.kind === 'radio') {
        const picked = pickRadio(field.options, value);
        if (!picked) return { label, status: 'skipped', reason: `No option matching "${value}"`, required: field.required };
        return { label, status: 'filled', value: picked };
      }

      if (field.kind === 'checkbox') {
        const truthy = /^(yes|true|1|agree)$/i.test(String(value));
        if (truthy && !field.node.checked) clickLike(field.node);
        return { label, status: 'filled', value: truthy ? 'checked' : 'left unchecked' };
      }

      setValue(field.node, String(value));
      // Workday/Greenhouse-style combobox: typing opens a listbox and the
      // form's own JS only registers the value once an option is clicked —
      // a raw setValue leaves the field looking filled but unset underneath.
      // A real calendar-widget date picker gets the same treatment: clicking
      // through to the matching day rather than leaving the popup open over
      // an otherwise-empty field.
      const settled = await settleTypeaheadOrDatePicker(field.node, String(value));
      return { label, status: 'filled', value: settled.matched || String(value) };
    },

    /* Fill a whole form. */
    async fillForm(scope, profile, context) {
      const fields = Filler.collectFields(scope);
      const report = { filled: [], skipped: [], generated: [], total: fields.length };

      /* Many ATS forms auto-populate name/email/experience the instant a
         resume is uploaded and parsed, which can silently clobber whatever
         was already typed into those fields if the resume input happens to
         sit later in the DOM. Filling the resume field first, then giving
         the page a moment to run its own parse/autofill before re-collecting
         the rest of the form, avoids that ordering hazard. Re-collecting
         (rather than reusing the original snapshot) matters too: the parse
         can add fields that didn't exist yet, or change which ones are
         visible/required. */
      const resumeField = fields.find((f) => f.kind === 'file');
      let rest = fields;

      if (resumeField) {
        let result;
        try {
          result = await Filler.fill(resumeField, profile, context);
        } catch (err) {
          result = { label: resumeField.label, status: 'skipped', reason: err.message };
        }
        (result.status === 'filled' ? report.filled : report.skipped).push(result);

        if (result.status === 'filled') {
          await sleep(400 + Math.random() * 300); // resume-parse debounce is slower than a keystroke
          rest = Filler.collectFields(scope).filter((f) => f.kind !== 'file');
          report.total = rest.length + 1;
        } else {
          rest = fields.filter((f) => f !== resumeField);
        }
      }

      for (const field of rest) {
        let result;
        try {
          result = await Filler.fill(field, profile, context);
        } catch (err) {
          result = { label: field.label, status: 'skipped', reason: err.message };
        }
        if (result.status === 'filled') report.filled.push(result);
        else if (result.status === 'generated') report.generated.push(result);
        else report.skipped.push(result);

        if (result.status !== 'filled' && result.status !== 'generated' && field.required) {
          markAttention(field.node);
        }
        await sleep(30 + Math.random() * 70); // let the page's own handlers keep up
      }
      return report;
    },

    markAttention
  };

  /* ---------- value plumbing ---------- */

  function resolveValue(pattern, profile) {
    if (pattern.resolve) return pattern.resolve(profile, Profile);
    if (!pattern.path) return '';
    return pattern.path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), profile);
  }

  /* React and Vue both track values internally; assigning .value directly is
     silently discarded on re-render. Go through the native setter instead. */
  function setValue(node, value) {
    const proto = node.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value');
    node.focus();
    if (setter && setter.set) setter.set.call(node, value);
    else node.value = value;
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
    node.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    node.blur();
    flash(node);
  }

  function pickOption(select, value) {
    const want = normalize(value);
    const options = Array.from(select.options);
    let hit =
      options.find((o) => normalize(o.textContent) === want) ||
      options.find((o) => normalize(o.value) === want) ||
      options.find((o) => normalize(o.textContent).includes(want) && want.length > 2) ||
      options.find((o) => want.includes(normalize(o.textContent)) && normalize(o.textContent).length > 2);

    // Yes/no questions phrased as "I am authorized…" style options
    if (!hit && /^(yes|no)$/i.test(value)) {
      hit = options.find((o) => new RegExp(`^${value}\\b`, 'i').test(o.textContent.trim()));
    }
    if (!hit) return null;
    select.focus();
    select.value = hit.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    flash(select);
    return hit.textContent.trim();
  }

  function pickRadio(options, value) {
    const want = normalize(value);
    const labelled = options.map((o) => ({ node: o, text: normalize(labelFor(o) || o.value) }));
    const hit =
      labelled.find((o) => o.text === want) ||
      labelled.find((o) => o.text.startsWith(want)) ||
      labelled.find((o) => o.text.includes(want) && want.length > 2);
    if (!hit) return null;
    clickLike(hit.node);
    return hit.text;
  }

  /* Poll briefly for either a typeahead/combobox popup or a calendar overlay
     to appear after a plain setValue, and click through it when one does.
     Most fields never trigger either — this returns fast when nothing shows
     up, same shape as lib/flows.js's waitFor(). */
  async function settleTypeaheadOrDatePicker(node, value) {
    const listbox = await pollFor(() => findOptionPopup(node), 350);
    if (listbox) {
      const hit = matchOptionInPopup(listbox, value);
      if (hit) { clickLike(hit); return { matched: normalizeText(hit) }; }
    }

    const date = parseDateLoose(value);
    if (date) {
      const calendar = await pollFor(() => findCalendarPopup(), 300);
      if (calendar) {
        const day = findMatchingDayCell(calendar, date);
        if (day) { clickLike(day); return { matched: normalizeText(day) }; }
      }
    }

    return {};
  }

  async function pollFor(predicate, timeout) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const hit = predicate();
      if (hit) return hit;
      await sleep(90);
    }
    return null;
  }

  function findOptionPopup(node) {
    const scopes = [];
    const controls = node.getAttribute('aria-controls') || node.getAttribute('aria-owns');
    if (controls) controls.split(/\s+/).forEach((id) => { const el = document.getElementById(id); if (el) scopes.push(el); });
    const wrapper = node.closest('[class*="combobox"], [class*="autocomplete"], [class*="typeahead"]');
    if (wrapper) scopes.push(wrapper);
    scopes.push(document);

    for (const scope of scopes) {
      const el = scope.querySelector(
        '[role="listbox"], [role="option"], [aria-autocomplete] ~ [class*="menu"], [class*="dropdown-menu"], [class*="suggestions"]'
      );
      if (el && isVisible(el)) return el;
    }
    return null;
  }

  function matchOptionInPopup(popup, value) {
    const want = normalize(value);
    const inside = Array.from(popup.querySelectorAll('[role="option"], li[class*="option"], li[class*="suggestion"], li[class*="item"]'));
    // findOptionPopup may itself have returned a single [role="option"] node
    // (its own scan matches on one directly) rather than the listbox that
    // contains it — include it too so a one-item popup still matches.
    const options = (popup.getAttribute && popup.getAttribute('role') === 'option' ? [popup, ...inside] : inside)
      .filter(isVisible);
    if (!options.length) return null;

    // Same matching chain as pickOption/pickRadio: exact, then substring
    // either direction, nothing invented beyond that.
    return (
      options.find((o) => normalize(o.textContent) === want) ||
      options.find((o) => normalize(o.textContent).includes(want) && want.length > 2) ||
      options.find((o) => want.includes(normalize(o.textContent)) && normalize(o.textContent).length > 2) ||
      null
    );
  }

  function findCalendarPopup() {
    const els = Array.from(document.querySelectorAll('[role="dialog"], .datepicker, [class*="calendar"], [class*="date-picker"]'));
    return els.find(isVisible) || null;
  }

  /* A profile date is normally ISO-ish ("2024-06-01") or free text ("June 2024").
     Anything Date can't make sense of is left alone rather than guessed at. */
  function parseDateLoose(value) {
    if (!/\d/.test(value)) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function findMatchingDayCell(popup, date) {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const monthShort = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year = String(date.getFullYear());
    const candidates = Array.from(
      popup.querySelectorAll('[role="gridcell"] button, [role="gridcell"], td button, td, button[class*="day"], [class*="day"]:not([class*="days"])')
    ).filter((c) => isVisible(c) && !c.disabled && c.getAttribute('aria-disabled') !== 'true');

    // Best case: an aria-label spelling out the whole date, so the right
    // month is picked even when the grid shows adjacent months' overflow days.
    let hit = candidates.find((c) => {
      const label = (c.getAttribute('aria-label') || c.title || '').toLowerCase();
      return label.includes(year) && (label.includes(month) || label.includes(monthShort)) && new RegExp(`\\b${day}\\b`).test(label);
    });

    // Fallback: a bare day-of-month number is only safe to click when it's
    // the single such cell on screen — otherwise it's as likely to be last
    // month's "12" as this month's.
    if (!hit) {
      const bare = candidates.filter((c) => normalize(c.textContent) === String(day));
      if (bare.length === 1) hit = bare[0];
    }
    return hit || null;
  }

  function normalizeText(node) {
    return (node.getAttribute('aria-label') || node.textContent || '').trim().replace(/\s+/g, ' ');
  }

  function clickLike(node) {
    node.focus();
    node.click();
    node.dispatchEvent(new Event('change', { bubbles: true }));
    flash(node);
  }

  /* File inputs can't be assigned a path, but they can be handed a
     DataTransfer, which is how a real drop would arrive. */
  async function attachFile(input, resume) {
    if (!resume || !resume.dataUrl) return false;
    try {
      const blob = await (await fetch(resume.dataUrl)).blob();
      const file = new File([blob], resume.name || 'resume.pdf', { type: resume.mime || blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      flash(input);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---------- label reading ---------- */

  function labelFor(node) {
    if (node.getAttribute('aria-label')) return node.getAttribute('aria-label');

    const labelledBy = node.getAttribute('aria-labelledby');
    if (labelledBy) {
      const t = labelledBy.split(' ').map((id) => {
        const el = document.getElementById(id);
        return el ? el.textContent : '';
      }).join(' ').trim();
      if (t) return t;
    }

    if (node.id) {
      const l = document.querySelector(`label[for="${cssEscape(node.id)}"]`);
      if (l && l.textContent.trim()) return l.textContent.trim();
    }

    const wrapping = node.closest('label');
    if (wrapping) {
      const clone = wrapping.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const t = clone.textContent.trim();
      if (t) return t;
    }

    // Walk up looking for the nearest text that reads like a question
    let el = node.parentElement;
    for (let depth = 0; el && depth < 4; depth++, el = el.parentElement) {
      const label = el.querySelector('label, legend, .label, [class*="label"], [class*="question"]');
      if (label && label.textContent.trim()) return label.textContent.trim();
    }

    return node.placeholder || node.name || '';
  }

  function groupLabel(node) {
    const fs = node.closest('fieldset');
    if (fs) {
      const legend = fs.querySelector('legend');
      if (legend && legend.textContent.trim()) return legend.textContent.trim();
    }
    let el = node.parentElement;
    for (let depth = 0; el && depth < 5; depth++, el = el.parentElement) {
      const q = el.querySelector('legend, [class*="question"], [class*="label"]');
      if (q && q.textContent.trim().length > 3) return q.textContent.trim();
    }
    return node.name || '';
  }

  function isRequired(node) {
    if (node.required || node.getAttribute('aria-required') === 'true') return true;
    const label = labelFor(node);
    return /\*|\(required\)/i.test(label);
  }

  function isVisible(node) {
    if (!node.getClientRects().length) return false;
    const style = getComputedStyle(node);
    return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  }

  function normalize(s) {
    return String(s || '')
      .replace(/\*/g, ' ')
      .replace(/\(required\)/gi, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cssEscape(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/([^\w-])/g, '\\$1');
  }

  let highlight = true;

  function flash(node) {
    if (!highlight) return;
    node.classList.add('careeros-filled');
    setTimeout(() => node.classList.remove('careeros-filled'), 1400);
  }

  function markAttention(node) {
    if (!highlight) return;
    node.classList.add('careeros-attention');
  }

  Filler.setHighlight = function (on) { highlight = on !== false; };

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  root.CareerOS.Filler = Filler;
})(typeof self !== 'undefined' ? self : this);
