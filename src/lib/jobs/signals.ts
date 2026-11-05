/**
 * Plain-rule readings of a job description: visa sponsorship, work
 * authorization and the years of experience asked for. No AI call, so they
 * are instant and free to show on every job.
 *
 * The vocabulary and the "lowest required floor" rule follow career-ops
 * (github.com/career-ops-hq/career-ops, MIT): its visa filter in scan.mjs and
 * jd-years.mjs. As there, an unclear posting is labelled "not stated" rather
 * than guessed, because a wrong "no" hides a job the person could get.
 */

export const VISA_POSITIVE = [
  "visa sponsorship",
  "sponsor a visa",
  "sponsor visas",
  "will sponsor",
  "sponsorship available",
  "sponsorship is available",
  "eligible for sponsorship",
  "provide sponsorship",
  "offer sponsorship",
  "immigration support",
  "h-1b",
  "h1b",
  "o-1 visa",
  "opt/cpt",
  "cpt/opt",
  "stem opt",
  // UK
  "skilled worker visa",
  "skilled worker sponsorship",
  "certificate of sponsorship",
  "tier 2 sponsorship",
  // Australia / New Zealand
  "482 visa",
  "subclass 482",
  "tss visa",
  "employer sponsored visa",
  "accredited employer work visa",
  "aewv",
  // Canada
  "lmia",
  "work permit sponsorship",
  "work permit support",
  // UAE / Gulf
  "employment visa provided",
  "visa will be provided",
  "visa provided",
  "visa and relocation",
  // EU / EMEA
  "eu blue card",
  "blue card",
  "relocation and visa",
];

export const VISA_NEGATIVE = [
  "no visa sponsorship",
  "no sponsorship",
  "without sponsorship",
  "unable to sponsor",
  "not able to sponsor",
  "cannot sponsor",
  "can not sponsor",
  "do not sponsor",
  "does not sponsor",
  "will not sponsor",
  "won't sponsor",
  "not offer sponsorship",
  "not provide sponsorship",
  "sponsorship is not available",
  "sponsorship not available",
  "not offer visa sponsorship",
  "citizens and permanent residents only",
  "permanent residents only",
];

/** Wording that ties a role to a country's right to work, by region. */
export const AUTH_BY_REGION: Record<WorkRegion, string[]> = {
  US: ["authorized to work in the united states", "authorized to work in the us", "authorized to work in the u.s", "u.s. citizen", "us citizen", "u.s. citizenship", "us citizenship", "green card", "security clearance"],
  UK: ["right to work in the uk", "right to work in the united kingdom", "eligible to work in the uk", "uk work permit"],
  AU: ["right to work in australia", "full working rights in australia", "australian citizen", "australian permanent resident", "australian work rights"],
  NZ: ["right to work in new zealand", "nz citizen", "new zealand citizen", "new zealand resident"],
  CA: ["legally eligible to work in canada", "authorized to work in canada", "canadian citizen", "canadian permanent resident"],
  IN: ["indian national", "eligible to work in india"],
  AE: ["uae national", "emirati", "eligible to work in the uae", "valid uae visa", "uae residence visa"],
  EU: ["right to work in the eu", "eu citizen", "eligible to work in the eu", "eu work permit", "eea citizen"],
};

export type WorkRegion = "US" | "UK" | "AU" | "NZ" | "CA" | "IN" | "AE" | "EU";

export const REGION_NAMES: Record<WorkRegion, string> = {
  US: "the US",
  UK: "the UK",
  AU: "Australia",
  NZ: "New Zealand",
  CA: "Canada",
  IN: "India",
  AE: "the UAE",
  EU: "the EU",
};

/** Roles restricted to citizens / permanent residents (as opposed to any valid work right). */
export const CITIZENS_ONLY = [
  "citizens and permanent residents only",
  "permanent residents only",
  "must be a us citizen",
  "must be a u.s. citizen",
  "us citizenship required",
  "u.s. citizenship required",
  "security clearance",
  "uae nationals only",
  "emirati nationals",
  "australian citizens only",
  "british citizens only",
];

