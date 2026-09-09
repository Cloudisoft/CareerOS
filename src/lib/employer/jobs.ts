import "server-only";
import { prisma } from "@/lib/prisma";
import type { JobInput } from "@/lib/validations/employer";

export class EmployerJobError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function resolveSkillId(name: string) {
  const existing = await prisma.skill.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (existing) return existing.id;
  const created = await prisma.skill.create({ data: { name } });
  return created.id;
}

export async function listJobsForCompany(companyId: string) {
  const jobs = await prisma.job.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return jobs;
}

export async function getJobForCompany(companyId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId, deletedAt: null },
    include: { skills: { include: { skill: true } } },
  });
  if (!job) throw new EmployerJobError("This job could not be found.", "NOT_FOUND");
  return job;
}

export async function createJobForCompany(companyId: string, input: JobInput) {
  const skillIds = await Promise.all(input.skills.map((s) => resolveSkillId(s)));

  return prisma.job.create({
    data: {
      companyId,
      title: input.title,
      description: input.description,
      location: input.location || null,
      workplaceType: input.workplaceType,
      employmentType: input.employmentType,
      careerLevel: input.careerLevel ?? null,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency,
      status: "OPEN",
      skills: {
        create: skillIds.map((skillId) => ({ skillId, required: true })),
      },
    },
  });
}

export async function updateJobForCompany(companyId: string, jobId: string, input: JobInput) {
  await getJobForCompany(companyId, jobId);
  const skillIds = await Promise.all(input.skills.map((s) => resolveSkillId(s)));

  return prisma.job.update({
    where: { id: jobId },
    data: {
      title: input.title,
      description: input.description,
      location: input.location || null,
      workplaceType: input.workplaceType,
      employmentType: input.employmentType,
      careerLevel: input.careerLevel ?? null,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency,
      skills: {
        deleteMany: {},
        create: skillIds.map((skillId) => ({ skillId, required: true })),
      },
    },
  });
}

export async function setJobStatus(companyId: string, jobId: string, status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED") {
  await getJobForCompany(companyId, jobId);
  return prisma.job.update({ where: { id: jobId }, data: { status } });
}

export async function deleteJobForCompany(companyId: string, jobId: string) {
  await getJobForCompany(companyId, jobId);
  await prisma.job.update({ where: { id: jobId }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
}
