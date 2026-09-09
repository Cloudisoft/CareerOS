/* CareerOS — match engine
 * Scores a posting against the profile before anything gets filled in.
 * Every score comes with the reasons behind it, so the person can disagree with it.
 */
(function (root) {
  'use strict';

  const WEIGHTS = { title: 30, skills: 30, experience: 20, location: 10, seniority: 10 };

  const SENIORITY_RANK = {
    intern: 0, trainee: 0, junior: 1, associate: 1, entry: 1,
    mid: 2, '': 2, senior: 3, staff: 4, lead: 4, principal: 5,
    manager: 4, head: 5, director: 6, vp: 7
  };

  const TITLE_SYNONYMS = {
    'software engineer': ['developer', 'sde', 'programmer', 'software developer', 'engineer'],
    'frontend': ['front end', 'front-end', 'ui engineer', 'react'],
    'backend': ['back end', 'back-end', 'server side', 'api engineer'],
    'fullstack': ['full stack', 'full-stack'],
    'data scientist': ['ml engineer', 'machine learning', 'data science'],
    'product manager': ['pm', 'product owner', 'apm'],
    'recruiter': ['talent acquisition', 'ta specialist', 'staffing specialist'],
    'business analyst': ['ba', 'systems analyst'],
    'devops': ['sre', 'site reliability', 'platform engineer', 'infrastructure'],
    'qa': ['quality assurance', 'test engineer', 'sdet', 'tester'],
    'designer': ['ux', 'ui designer', 'product designer']
  };

  const Matcher = {
    WEIGHTS,

    score(profile, posting) {
      const p = profile;
      const jdText = norm(`${posting.title} ${posting.description}`);
      const jdTitle = norm(posting.title);
      const reasons = [];
      const blockers = [];

      // Hard exclusions run first — a blocked posting never gets a score.
      const company = norm(posting.company);
      const excludedCo = (p.targeting.excludeCompanies || []).find((c) => c && company.includes(norm(c)));
      if (excludedCo) blockers.push(`${excludedCo} is on your skip list`);

      const excludedTitle = (p.targeting.excludeTitles || []).find((t) => t && jdTitle.includes(norm(t)));
      if (excludedTitle) blockers.push(`Title contains "${excludedTitle}", which you skip`);

      // Title fit
      const titleScore = scoreTitle(p.targeting.titles || [], jdTitle);
      if (titleScore.best) {
        reasons.push(`Title lines up with ${titleScore.best}`);
      } else {
        reasons.push('Title doesn\'t match any of your target roles');
      }

      // Skill coverage
      const skills = allSkills(p);
      const hit = skills.filter((s) => s && jdText.includes(norm(s)));
      const skillRatio = skills.length ? hit.length / Math.min(skills.length, 12) : 0;
      const skillScore = Math.min(1, skillRatio);
      if (hit.length) {
        reasons.push(`Mentions ${hit.slice(0, 5).join(', ')}${hit.length > 5 ? ` +${hit.length - 5} more` : ''}`);
      } else {
        reasons.push('None of your listed skills appear in the description');
      }

      // Years of experience
      const required = extractYears(jdText);
      let expScore = 1;
      if (required !== null) {
        const have = Number(p.experience.totalYears || 0);
        if (have >= required) {
          expScore = 1;
          reasons.push(`Asks for ${required}+ years, you have ${have}`);
        } else if (have >= required - 1) {
          expScore = 0.7;
          reasons.push(`Asks for ${required} years, you have ${have} — close`);
        } else {
          expScore = Math.max(0, have / required);
          reasons.push(`Asks for ${required} years, you have ${have}`);
        }
      }

      // Location and work mode
      const locScore = scoreLocation(p, jdText, reasons);

      // Seniority band
      const senScore = scoreSeniority(p, jdTitle, reasons);

      // Salary floor, when the posting states one
      const stated = extractSalary(jdText);
      if (stated && p.targeting.minSalary && stated.max < p.targeting.minSalary) {
        blockers.push(`Posted range tops out near ${stated.max.toLocaleString()}, under your floor`);
      }

      const total = Math.round(
        titleScore.value * WEIGHTS.title +
        skillScore * WEIGHTS.skills +
        expScore * WEIGHTS.experience +
        locScore * WEIGHTS.location +
        senScore * WEIGHTS.seniority
      );

      return {
        score: blockers.length ? 0 : total,
        blocked: blockers.length > 0,
        blockers,
        reasons,
        matchedSkills: hit,
        missingSkills: skills.filter((s) => !hit.includes(s)).slice(0, 8),
        requiredYears: required,
        breakdown: {
          title: Math.round(titleScore.value * WEIGHTS.title),
          skills: Math.round(skillScore * WEIGHTS.skills),
          experience: Math.round(expScore * WEIGHTS.experience),
          location: Math.round(locScore * WEIGHTS.location),
          seniority: Math.round(senScore * WEIGHTS.seniority)
        }
      };
    },

    verdict(score, threshold) {
      if (score >= Math.max(85, threshold)) return { label: 'Strong match', tone: 'strong' };
      if (score >= threshold) return { label: 'Worth applying', tone: 'good' };
      if (score >= threshold - 20) return { label: 'Stretch', tone: 'weak' };
      return { label: 'Skip', tone: 'skip' };
    }
  };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ');
  }

  function allSkills(p) {
    const s = p.skills || {};
    return [...(s.core || []), ...(s.familiar || []), ...(s.tools || [])].filter(Boolean);
  }

  function scoreTitle(targets, jdTitle) {
    let best = null;
    let value = 0;
    targets.forEach((t) => {
      const target = norm(t);
      if (!target) return;
      let v = 0;
      if (jdTitle.includes(target)) {
        v = 1;
      } else {
        const targetWords = target.split(' ').filter((w) => w.length > 2);
        const overlap = targetWords.filter((w) => jdTitle.includes(w)).length;
        v = targetWords.length ? (overlap / targetWords.length) * 0.8 : 0;
        Object.keys(TITLE_SYNONYMS).forEach((k) => {
          if (target.includes(k) && TITLE_SYNONYMS[k].some((syn) => jdTitle.includes(syn))) {
            v = Math.max(v, 0.85);
          }
        });
      }
      if (v > value) { value = v; best = t; }
    });
    return { value, best: value >= 0.5 ? best : null };
  }

  function extractYears(text) {
    const m = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b[^.]{0,30}experience/);
    if (m) return parseInt(m[1], 10);
    const m2 = text.match(/experience[^.]{0,30}?(\d{1,2})\s*\+?\s*(?:years?|yrs?)/);
    return m2 ? parseInt(m2[1], 10) : null;
  }

  function extractSalary(text) {
    const m = text.match(/[$₹£€]\s?(\d{2,3}(?:,\d{3})+|\d{2,3}k)\s*(?:-|to|–)\s*[$₹£€]?\s?(\d{2,3}(?:,\d{3})+|\d{2,3}k)/i);
    if (!m) return null;
    const toNum = (v) => v.toLowerCase().endsWith('k')
      ? parseInt(v, 10) * 1000
      : parseInt(v.replace(/,/g, ''), 10);
    return { min: toNum(m[1]), max: toNum(m[2]) };
  }

  function scoreLocation(p, jdText, reasons) {
    const modes = p.targeting.workModes || [];
    const wantsRemote = modes.includes('remote');
    const jdRemote = /\bremote\b|\bwork from home\b|\bdistributed\b/.test(jdText);
    const jdOnsite = /\bon-?site\b|\bin-?office\b|\bhybrid\b/.test(jdText);

    if (wantsRemote && jdRemote) { reasons.push('Posting says remote'); return 1; }
    const locs = [...(p.targeting.locations || []), p.identity.city].filter(Boolean);
    const hit = locs.find((l) => jdText.includes(norm(l)));
    if (hit) { reasons.push(`Based in ${hit}`); return 1; }
    if (wantsRemote && jdOnsite && !jdRemote) { reasons.push('Looks onsite, you want remote'); return 0.2; }
    return 0.6;
  }

  function scoreSeniority(p, jdTitle, reasons) {
    const mine = SENIORITY_RANK[norm(p.targeting.seniority)] ?? 2;
    let theirs = 2;
    Object.keys(SENIORITY_RANK).forEach((k) => {
      if (k && jdTitle.includes(k)) theirs = Math.max(theirs, SENIORITY_RANK[k]);
    });
    const gap = Math.abs(mine - theirs);
    if (gap === 0) return 1;
    if (gap === 1) return 0.75;
    if (gap === 2) { reasons.push('Seniority is a stretch either way'); return 0.4; }
    reasons.push('Seniority band is well off yours');
    return 0.1;
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Matcher = Matcher;
})(typeof self !== 'undefined' ? self : this);
