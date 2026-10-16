/* CareerOS — filler
 * Reads a form, works out what each field is asking for, and answers it from the profile, the person's
 * saved answers, or (for questions the profile can support) the AI. Anything it can't answer confidently
 * is left alone and reported back so the person can finish it; nothing they typed is ever overwritten.
 */
(function (root) {
  'use strict';

  const { Profile } = root.CareerOS;
  const Answers = () => root.CareerOS.Answers;

  const SKIP_TYPES = ['hidden', 'submit', 'button', 'image', 'reset'];
  const CAPTCHA_FIELD = /g-recaptcha-response|h-captcha-response|cf-turnstile-response|captcha/i;
  const OPTION_SELECTOR = '[role="option"], [id*="-option-"], .select__option, [class*="__option"]';

  const Filler = {
    /* Collect every answerable control inside a scope. */
    collectFields(scope) {
      const el = scope || document;
      const nodes = Array.from(el.querySelectorAll('input, select, textarea'));
      const groups = new Map();
      const fields = [];

      nodes.forEach((node) => {
        if (SKIP_TYPES.includes(node.type)) return;
        if (node.disabled) return;
        if (CAPTCHA_FIELD.test(node.name || '') || CAPTCHA_FIELD.test(node.id || '')) return;
        const isFile = node.type === 'file';
        const isChoice = node.type === 'radio' || node.type === 'checkbox';
        // Upload inputs are usually hidden behind an "Attach" button; styled radios/checkboxes are often
        // transparent with a visible label. Both are still real, answerable fields.
        if (!isFile && !(isVisible(node) || (isChoice && labelVisible(node)))) return;
        if (node.readOnly && !isCombobox(node)) return;

        if (node.type === 'radio') {
          const key = node.name || labelFor(node);
          if (groups.has(key)) { groups.get(key).options.push(node); return; }
          const g = { kind: 'radio', name: key, options: [node], label: groupLabel(node), node, required: false };
          groups.set(key, g);
          fields.push(g);
          return;
        }
        fields.push({
          kind: node.tagName === 'SELECT' ? 'select'
            : isCombobox(node) ? 'combobox'
            : node.type === 'checkbox' ? 'checkbox'
            : isFile ? 'file' : 'text',
          node,
          label: labelFor(node),
          required: isRequired(node)
        });
      });
      fields.filter((f) => f.kind === 'radio').forEach((g) => {
        const fs = g.node.closest('fieldset');
        g.required = g.options.some((o) => o.required || o.getAttribute('aria-required') === 'true')
          || /\*|\(required\)/i.test(g.label)
          || !!(fs && fs.getAttribute('aria-required') === 'true');
      });

      // Questions answered by clicking one of a few buttons (Ashby "Yes" / "No").
      const seen = new Set();
      Array.from(el.querySelectorAll('button[type="button"], [role="radio"]')).forEach((btn) => {
        const parent = btn.parentElement;
        if (!parent || seen.has(parent) || !isVisible(btn)) return;
        const buttons = Array.from(parent.children).filter((c) => c.matches('button[type="button"], [role="radio"]') && isVisible(c));
        const texts = buttons.map((b) => cleanText(b.textContent));
        if (buttons.length < 2 || buttons.length > 6 || texts.some((t) => !t || t.length > 40)) return;
        if (!texts.some((t) => /^(yes|no)\b/i.test(t)) && !parent.matches('[role="radiogroup"]')) return;
        seen.add(parent);
        const container = parent.closest('[class*="field-entry"], [class*="question"], fieldset, [role="group"]') || parent.parentElement;
        const label = groupLabel(btn);
        fields.push({
          kind: 'choice',
          node: btn,
          options: buttons,
          label,
          required: /\*|\(required\)/i.test(label || '') || !!(container && container.querySelector('[aria-required="true"], [required]'))
        });
      });

      return fields;
    },

    /* Work out what a field is asking for. */
    classify(field) {
      const label = normalize(field.label);
      if (field.kind === 'file') {
        if (/cover/.test(label)) return { key: 'coverLetterFile' };
        return { key: 'resume', file: 'resume' };
      }
      if (!label) return null;
      for (const pattern of root.CareerOS.ATS.FIELD_PATTERNS) {
        if (pattern.re.test(label)) return pattern;
      }
      return null;
    },

    /* Fill one field. Returns a small report object. */
    async fill(field, profile, context) {
      const label = field.label || '(unlabelled)';
      const skip = (reason) => ({ label, status: 'skipped', reason, required: field.required, field });

      // Never overwrite an answer that's already there (the person's, or one from an earlier pass).
      if (!isEmpty(field)) return { label, status: 'filled', value: valueOf(field), kept: true };

      const pattern = Filler.classify(field);
      if (field.kind === 'file') {
        if (pattern && pattern.key === 'coverLetterFile') return skip('Attach a cover letter file');
        const ok = await attachFile(field.node, context.resume);
        return ok ? { label, status: 'filled', value: context.resume.name } : skip('No resume saved in the extension');
      }

      // 1. Questions every form asks (referral source, worked here before, 18+, self-identification).
      const std = Answers().standardAnswer(label, profile);
      if (std) {
        const remembered = std.key.indexOf('eeo:') === 0 && context.recallKey ? await context.recallKey(std.key) : null;
        const out = await applyValue(field, remembered || std.value);
        if (out.ok) return { label, status: 'filled', value: out.value };
      }

      // 2. A required "I agree / I acknowledge" checkbox.
      if (field.kind === 'checkbox' && Answers().isConsent(label)) {
        if (!field.node.checked) clickLike(labelClickTarget(field.node));
        return { label, status: 'filled', value: 'checked' };
      }

      // 3. Profile fields.
      if (pattern && !pattern.file) {
        const value = pattern.generated ? await context.generate(pattern.generated, label) : resolveValue(pattern, profile);
        if (value !== undefined && value !== null && value !== '') {
          const out = await applyValue(field, String(value));
          if (out.ok) return { label, status: pattern.generated ? 'generated' : 'filled', value: out.value };
        }
      }

      // 4. What the person answered on an earlier form (same or similar wording).
      const remembered = context.recall ? await context.recall(label) : null;
      if (remembered) {
        const out = await applyValue(field, remembered);
        if (out.ok) return { label, status: 'filled', value: out.value, source: 'saved' };
      }

      // 5. AI, grounded in the profile; it replies NEEDS_HUMAN when the profile can't support an answer.
      if (label.length > 8 && field.kind !== 'checkbox' && context.answerQuestion) {
        const options = optionsOf(field);
        const answer = await context.answerQuestion(label, options.length ? options : null);
        if (answer) {
          const out = await applyValue(field, answer);
          if (out.ok) return { label, status: 'generated', value: out.value };
        }
      }
      return skip(pattern ? 'Nothing in your profile for this' : 'Needs your answer');
    },

    /* Fill a whole form. */
    async fillForm(scope, profile, context) {
      const fields = Filler.collectFields(scope);
      const report = { filled: [], skipped: [], generated: [], total: fields.length };

      for (const field of fields) {
        let result;
        try {
          result = await Filler.fill(field, profile, context);
        } catch (err) {
          result = { label: field.label, status: 'skipped', reason: err.message, required: field.required, field };
        }
        if (result.status === 'filled') report.filled.push(result);
        else if (result.status === 'generated') report.generated.push(result);
        else report.skipped.push(result);

        if (result.status !== 'filled' && result.status !== 'generated' && field.required) {
          markAttention(field.kind === 'radio' || field.kind === 'choice' ? (field.node.closest('fieldset') || field.node.parentElement) : field.node);
        }
        if (!result.kept) await sleep(30 + Math.random() * 70); // let the page's own handlers keep up
      }
      return report;
    },

    /* Read-only: required fields in the scope that are still empty. Never types, focuses, clicks or
       scrolls, so it's safe to call every second while the person is answering. */
    missingRequired(scope) {
      return Filler.collectFields(scope).filter((f) => f.required && isEmpty(f));
    },

    valueOf,
    isEmpty,
    comboboxValue,
    markAttention,
    clearAttention
  };

  /* ---------- writing values ---------- */

  async function applyValue(field, value) {
    const v = String(value);
    switch (field.kind) {
      case 'select': {
        const opts = Array.from(field.node.options);
        const labels = opts.map((o) => cleanText(o.textContent));
        const pick = Answers().pickOption(labels, v);
        const opt = pick ? opts[labels.indexOf(pick)] : opts.find((o) => o.value && normalize(o.value) === normalize(v));
        if (!opt || !opt.value) return { ok: false };
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        field.node.focus();
        if (setter && setter.set) setter.set.call(field.node, opt.value); else field.node.value = opt.value;
        field.node.dispatchEvent(new Event('input', { bubbles: true }));
        field.node.dispatchEvent(new Event('change', { bubbles: true }));
        field.node.blur();
        flash(field.node);
        return { ok: field.node.value === opt.value, value: cleanText(opt.textContent) };
      }
      case 'radio': {
        const labels = field.options.map((o) => cleanText(labelFor(o) || o.value));
        const pick = Answers().pickOption(labels, v);
        if (!pick) return { ok: false };
        const node = field.options[labels.indexOf(pick)];
        if (!node.checked) clickLike(labelClickTarget(node));
        if (!node.checked) { node.checked = true; node.dispatchEvent(new Event('change', { bubbles: true })); }
        return { ok: node.checked, value: pick };
      }
      case 'choice': {
        const labels = field.options.map((b) => cleanText(b.textContent));
        const pick = Answers().pickOption(labels, v);
        if (!pick) return { ok: false };
        clickLike(field.options[labels.indexOf(pick)]);
        await sleep(60);
        return { ok: true, value: pick };
      }
      case 'checkbox': {
        const want = /^(yes|true|1|on|checked|agree|i agree|accept)/i.test(v.trim());
        if (want !== field.node.checked) clickLike(labelClickTarget(field.node));
        return { ok: field.node.checked === want, value: want ? 'checked' : 'left unchecked' };
      }
      case 'combobox':
        return fillCombobox(field.node, v);
      default: {
        const node = field.node;
        if (node.maxLength > 0 && v.length > node.maxLength) return { ok: false };
        const out = node.type === 'number' ? v.replace(/[^\d.]/g, '') : v;
        setValue(node, out);
        return { ok: node.value === out, value: out };
      }
    }
  }

  /* Searchable dropdowns (react-select on Greenhouse job boards, ARIA listboxes): open the menu the way a
     person does, read every option before typing (typing the answer first can filter away the right option
     when the form words it differently), pick the one that means the answer, and read the choice back. */
  async function fillCombobox(input, value) {
    const labelsOf = (opts) => opts.map((o) => cleanText(o.textContent));
    openMenu(input);
    let options = await waitFor(() => menuOptions(input), 1500);
    let pick = options ? Answers().pickOption(labelsOf(options), value) : null;
    if (!pick) {
      // Long lists (countries, schools) and lists loaded as you type: filter by the answer's first words.
      setValue(input, value.split(/[,(]/)[0].trim().slice(0, 40), { keepFocus: true });
      await sleep(200);
      options = await waitFor(() => menuOptions(input), 2500);
      pick = options ? Answers().pickOption(labelsOf(options), value) : null;
    }
    if (!options || !pick) {
      if (input.value) setValue(input, '', { keepFocus: true });
      closeMenu(input);
      return { ok: false };
    }
    clickLike(options[labelsOf(options).indexOf(pick)]);
    await sleep(120);
    closeMenu(input);
    return { ok: true, value: comboboxValue(input) || pick };
  }

  function menuOptions(input) {
    const id = input.getAttribute('aria-controls') || input.getAttribute('aria-owns');
    const scope = (id && document.getElementById(id)) || document;
    const opts = Array.from(scope.querySelectorAll(OPTION_SELECTOR)).filter(
      (o) => isVisible(o) && !o.querySelector(OPTION_SELECTOR) && !/(^|_)(no-options|loading)/i.test(o.className) && cleanText(o.textContent)
    );
    return opts.length ? opts : null;
  }

  function openMenu(input) {
    const control = input.closest('[class*="control" i]') || input.parentElement;
    input.focus();
    [control, input].forEach((t) => t && t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
  }

  function closeMenu(input) {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    input.blur();
  }

  /* ---------- reading values ---------- */

  const SHOWN_VALUE = '[class*="single-value" i], [class*="singleValue" i], [class*="multi-value__label" i]';

  /* The value chosen in a searchable select: widgets like react-select show it in its own element and keep
     the input for search text, so typed-but-unchosen text isn't an answer. */
  function comboboxValue(input) {
    let node = input.parentElement;
    for (let i = 0; node && i < 5; i++, node = node.parentElement) {
      if (node.querySelectorAll('input:not([type=hidden]), select, textarea').length > 1) break;
      const shown = Array.from(node.querySelectorAll(SHOWN_VALUE)).map((e) => cleanText(e.textContent)).filter(Boolean);
      if (shown.length) return shown.join(', ');
      if (/select__control|select__container|(^|\s|_)(control|container)(\s|$|-)/i.test(node.className || '')) return '';
    }
    return input.value || '';
  }

  function valueOf(field) {
    const n = field.node;
    switch (field.kind) {
      case 'radio': {
        const c = field.options.find((o) => o.checked);
        return c ? cleanText(labelFor(c) || c.value) : '';
      }
      case 'choice': {
        const c = field.options.find((b) => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true' || b.getAttribute('data-state') === 'on' || /(^|[_\s-])(active|selected|checked)/i.test(b.className));
        return c ? cleanText(c.textContent) : '';
      }
      case 'checkbox': return n.checked ? 'Yes' : '';
      case 'select': {
        const o = n.selectedOptions && n.selectedOptions[0];
        return o && o.value && !/^(select|choose|please select|--)/i.test(cleanText(o.textContent)) ? cleanText(o.textContent) : '';
      }
      case 'combobox': return comboboxValue(n).trim();
      case 'file': return n.files && n.files.length ? n.files[0].name : '';
      default: return (n.value || '').trim();
    }
  }

  function isEmpty(field) {
    return !valueOf(field);
  }

  function optionsOf(field) {
    if (field.kind === 'select') return Array.from(field.node.options).map((o) => cleanText(o.textContent)).filter((t) => t && !/^(select|choose|please select|--)/i.test(t));
    if (field.kind === 'radio') return field.options.map((o) => cleanText(labelFor(o) || o.value));
    if (field.kind === 'choice') return field.options.map((b) => cleanText(b.textContent));
    return [];
  }

  /* ---------- value plumbing ---------- */

  function resolveValue(pattern, profile) {
    if (pattern.resolve) return pattern.resolve(profile, Profile);
    if (!pattern.path) return '';
    return pattern.path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), profile);
  }

  /* React and Vue both track values internally; assigning .value directly is
     silently discarded on re-render. Go through the native setter instead. */
  function setValue(node, value, opts) {
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
    if (!(opts && opts.keepFocus)) node.blur();
    flash(node);
  }

  function clickLike(node) {
    if (node.focus) node.focus();
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    node.click();
    flash(node);
  }

  /* A transparent styled radio/checkbox is clicked through its label, as a person would. */
  function labelClickTarget(input) {
    if (isVisible(input)) return input;
    const lbl = (input.id && document.querySelector(`label[for="${cssEscape(input.id)}"]`)) || input.closest('label');
    return lbl || input;
  }

  /* File inputs can't be assigned a path, but they can be handed a
     DataTransfer, which is how a real drop would arrive. */
  async function attachFile(input, resume) {
    if (!resume || !resume.dataUrl) return false;
    try {
      // Decode the data URL directly: fetch(data:) can be blocked by the page's Content-Security-Policy.
      const comma = resume.dataUrl.indexOf(',');
      const head = resume.dataUrl.slice(0, comma);
      const body = resume.dataUrl.slice(comma + 1);
      const mime = resume.mime || (head.match(/data:([^;]+)/) || [])[1] || 'application/pdf';
      const bytes = /;base64/.test(head)
        ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
        : new TextEncoder().encode(decodeURIComponent(body));
      const file = new File([bytes], resume.name || 'resume.pdf', { type: mime });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      flash(input);
      return input.files.length > 0;
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
      const candidates = Array.from(el.querySelectorAll('legend, label, [class*="question"], [class*="label"]'))
        .filter((q) => !q.contains(node) && !q.querySelector('input') && q.textContent.trim().length > 3);
      if (candidates.length) return candidates[0].textContent.trim();
    }
    return node.name || '';
  }

  function isRequired(node) {
    if (node.required || node.getAttribute('aria-required') === 'true') return true;
    return /\*|\(required\)/i.test(labelFor(node));
  }

  function isCombobox(node) {
    return node.tagName === 'INPUT' && (node.getAttribute('role') === 'combobox' || node.getAttribute('aria-autocomplete') === 'list');
  }

  function isVisible(node) {
    if (!node.getClientRects().length) return false;
    const style = getComputedStyle(node);
    return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  }

  function labelVisible(input) {
    const lbl = (input.id && document.querySelector(`label[for="${cssEscape(input.id)}"]`)) || input.closest('label');
    return !!lbl && isVisible(lbl);
  }

  function normalize(s) {
    return String(s || '')
      .replace(/\*/g, ' ')
      .replace(/\(required\)/gi, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function cssEscape(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/([^\w-])/g, '\\$1');
  }

  let highlight = true;

  function flash(node) {
    if (!highlight || !node.classList) return;
    node.classList.add('careeros-filled');
    setTimeout(() => node.classList.remove('careeros-filled'), 1400);
  }

  function markAttention(node) {
    if (!highlight || !node || !node.classList) return;
    node.classList.add('careeros-attention');
  }

  function clearAttention(scope) {
    (scope || document).querySelectorAll('.careeros-attention').forEach((n) => n.classList.remove('careeros-attention'));
  }

  Filler.setHighlight = function (on) { highlight = on !== false; };

  async function waitFor(fn, timeout) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(50);
    }
    return null;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  root.CareerOS.Filler = Filler;
})(typeof self !== 'undefined' ? self : this);
