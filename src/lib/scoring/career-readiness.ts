import "server-only";
import { prisma } from "@/lib/prisma";

interface ChecklistItem {
  met: boolean;
  weight: number;
}

function weightedPercent(items: ChecklistItem[]) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  const achieved = items.reduce((sum, i) => sum + (i.met ? i.weight : 0), 0);
  return total === 0 ? 0 : Math.round((achieved / total) * 100);
}

/** Career Profile completeness — identity, professional, preferences, work auth, goals. */
function computeProfileScore(
  profile: {
    location: string | null;
    headline: string | null;
    bio: string | null;
    currentTitle: string | null;
    currentCompany: string | null;
    totalExperienceYears: number | null;
    careerLevel: string | null;
    industry: string | null;
    desiredTitles: string[];
    desiredLocations: string[];
    workplaceTypes: string[];
    employmentTypes: string[];
    desiredSalaryMin: number | null;
    desiredSalaryMax: number | null;
    workAuthorization: string | null;
    targetTitles: string[];
    careerGoals: string | null;
  },
  experienceCount: number,
  educationCount: number
) {
  return weightedPercent([
    { met: !!profile.location, weight: 5 },
    { met: !!profile.headline, weight: 5 },
    { met: !!profile.bio, weight: 5 },
    { met: !!profile.currentTitle, weight: 10 },
    { met: !!profile.currentCompany, weight: 5 },
    { met: profile.totalExperienceYears != null, weight: 5 },
    { met: !!profile.careerLevel, weight: 5 },
    { met: !!profile.industry, weight: 5 },
    { met: experienceCount > 0, weight: 10 },
    { met: educationCount > 0, weight: 5 },
    { met: profile.desiredTitles.length > 0, weight: 10 },
    { met: profile.desiredLocations.length > 0, weight: 5 },
    { met: profile.workplaceTypes.length > 0, weight: 5 },
    { met: profile.employmentTypes.length > 0, weight: 5 },
    { met: !!(profile.desiredSalaryMin || profile.desiredSalaryMax), weight: 5 },
    { met: !!profile.workAuthorization, weight: 5 },
    { met: profile.targetTitles.length > 0, weight: 5 },
    { met: !!profile.careerGoals, weight: 5 },
  ]);
}

/** Skill coverage — count-based against a reasonable target, real data only (no fabricated floor). */
function computeSkillsScore(skillCount: number) {
  const TARGET_SKILL_COUNT = 10;
  return Math.min(100, Math.round((skillCount / TARGET_SKILL_COUNT) * 100));
}

/**
 * Resume strength — checks which structured sections a resume actually has.
 * Real ATS-grade scoring lands in the Resume Studio / ATS Scanner phase; this
 * stays intentionally conservative until then.
 */
function computeResumeScore(resumes: { content: unknown; isPrimary: boolean }[]) {
  if (resumes.length === 0) return 0;
  const primary = resumes.find((r) => r.isPrimary) ?? resumes[0];
  const content = primary.content as Record<string, unknown> | null;
  if (!content || typeof content !== "object") return 0;

  const expectedSections = ["summary", "experience", "education", "skills"];
  const present = expectedSections.filter((key) => {
    const value = content[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  return Math.round((present.length / expectedSections.length) * 100);
}

export interface CareerReadinessResult {
  careerReadinessScore: number;
  resumeScore: number;
  profileScore: number;
  skillsScore: number;
  interviewScore: number;
  jobMatchScore: number;
}

/**
 * Job match strength — the average of the candidate's best cached matches.
 * Reflects whether the jobs actually available are a good fit, not just
 * how complete the profile looks; stays 0 until any job has been scored.
 */
function computeJobMatchScore(topMatchScores: number[]) {
  if (topMatchScores.length === 0) return 0;
  return Math.round(topMatchScores.reduce((sum, s) => sum + s, 0) / topMatchScores.length);
}

/**
 * Recomputes every Career Readiness sub-score from real data and persists
 * them on the CandidateProfile. Call this after any mutation that could
 * change completeness: onboarding steps, skill/experience/education edits,
 * resume saves, or a job match being (re)computed. `interviewScore` stays 0
 * until the Interview AI phase populates real session history to score.
 */
export async function recomputeCareerReadiness(profileId: string): Promise<CareerReadinessResult> {
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      experiences: { select: { id: true } },
      education: { select: { id: true } },
      skills: { select: { id: true } },
      resumes: { select: { content: true, isPrimary: true } },
    },
  });

  const topMatches = await prisma.jobMatch.findMany({
    where: { profileId },
    orderBy: { score: "desc" },
    take: 5,
    select: { score: true },
  });

  const profileScore = computeProfileScore(profile, profile.experiences.length, profile.education.length);
  const skillsScore = computeSkillsScore(profile.skills.length);
  const resumeScore = computeResumeScore(profile.resumes);
  const interviewScore = profile.interviewScore; // populated starting in the Interview AI phase
  const jobMatchScore = computeJobMatchScore(topMatches.map((m) => m.score));

  const careerReadinessScore = Math.round(
    resumeScore * 0.25 + profileScore * 0.3 + skillsScore * 0.2 + interviewScore * 0.1 + jobMatchScore * 0.15
  );

  const result: CareerReadinessResult = {
    careerReadinessScore,
    resumeScore,
    profileScore,
    skillsScore,
    interviewScore,
    jobMatchScore,
  };

  await prisma.candidateProfile.update({ where: { id: profileId }, data: result });

  return result;
}
