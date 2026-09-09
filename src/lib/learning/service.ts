import "server-only";
import { prisma } from "@/lib/prisma";

export class LearningError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const RESOURCE_INCLUDE = { skill: { select: { name: true } } } as const;

export async function listResources(filters: { q?: string; skill?: string; type?: string }) {
  return prisma.learningResource.findMany({
    where: {
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
              { provider: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.skill ? { skill: { name: { equals: filters.skill, mode: "insensitive" } } } : {}),
      ...(filters.type ? { type: filters.type as never } : {}),
    },
    include: RESOURCE_INCLUDE,
    orderBy: { title: "asc" },
  });
}

/**
 * Recommends resources for the skills this candidate is actually missing,
 * aggregated from their real cached job matches — never a generic or
 * fabricated "personalized" list.
 */
export async function getRecommendedResources(profileId: string) {
  const matches = await prisma.jobMatch.findMany({
    where: { profileId },
    orderBy: { score: "desc" },
    take: 20,
    select: { missingSkills: true },
  });

  const frequency = new Map<string, number>();
  for (const match of matches) {
    for (const skill of match.missingSkills) {
      const key = skill.toLowerCase();
      frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }
  }

  const topSkills = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  if (topSkills.length === 0) return { missingSkills: [], resources: [] };

  const resources = await prisma.learningResource.findMany({
    where: { skill: { name: { in: topSkills, mode: "insensitive" } } },
    include: RESOURCE_INCLUDE,
  });

  return { missingSkills: topSkills, resources };
}

export async function listProgress(profileId: string) {
  return prisma.learningProgress.findMany({
    where: { profileId },
    include: { resource: { include: RESOURCE_INCLUDE } },
    orderBy: { startedAt: "desc" },
  });
}

export async function startResource(profileId: string, resourceId: string) {
  const resource = await prisma.learningResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new LearningError("This resource could not be found.", "NOT_FOUND");

  return prisma.learningProgress.upsert({
    where: { profileId_resourceId: { profileId, resourceId } },
    update: {},
    create: { profileId, resourceId, status: "IN_PROGRESS" },
  });
}

export async function setResourceStatus(profileId: string, resourceId: string, status: "IN_PROGRESS" | "COMPLETED") {
  const progress = await prisma.learningProgress.findUnique({
    where: { profileId_resourceId: { profileId, resourceId } },
  });
  if (!progress) throw new LearningError("Start this resource before updating its status.", "NOT_FOUND");

  return prisma.learningProgress.update({
    where: { profileId_resourceId: { profileId, resourceId } },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
}
