/* CareerOS — answers by meaning
 *
 * Forms word the same answer a dozen ways: "No" is "I am not a protected veteran" on one form and
 * "No, I don't have a disability" on the next; "prefer not to say" is "Decline To Self Identify" or
 * "I don't wish to answer". This picks the option that means the answer, and recognises the common
 * questions every form asks so they never stop a run. Pure functions, no DOM: shared by the filler,
 * the page agent and the tests.
 */
(function (root) {
  'use strict';

  const DECLINE = /decline|prefer not|don.?t wish|do not wish|choose not|rather not|not (to )?(answer|disclose|say|specify|self.?identify)|i don.?t want|do not want to answer/i;
  const NEGATIVE = /\b(no|not|don'?t|do not|never|none|neither)\b/i;
  const YES_WORDS = ['yes', 'y', 'true', 'i am', 'i do', 'i will', 'i have', 'authorized', 'authorised'];
  const NO_WORDS = ['no', 'n', 'false', 'i am not', 'i do not', 'i will not', 'i have not', 'not authorized'];
  const PLACEHOLDER = /^(select|choose|please select|--|—)/i;

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function letters(s) {
    return norm(s).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* Character-bigram similarity, 0–1. */
  function similarity(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const grams = (s) => {
      const m = new Map();
      for (let i = 0; i < s.length - 1; i++) {
        const g = s.slice(i, i + 2);
        m.set(g, (m.get(g) || 0) + 1);
      }
      return m;
    };
    const ga = grams(a);
    const gb = grams(b);
    let both = 0;
    ga.forEach((n, g) => { both += Math.min(n, gb.get(g) || 0); });
    return (2 * both) / (a.length - 1 + b.length - 1);
  }

  function pickBoolean(options, yes) {
    const wanted = yes ? YES_WORDS : NO_WORDS;
    const other = yes ? NO_WORDS : YES_WORDS;
    for (const o of options) {
      if (wanted.indexOf(letters(o)) !== -1) return o;
    }
    for (const o of options) {
      const n = letters(o);
      const startsWanted = wanted.some((w) => n === w || n.indexOf(w + ' ') === 0);
      const startsOther = other.some((w) => n === w || n.indexOf(w + ' ') === 0);
      if (startsWanted && !startsOther) return o;
    }
    return null;
  }

  /* The option (from `options`, as shown on the form) that means `value`, or null when unsure. */
  function pickOption(options, value) {
    const opts = (options || []).filter((o) => String(o || '').trim() && !PLACEHOLDER.test(String(o).trim()));
    const v = letters(value).replace(/[.!]+$/, '');
    if (!opts.length || !v) return null;

    // 1. Same text, or nearly.
    let best = null;
    for (const o of opts) {
      const n = letters(o);
      let c = similarity(n, v);
      if (n === v) c = 1;
      else if (n.replace(/ /g, '') === v.replace(/ /g, '')) c = 0.98;
      else if (v.length >= 4 && (n.indexOf(v) === 0 || v.indexOf(n) === 0)) c = Math.max(c, 0.88);
      if (!best || c > best.c) best = { o, c };
    }
    if (best && best.c >= 0.82) return best.o;

    // 2. Any "prefer not to say" wording -> this form's decline option.
    if (DECLINE.test(String(value))) {
      const d = opts.find((o) => DECLINE.test(o));
      if (d) return d;
    }

    // 3. Yes / No -> "Yes, I am…" / "I am not a protected veteran".
    const yn = /^(yes|y|true)\b/.test(v) ? true : /^(no|n|false)\b/.test(v) ? false : null;
    if (yn !== null) {
      const b = pickBoolean(opts, yn);
      if (b) return b;
      const fits = opts.filter((o) => !DECLINE.test(o) && (yn ? !NEGATIVE.test(o) : NEGATIVE.test(o)));
      if (fits.length === 1) return fits[0];
    }

    // 4. Male/Man, Female/Woman.
    const gender = { male: /^(man|male)\b/i, man: /^(man|male)\b/i, female: /^(woman|female)\b/i, woman: /^(woman|female)\b/i }[v];
    if (gender) {
      const g = opts.find((o) => gender.test(String(o).trim()));
      if (g) return g;
    }

    // 5. "How did you hear": Google -> search engine -> social media -> LinkedIn -> job board -> Other.
    if (/google|search engine/.test(v)) {
      const chain = [/google/i, /search engine|internet search|web search|\bsearch\b/i, /social media|social network/i, /linkedin/i, /job board|job site|online|internet|website/i, /^other\b/i];
      for (const re of chain) {
        const hit = opts.find((o) => re.test(o));
        if (hit) return hit;
      }
    }

    // 6. A short answer that appears as a whole word in exactly one option ("Asian" -> "Asian (Not Hispanic…)").
    if (v.length >= 3) {
      const re = new RegExp('(^|[^a-z0-9])' + escapeRe(v) + '($|[^a-z0-9])');
      const hits = opts.filter((o) => re.test(letters(o)));
      if (hits.length === 1) return hits[0];
      // Places typed into a search box ("Austin" -> "Austin, Texas, United States"): the first suggestion
      // that starts with it, as a person would pick.
      const starts = opts.find((o) => letters(o).indexOf(v + ' ') === 0 || letters(o) === v);
      if (starts) return starts;
    }

    // 7. The same idea worded differently: the one option sharing the most word stems with the answer, covering
    //    at least half of them ("Referral" -> "Someone referred me", "Company website" -> "The company careers
    //    site"). A tie means it can't tell, so nothing is picked.
    const stems = (s) => letters(s).split(' ').filter((w) => w.length >= 4 && !/^(some|other|have|with|that|this|from|your|been|were|about)$/.test(w)).map((w) => w.slice(0, 5));
    const want = Array.from(new Set(stems(value)));
    if (want.length) {
      const scored = opts.map((o) => ({ o, n: want.filter((w) => stems(o).indexOf(w) !== -1).length })).sort((a, b) => b.n - a.n);
      if (scored[0].n > 0 && scored[0].n * 2 >= want.length && (!scored[1] || scored[1].n < scored[0].n)) return scored[0].o;
    }
    return null;
  }

  /* Questions every application asks, answered without AI so they never stop a run.
     Returns { value, key } or null. `key` names a self-identification answer the person may have given. */
  function standardAnswer(label, profile) {
    const q = norm(label);
    const p = profile || {};
    const v = p.voluntary || {};
    const history = ((p.experience || {}).history || []).map((h) => norm(h.company)).filter((c) => c.length > 2);

    if (/how did you (\w+ ){0,2}(hear|find|learn|come across)|where did you (\w+ )?(hear|find|see)|referr(al|ed) source|^source\b|how were you referred/.test(q)) {
      return { value: v.referralSource || 'Google', key: 'referral' };
    }
    // "Have you ever worked for <Company>?" -> No, unless that company is in the work history.
    if (/(have|did) you (ever )?(previously )?(work(ed)? (for|at) (?!a |an |any )|been employed (by|at|with) (?!a |an |any )|been an employee of)|former (employee|intern|contractor) of|previously (been )?employed (by|at)|(are|were) you (a )?(current or )?(former|previous) (employee|contractor)/.test(q)) {
      return { value: history.some((c) => q.indexOf(c) !== -1) ? 'Yes' : 'No', key: 'priorEmployment' };
    }
    if (/(at least|over|older than) (the age of )?18|\b18\s*(\+|years( of age)?( or older)?|or (older|over))|of legal (working )?age/.test(q)) {
      return { value: 'Yes', key: 'over18' };
    }
    if (/hispanic|latin[oa]/.test(q)) return { value: v.hispanic || 'Prefer not to say', key: 'eeo:hispanic' };
    if (/\btransgender\b/.test(q)) return { value: v.transgender || 'Prefer not to say', key: 'eeo:transgender' };
    if (/sexual orientation/.test(q)) return { value: v.sexualOrientation || 'Prefer not to say', key: 'eeo:orientation' };
    if (/\bpronoun/.test(q)) return { value: v.pronouns || 'Prefer not to say', key: 'eeo:pronouns' };
    if (/\bgender\b|\bsex\b/.test(q)) return { value: v.gender || 'Prefer not to say', key: 'eeo:gender' };
    if (/\brace\b|racial|ethnic/.test(q)) return { value: v.race || 'Prefer not to say', key: 'eeo:race' };
    if (/veteran|armed forces|military service/.test(q)) return { value: v.veteran || 'Prefer not to say', key: 'eeo:veteran' };
    if (/disabilit/.test(q)) return { value: v.disability || 'Prefer not to say', key: 'eeo:disability' };
    return null;
  }

  /* A required "I agree / I acknowledge / I certify" box. Ticking it is the person's standing consent. */
  function isConsent(label) {
    return /\b(i (agree|acknowledge|accept|consent|certify|confirm|understand|have read)|privacy (notice|policy)|terms (and|&) conditions|acknowledg|attest)\b/i.test(String(label || ''));
  }

  /* The key and meaning to remember for a self-identification answer the person gave, so a differently
     worded question on the next form gets the same answer. */
  function meaningOf(label, answer) {
    const std = standardAnswer(label, {});
    if (!std || std.key.indexOf('eeo:') !== 0) return null;
    const a = String(answer || '').trim();
    if (!a) return null;
    if (DECLINE.test(a)) return { key: std.key, value: 'Prefer not to say' };
    if (std.key === 'eeo:veteran' || std.key === 'eeo:disability' || std.key === 'eeo:hispanic' || std.key === 'eeo:transgender') {
      return { key: std.key, value: NEGATIVE.test(a) ? 'No' : 'Yes' };
    }
    return { key: std.key, value: a.slice(0, 120) };
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Answers = { pickOption, pickBoolean, standardAnswer, isConsent, meaningOf, DECLINE };
})(typeof self !== 'undefined' ? self : this);
