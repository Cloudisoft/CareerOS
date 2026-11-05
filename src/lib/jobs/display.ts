/** Small, shared labels for job cards and detail panes. */

export function workplaceLabel(type: string) {
  return type === "REMOTE" ? "Remote" : type === "HYBRID" ? "Hybrid" : "On-site";
}

const EMPLOYMENT: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};
export function employmentLabel(type: string) {
  return EMPLOYMENT[type] ?? type;
}

const LEVEL: Record<string, string> = {
  ENTRY: "Entry level",
  ASSOCIATE: "Associate",
  MID: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
  DIRECTOR: "Director",
  EXECUTIVE: "Executive",
};
export function careerLevelLabel(level: string | null | undefined) {
  return level ? LEVEL[level] ?? level : null;
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

const SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", INR: "₹", AUD: "A$", CAD: "C$", NZD: "NZ$", AED: "AED ", SGD: "S$", JPY: "¥" };

/** "$60–70K/yr", "$45/hr" style pay, or null when the posting has none. */
export function payLabel(min: number | null, max: number | null, currency = "USD") {
  if (!min && !max) return null;
  const sym = SYMBOLS[currency] ?? `${currency} `;
  const hi = max ?? min!;
  const hourly = hi < 1000;
  const unit = hourly ? "/hr" : "/yr";
  if (min && max && min !== max) {
    if (hourly) return `${sym}${min}–${max}${unit}`;
    const lo = compact(min);
    const hi2 = compact(max);
    // "$60–70K/yr" when both share a unit, otherwise "$900K–1.2M/yr".
    const sameUnit = lo.slice(-1) === hi2.slice(-1) && /[KM]/.test(lo.slice(-1));
    return `${sym}${sameUnit ? lo.slice(0, -1) : lo}–${hi2}${unit}`;
  }
  return `${sym}${compact(hi)}${unit}`;
}

/** "New" for under three days, otherwise "5d ago" / "2w ago". */
export function postedLabel(date: string | Date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days < 3) return "New";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