/** Roles that say they welcome students on OPT / CPT (or similar student work rights). */
export const STUDENT_FRIENDLY = ["opt/cpt", "cpt/opt", "stem opt", " opt ", "opt.", "opt,", "cpt", "f-1", "f1 visa", "student visa", "graduate visa", "post-study work"];

export type VisaSignal = "SPONSORS" | "NO_SPONSORSHIP" | "NOT_STATED";

function lower(text: string | null | undefined) {
  return (text ?? "").toLowerCase().replace(/[‘’]/g, "'");
}

/** An explicit refusal wins over a mention: "no visa sponsorship" contains "visa sponsorship". */
export function visaSignal(description: string | null | undefined): VisaSignal {
  const text = lower(description);
  if (VISA_NEGATIVE.some((k) => text.includes(k))) return "NO_SPONSORSHIP";
  if (VISA_POSITIVE.some((k) => text.includes(k))) return "SPONSORS";
  return "NOT_STATED";
}

/** The countries whose right to work the posting asks for (empty when it doesn't say). */
export function workAuthorizationRegions(description: string | null | undefined): WorkRegion[] {
  const text = lower(description);
  return (Object.keys(AUTH_BY_REGION) as WorkRegion[]).filter((r) => AUTH_BY_REGION[r].some((k) => text.includes(k)));
}

export function requiresWorkAuthorization(description: string | null | undefined) {
  return workAuthorizationRegions(description).length > 0 || lower(description).includes("legally authorized to work");
}

export function citizensOnly(description: string | null | undefined) {
  const text = lower(description);
  return CITIZENS_ONLY.some((k) => text.includes(k));
}

export function studentFriendly(description: string | null | undefined) {
  const text = ` ${lower(description)} `;
  return STUDENT_FRIENDLY.some((k) => text.includes(k));
}

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15 };
const NUM = "(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen)";
// "3+ years", "3-5 years", "at least 3 years", "minimum of three (3) years", "3 or more years"
const YEARS_RE = new RegExp(
  `(?:at least|minimum(?: of)?|min\\.?|over)?\\s*${NUM}(?:\\s*\\(\\d{1,2}\\))?\\s*(?:\\+|plus|or more)?\\s*(?:(?:-|–|to)\\s*${NUM}\\s*)?\\+?\\s*(?:years?|yrs?)\\b(?:'|’)?\\s*(?:of\\s+)?(?:[a-z/&,-]+\\s+){0,4}?(experience|exp\\b|working|work)`,
  "gi"
);
const PREFERRED = /(preferred|nice to have|a plus|bonus|ideally)/i;
const NOT_EXPERIENCE = /(degree|old|of age|vesting|warranty|contract|in business|company|founded|history)/i;

function toNumber(raw: string) {
  return /^\d+$/.test(raw) ? Number(raw) : WORDS[raw.toLowerCase()] ?? NaN;
}

/**
 * The years of experience the posting requires: the lowest required floor
 * stated (the most lenient honest reading), 0 when it says none is needed,
 * or null when it doesn't say.
 */
export function requiredYears(description: string | null | undefined): number | null {
  const text = lower(description);
  if (!text) return null;
  if (/(no (prior |previous )?experience (is )?(required|necessary|needed)|no experience\b|entry[- ]level|new grad|recent graduates?)/.test(text)) return 0;
  const floors: number[] = [];
  for (const sentence of text.split(/(?<=[.!?;\n])\s+/)) {
    if (PREFERRED.test(sentence) || NOT_EXPERIENCE.test(sentence.replace(/years? of (?:professional |relevant |work )?experience/g, ""))) continue;
    YEARS_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = YEARS_RE.exec(sentence))) {
      const n = toNumber(m[1]);
      if (Number.isFinite(n) && n >= 0 && n <= 30) floors.push(n);
    }
  }
  return floors.length ? Math.min(...floors) : null;
}

/** Days until an expiring posting closes, when that is within a week. */
export function closingInDays(expiresAt: Date | string | null | undefined, now = Date.now()) {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - now) / 86_400_000);
  return days >= 0 && days <= 7 ? days : null;
}
