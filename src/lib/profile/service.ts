import "server-only";
import { prisma } from "@/lib/prisma";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import type {
  IdentityStepInput,
  ProfessionalStepInput,
  SkillsStepInput,
  PreferencesStepInput,
  WorkAuthStepInput,
  GoalsStepInput,
} from "@/lib/validations/profile";
import { z } from "zod";
import { workExperienceSchema, educationSchema } from "@/lib/validations/profile";

export async function getOrCreateCandidateProfile(userId: string) {
  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      experiences: { orderBy: { startDate: "desc" } },
      education: { orderBy: { startDate: "desc" } },
      certifications: true,
      languages: true,
      skills: { include: { skill: true } },
      resumes: true,
    },
  });
  if (existing) return existing;

  await prisma.candidateProfile.create({ data: { userId } });
  return getOrCreateCandidateProfile(userId);
}

function bumpOnboardingStep(current: number, step: number) {
  return Math.max(current, step);
}

export async function saveIdentityStep(userId: string, profileId: string, currentStep: number, input: IdentityStepInput) {
  await prisma.$transaction([
    prisma.candidateProfile.update({
      where: { id: profileId },
      data: {
        location: input.location || null,
        headline: input.headline || null,
        bio: input.bio || null,
        onboardingStep: bumpOnboardingStep(currentStep, 1),
      },
    }),
    ...(input.phone
      ? [prisma.user.update({ where: { id: userId }, data: { phone: input.phone } })]
      : []),
  ]);
  return recomputeCareerReadiness(profileId);
}

export async function saveProfessionalStep(profileId: string, currentStep: number, input: ProfessionalStepInput) {
  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      currentTitle: input.currentTitle || null,
      currentCompany: input.currentCompany || null,
      totalExperienceYears: input.totalExperienceYears ?? null,
      careerLevel: input.careerLevel ?? null,
      industry: input.industry || null,
      onboardingStep: bumpOnboardingStep(currentStep, 2),
    },
  });
  return recomputeCareerReadiness(profileId);
}

async function resolveSkillId(name: string) {
  const existing = await prisma.skill.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (existing) return existing.id;
  const created = await prisma.skill.create({ data: { name } });
  return created.id;
}

export async function saveSkillsStep(profileId: string, currentStep: number, input: SkillsStepInput) {
  const skillIds = await Promise.all(input.skills.map((s) => resolveSkillId(s.name)));

  await prisma.$transaction([
    prisma.candidateSkill.deleteMany({ where: { profileId } }),
    ...(input.skills.length
      ? [
          prisma.candidateSkill.createMany({
            data: input.skills.map((s, i) => ({
              profileId,
              skillId: skillIds[i],
              type: s.type,
              level: s.level,
            })),
          }),
        ]
      : []),
    prisma.candidateLanguage.deleteMany({ where: { profileId } }),
    ...(input.languages.length
      ? [
          prisma.candidateLanguage.createMany({
            data: input.languages.map((l) => ({
              profileId,
              language: l.language,
              proficiency: l.proficiency,
            })),
          }),
        ]
      : []),
    prisma.candidateProfile.update({
      where: { id: profileId },
      data: { onboardingStep: bumpOnboardingStep(currentStep, 3) },
    }),
  ]);
  return recomputeCareerReadiness(profileId);
}

export async function savePreferencesStep(profileId: string, currentStep: number, input: PreferencesStepInput) {
  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      desiredTitles: input.desiredTitles,
      desiredIndustries: input.desiredIndustries,
      desiredLocations: input.desiredLocations,
      workplaceTypes: input.workplaceTypes,
      employmentTypes: input.employmentTypes,
      desiredSalaryMin: input.desiredSalaryMin ?? null,
      desiredSalaryMax: input.desiredSalaryMax ?? null,
      noticePeriodDays: input.noticePeriodDays ?? null,
      onboardingStep: bumpOnboardingStep(currentStep, 4),
    },
  });
  return recomputeCareerReadiness(profileId);
}

export async function saveWorkAuthStep(profileId: string, currentStep: number, input: WorkAuthStepInput) {
  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      workAuthorization: input.workAuthorization || null,
      sponsorshipStatus: input.sponsorshipStatus,
      willingToRelocate: input.willingToRelocate,
      onboardingStep: bumpOnboardingStep(currentStep, 5),
    },
  });
  return recomputeCareerReadiness(profileId);
}

export async function saveGoalsStepAndComplete(profileId: string, input: GoalsStepInput) {
  const current = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: { onboardingCompletedAt: true },
  });

  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      targetTitles: input.targetTitles,
      targetCompanies: input.targetCompanies,
      careerGoals: input.careerGoals || null,
      onboardingStep: 6,
      onboardingCompletedAt: current.onboardingCompletedAt ?? new Date(),
    },
  });
  return recomputeCareerReadiness(profileId);
}

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;

export async function addWorkExperience(profileId: string, input: WorkExperienceInput) {
  const experience = await prisma.workExperience.create({ data: { profileId, ...input } });
  await recomputeCareerReadiness(profileId);
  return experience;
}

export async function updateWorkExperience(profileId: string, experienceId: string, input: WorkExperienceInput) {
  const experience = await prisma.workExperience.update({
    where: { id: experienceId, profileId },
    data: input,
  });
  await recomputeCareerReadiness(profileId);
  return experience;
}

export async function deleteWorkExperience(profileId: string, experienceId: string) {
  await prisma.workExperience.delete({ where: { id: experienceId, profileId } });
  await recomputeCareerReadiness(profileId);
}

export async function addEducation(profileId: string, input: EducationInput) {
  const education = await prisma.education.create({ data: { profileId, ...input } });
  await recomputeCareerReadiness(profileId);
  return education;
}

export async function updateEducation(profileId: string, educationId: string, input: EducationInput) {
  const education = await prisma.education.update({ where: { id: educationId, profileId }, data: input });
  await recomputeCareerReadiness(profileId);
  return education;
}

export async function deleteEducation(profileId: string, educationId: string) {
  await prisma.education.delete({ where: { id: educationId, profileId } });
  await recomputeCareerReadiness(profileId);
}
