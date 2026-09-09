import "server-only";
import { prisma } from "@/lib/prisma";
import { computeMatch, type MatchProfileInput, type MatchJobInput } from "@/lib/matching/engine";
import type { CandidateProfile, Job } from "@prisma/client";

type ProfileWithSkills = CandidateProfile & { skills: { skill: { name: string } }[] };
type JobWithSkills = Job & { skills: { required: boolean; skill: { name: string } }[] };

function toProfileInput(profile: ProfileWithSkills): MatchProfileInput {
  return {
    currentTitle: profile.currentTitle,
    desiredTitles: profile.desiredTitles,
    targetTitles: profile.targetTitles,
    totalExperienceYears: profile.totalExperienceYears,
    careerLevel: profile.careerLevel,
    workplaceTypes: profile.workplaceTypes,
    desiredLocations: profile.desiredLocations,
    desiredSalaryMin: profile.desiredSalaryMin,
    desiredSalaryMax: profile.desiredSalaryMax,
    skillNames: profile.skills.map((s) => s.skill.name),
  };
}

function toJobInput(job: JobWithSkills): MatchJobInput {
  return {
    title: job.title,
    location: job.location,
    workplaceType: job.workplaceType,
    careerLevel: job.careerLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    requiredSkillNames: job.skills.filter((s) => s.required).map((s) => s.skill.name),
    allSkillNames: job.skills.map((s) => s.skill.name),
  };
}

export async function computeAndCacheMatch(profile: ProfileWithSkills, job: JobWithSkills) {
  const result = computeMatch(toProfileInput(profile), toJobInput(job));

  await prisma.jobMatch.upsert({
    where: { profileId_jobId: { profileId: profile.id, jobId: job.id } },
    create: {
      profileId: profile.id,
      jobId: job.id,
      score: result.score,
      skillsScore: result.skillsScore,
      titleScore: result.titleScore,
      experienceScore: result.experienceScore,
      locationScore: result.locationScore,
      salaryScore: result.salaryScore,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      reasons: result.reasons,
    },
    update: {
      score: result.score,
      skillsScore: result.skillsScore,
      titleScore: result.titleScore,
      experienceScore: result.experienceScore,
      locationScore: result.locationScore,
      salaryScore: result.salaryScore,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      reasons: result.reasons,
      computedAt: new Date(),
    },
  });

  return result;
}

const PROFILE_INCLUDE = { skills: { include: { skill: true } } } as const;
const JOB_INCLUDE = { skills: { include: { skill: true } } } as const;

export async function getProfileForMatching(profileId: string) {
  return prisma.candidateProfile.findUniqueOrThrow({ where: { id: profileId }, include: PROFILE_INCLUDE });
}

export async function getJobForMatching(jobId: string) {
  return prisma.job.findUniqueOrThrow({ where: { id: jobId }, include: JOB_INCLUDE });
}

/** Batch-scores many jobs against one profile — used by the jobs list page. */
export async function scoreJobsForProfile(profileId: string, jobIds: string[]) {
  if (jobIds.length === 0) return new Map<string, number>();

  const profile = await getProfileForMatching(profileId);
  const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } }, include: JOB_INCLUDE });

  const scores = new Map<string, number>();
  for (const job of jobs) {
    const result = computeMatch(toProfileInput(profile), toJobInput(job));
    scores.set(job.id, result.score);
  }
  return scores;
}
