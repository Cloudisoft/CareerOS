/* CareerOS — candidate profile
 * The single source of truth every filled field is derived from.
 */
(function (root) {
  'use strict';

  const EMPTY_PROFILE = {
    identity: {
      firstName: '',
      lastName: '',
      preferredName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      addressLine1: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    targeting: {
      titles: [],            // roles the person actually wants
      excludeTitles: [],     // roles to never apply to
      excludeCompanies: [],
      seniority: '',         // intern | junior | mid | senior | lead | director
      workModes: [],         // remote | hybrid | onsite
      locations: [],
      minSalary: 0,
      salaryCurrency: 'USD',
      salaryPeriod: 'year'
    },
    experience: {
      totalYears: 0,
      currentTitle: '',
      currentCompany: '',
      noticePeriod: '',
      history: []            // { title, company, start, end, location, bullets: [] }
    },
    skills: {
      core: [],              // things the person is strong at
      familiar: [],          // things they can claim but not lead with
      tools: [],
      languages: []          // spoken languages
    },
    education: [],           // { degree, field, school, year, gpa }
    certifications: [],
    strengths: [],           // qualities: "turns ambiguous briefs into shipped scope"
    workAuth: {
      authorizedIn: [],      // ["US", "IN"]
      needsSponsorship: false,
      requiresVisa: '',
      willingToRelocate: false
    },
    voluntary: {
      gender: 'Decline to self identify',
      race: 'Decline to self identify',
      veteran: 'I don\'t wish to answer',
      disability: 'I don\'t wish to answer'
    },
    narrative: {
      summary: '',           // 2–3 sentences, used as the base for tailored letters
      whyLeaving: '',
      availableFrom: ''
    }
  };

  const Profile = {
    EMPTY_PROFILE,

    blank() {
      return JSON.parse(JSON.stringify(EMPTY_PROFILE));
    },

    /* Merge a stored profile over the schema so a profile saved by an older
       version never breaks a newer field lookup. */
    hydrate(stored) {
      const base = Profile.blank();
      if (!stored) return base;
      return deepMerge(base, stored);
    },

    fullName(p) {
      const i = p.identity || {};
      return [i.firstName, i.lastName].filter(Boolean).join(' ').trim();
    },

    locationLine(p) {
      const i = p.identity || {};
      return [i.city, i.state, i.country].filter(Boolean).join(', ');
    },

    allSkills(p) {
      const s = p.skills || {};
      return [...(s.core || []), ...(s.familiar || []), ...(s.tools || [])];
    },

    isReady(p) {
      if (!p) return false;
      const i = p.identity || {};
      return Boolean(i.firstName && i.lastName && i.email && i.phone);
    },

    /* What's still missing, phrased as the thing to go do. */
    gaps(p) {
      const out = [];
      const i = (p && p.identity) || {};
      if (!i.firstName || !i.lastName) out.push('Add your name');
      if (!i.email) out.push('Add an email');
      if (!i.phone) out.push('Add a phone number');
      if (!p || !(p.targeting.titles || []).length) out.push('Add at least one target role');
      if (!p || !(p.skills.core || []).length) out.push('Add your core skills');
      if (!p || !p.narrative.summary) out.push('Write a short summary');
      return out;
    }
  };

  function deepMerge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over || {}).forEach((k) => {
      const v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k] || {}, v);
      } else if (v !== undefined && v !== null && v !== '') {
        out[k] = v;
      }
    });
    return out;
  }

  root.CareerOS = root.CareerOS || {};
  root.CareerOS.Profile = Profile;
})(typeof self !== 'undefined' ? self : this);
