import "server-only";

/**
 * Career OS matching engine.
 *
 * Produces a 0-100 score from five weighted sub-scores, each computed from
 * real profile/job data — nothing here is randomized or hardcoded:
 *
 *   Skills match     40%  — required job skills the candidate actually has
 *   Title alignment   20%  — job title vs. the candidate's current/desired/
 *                            target titles, plus career-level distance
 *   Experience fit    15%  — years of experience vs. the range expected for
 *                            the job's career level
 *   Location fit      15%  — workplace type + desired-location overlap
 *   Salary fit        10%  — overlap between desired and posted ranges
 */

const WEIGHTS = { skills: 0.4, title: 0.2, experience: 0.15, location: 0.15, salary: 0.1 };

const LEVEL_ORDER = ["ENTRY", "ASSOCIATE", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "EXECUTIVE"] as const;
type Level = (typeof LEVEL_ORDER)[number];

const EXPERIENCE_RANGE_BY_LEVEL: Record<Level, [number, number]> = {
  ENTRY: [0, 2],
  ASSOCIATE: [1, 3],
  MID: [2, 5],
  SENIOR: [5, 8],
  LEAD: [7, 10],
  MANAGER: [6, 12],
  DIRECTOR: [10, 18],
  EXECUTIVE: [15, 30],
};

const STOPWORDS = new Set(["a", "an", "the", "of", "and", "for", "to", "in", "on", "at"]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

function tokenOverlapScore(a: string, b: string) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  Array.from(setA).forEach((t) => {
    if (setB.has(t)) shared += 1;
  });
  return Math.round((shared / Math.min(setA.size, setB.size)) * 100);
}

export interface MatchProfileInput {
  currentTitle: string | null;
  desiredTitles: string[];
  targetTitles: string[];
  totalExperienceYears: number | null;
  careerLevel: Level | null;
  workplaceTypes: string[];
  desiredLocations: string[];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  skillNames: string[]; // lowercase-normalized by caller not required; we normalize here
}

export interface MatchJobInput {
  title: string;
  location: string | null;
  workplaceType: string;
  careerLevel: Level | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkillNames: string[];
  allSkillNames: string[];
}

export interface MatchResult {
  score: number;
  skillsScore: number;
  titleScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  gaps: string[];
}

function scoreSkills(profile: MatchProfileInput, job: MatchJobInput) {
  const profileSkills = new Set(profile.skillNames.map((s) => s.toLowerCase()));
  const targetSkills = (job.requiredSkillNames.length ? job.requiredSkillNames : job.allSkillNames).map((s) =>
    s.toLowerCase()
  );

  if (targetSkills.length === 0) {
    return { score: 70, matched: [] as string[], missing: [] as string[] };
  }

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of targetSkills) {
    if (profileSkills.has(skill)) matched.push(skill);
    else missing.push(skill);
  }

  return { score: Math.round((matched.length / targetSkills.length) * 100), matched, missing };
}

function scoreTitle(profile: MatchProfileInput, job: MatchJobInput) {
  const candidates = [profile.currentTitle, ...profile.desiredTitles, ...profile.targetTitles].filter(
    (t): t is string => Boolean(t)
  );
  const overlap = candidates.length
    ? Math.max(...candidates.map((t) => tokenOverlapScore(t, job.title)))
    : 0;

  let levelScore = 60; // neutral when we can't compare levels
  if (profile.careerLevel && job.careerLevel) {
    const distance = Math.abs(LEVEL_ORDER.indexOf(profile.careerLevel) - LEVEL_ORDER.indexOf(job.careerLevel));
    levelScore = Math.max(0, 100 - distance * 30);
  }

  return Math.round(overlap * 0.6 + levelScore * 0.4);
}

function scoreExperience(profile: MatchProfileInput, job: MatchJobInput) {
  if (profile.totalExperienceYears == null || !job.careerLevel) return 65;
  const [min, max] = EXPERIENCE_RANGE_BY_LEVEL[job.careerLevel];
  const years = profile.totalExperienceYears;
  if (years >= min && years <= max) return 100;
  const distance = years < min ? min - years : years - max;
  const penalty = years < min ? distance * 20 : distance * 10; // overqualified penalized less
  return Math.max(0, Math.round(100 - penalty));
}

function scoreLocation(profile: MatchProfileInput, job: MatchJobInput) {
  const wantsRemote = profile.workplaceTypes.includes("REMOTE");
  const workplaceMatch = profile.workplaceTypes.length === 0 || profile.workplaceTypes.includes(job.workplaceType);
  const locationMatch =
    profile.desiredLocations.length === 0 ||
    (job.location != null &&
      profile.desiredLocations.some((loc) => job.location!.toLowerCase().includes(loc.toLowerCase())));

  if (job.workplaceType === "REMOTE" && wantsRemote) return 100;
  if (workplaceMatch && locationMatch) return 100;
  if (workplaceMatch || locationMatch) return 65;
  return 30;
}

function scoreSalary(profile: MatchProfileInput, job: MatchJobInput) {
  if (profile.desiredSalaryMin == null && profile.desiredSalaryMax == null) return 70;
  if (job.salaryMin == null && job.salaryMax == null) return 60;

  const wantMin = profile.desiredSalaryMin ?? 0;
  const wantMax = profile.desiredSalaryMax ?? Infinity;
  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? Infinity;

  const overlapStart = Math.max(wantMin, jobMin);
  const overlapEnd = Math.min(wantMax, jobMax);
  if (overlapEnd >= overlapStart) return 100;

  // No overlap: score decays with how far apart the ranges are, relative to what was asked for.
  const gap = overlapStart - overlapEnd;
  const scale = Math.max(wantMin, 1);
  return Math.max(0, Math.round(100 - (gap / scale) * 100));
}

export function computeMatch(profile: MatchProfileInput, job: MatchJobInput): MatchResult {
  const skills = scoreSkills(profile, job);
  const titleScore = scoreTitle(profile, job);
  const experienceScore = scoreExperience(profile, job);
  const locationScore = scoreLocation(profile, job);
  const salaryScore = scoreSalary(profile, job);

  const score = Math.round(
    skills.score * WEIGHTS.skills +
      titleScore * WEIGHTS.title +
      experienceScore * WEIGHTS.experience +
      locationScore * WEIGHTS.location +
      salaryScore * WEIGHTS.salary
  );

  const reasons: string[] = [];
  const gaps: string[] = [];

  if (skills.matched.length) reasons.push(`You have ${skills.matched.length} of the skills this role is looking for`);
  if (skills.missing.length) gaps.push(`Missing: ${skills.missing.slice(0, 4).join(", ")}`);
  if (titleScore >= 70) reasons.push("Your title and level closely match this role");
  else if (titleScore < 40) gaps.push("This role's title/level differs from your background");
  if (experienceScore >= 85) reasons.push("Your years of experience fit this role well");
  else if (experienceScore < 50) gaps.push("Your experience level may not match what's expected");
  if (locationScore >= 85) reasons.push("Location and work style match your preferences");
  else if (locationScore < 50) gaps.push("Location or work style may not match your preferences");
  if (salaryScore >= 85) reasons.push("Salary range overlaps your expectations");
  else if (salaryScore < 50) gaps.push("Salary range may not meet your expectations");

  return {
    score,
    skillsScore: skills.score,
    titleScore,
    experienceScore,
    locationScore,
    salaryScore,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
    reasons,
    gaps,
  };
}
