import "server-only";
import { prisma } from "@/lib/prisma";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import { resumeContentSchema, type ResumeContent } from "@/lib/validations/resume";
import type { CandidateProfile, WorkExperience, Education, CandidateSkill, Skill } from "@prisma/client";

export class ResumeServiceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

type ProfileForResume = CandidateProfile & {
  experiences: WorkExperience[];
  education: Education[];
  skills: (CandidateSkill & { skill: Skill })[];
};

function monthYear(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function buildContentFromProfile(profile: ProfileForResume): ResumeContent {
  return resumeContentSchema.parse({
    summary: profile.bio ?? "",
    links: {
      linkedin: profile.linkedinUrl ?? "",
      github: profile.githubUrl ?? "",
      portfolio: profile.portfolioUrl ?? "",
    },
    experience: profile.experiences.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location ?? "",
      startDate: monthYear(e.startDate),
      endDate: e.isCurrent ? "" : monthYear(e.endDate),
      isCurrent: e.isCurrent,
      bullets: e.achievements.length ? e.achievements : e.description ? [e.description] : [],
    })),
    education: profile.education.map((e) => ({
      school: e.school,
      degree: e.degree ?? "",
      fieldOfStudy: e.fieldOfStudy ?? "",
      startDate: monthYear(e.startDate),
      endDate: monthYear(e.endDate),
    })),
    skills: profile.skills.map((s) => s.skill.name),
    certifications: [],
  });
}

export async function listResumes(profileId: string) {
  return prisma.resume.findMany({ where: { profileId }, orderBy: { updatedAt: "desc" } });
}

export async function getResume(profileId: string, resumeId: string) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.profileId !== profileId) {
    throw new ResumeServiceError("This resume could not be found.", "NOT_FOUND");
  }
  return resume;
}

export async function createResume(profileId: string, name: string, fromProfile: boolean) {
  let content: ResumeContent = resumeContentSchema.parse({});

  if (fromProfile) {
    const profile = await prisma.candidateProfile.findUniqueOrThrow({
      where: { id: profileId },
      include: { experiences: true, education: true, skills: { include: { skill: true } } },
    });
    content = buildContentFromProfile(profile);
  }

  const existingCount = await prisma.resume.count({ where: { profileId } });
  const resume = await prisma.resume.create({
    data: { profileId, name, content, isPrimary: existingCount === 0 },
  });
  await recomputeCareerReadiness(profileId);
  return resume;
}

export async function updateResume(
  profileId: string,
  resumeId: string,
  patch: { name?: string; isPrimary?: boolean; content?: ResumeContent }
) {
  await getResume(profileId, resumeId); // ownership check

  if (patch.isPrimary) {
    await prisma.resume.updateMany({ where: { profileId }, data: { isPrimary: false } });
  }

  const resume = await prisma.resume.update({
    where: { id: resumeId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.isPrimary !== undefined ? { isPrimary: patch.isPrimary } : {}),
      ...(patch.content !== undefined ? { content: patch.content } : {}),
    },
  });
  await recomputeCareerReadiness(profileId);
  return resume;
}

export async function deleteResume(profileId: string, resumeId: string) {
  const resume = await getResume(profileId, resumeId);
  await prisma.resume.delete({ where: { id: resumeId } });

  if (resume.isPrimary) {
    const next = await prisma.resume.findFirst({ where: { profileId }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.resume.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  await recomputeCareerReadiness(profileId);
}
