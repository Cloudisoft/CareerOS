import "server-only";
import { prisma } from "@/lib/prisma";
import { computeMatch } from "@/lib/matching/engine";
import { toProfileInput, toJobInput, getJobForMatching } from "@/lib/matching/service";
import { createNotification } from "@/lib/notifications/service";
import type { Prisma } from "@prisma/client";

export class TalentSearchError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/** A profile is discoverable to a company if it's public/recruiter-visible, or if it applied to that company. */
function visibilityFilter(companyId: string): Prisma.CandidateProfileWhereInput {
  return {
    OR: [
      { visibility: "PUBLIC" },
      { visibility: "RECRUITERS_ONLY" },
      { visibility: "PRIVATE_UNTIL_APPLY", applications: { some: { job: { companyId } } } },
    ],
  };
}

export interface TalentSearchFilters {
  q?: string;
  location?: string;
  careerLevel?: string;
  skills?: string[];
  jobId?: string;
}

export async function searchTalent(companyId: string, filters: TalentSearchFilters) {
  const where: Prisma.CandidateProfileWhereInput = {
    onboardingCompletedAt: { not: null },
    AND: [
      visibilityFilter(companyId),
      filters.q
        ? {
            OR: [
              { currentTitle: { contains: filters.q, mode: "insensitive" } },
              { headline: { contains: filters.q, mode: "insensitive" } },
              { user: { firstName: { contains: filters.q, mode: "insensitive" } } },
              { user: { lastName: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {},
      filters.careerLevel ? { careerLevel: filters.careerLevel as never } : {},
      filters.skills?.length
        ? { skills: { some: { skill: { name: { in: filters.skills, mode: "insensitive" } } } } }
        : {},
    ],
  };

  const profiles = await prisma.candidateProfile.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      skills: { include: { skill: true }, take: 12 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  let job: Awaited<ReturnType<typeof getJobForMatching>> | null = null;
  if (filters.jobId) {
    job = await getJobForMatching(filters.jobId).catch(() => null);
    if (job && job.companyId !== companyId) job = null;
  }

  return profiles.map((profile) => {
    let matchScore: number | null = null;
    if (job) {
      const result = computeMatch(toProfileInput(profile), toJobInput(job));
      matchScore = result.score;
    }
    return {
      profileId: profile.id,
      userId: profile.user.id,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      avatarUrl: profile.user.avatarUrl,
      headline: profile.headline,
      currentTitle: profile.currentTitle,
      location: profile.location,
      careerLevel: profile.careerLevel,
      totalExperienceYears: profile.totalExperienceYears,
      skills: profile.skills.map((s) => s.skill.name),
      visibility: profile.visibility,
      matchScore,
    };
  });
}

export async function contactCandidate(companyId: string, companyName: string, profileId: string, message: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });
  if (!profile) throw new TalentSearchError("This candidate could not be found.", "NOT_FOUND");

  const eligible = await prisma.candidateProfile.findFirst({
    where: { id: profileId, ...visibilityFilter(companyId) },
  });
  if (!eligible) throw new TalentSearchError("This candidate isn't available to contact.", "NOT_DISCOVERABLE");

  await createNotification({
    userId: profile.user.id,
    type: "RECRUITER_CONTACT",
    title: `${companyName} sent you a message`,
    body: message,
    linkUrl: "/notifications",
  });
}
