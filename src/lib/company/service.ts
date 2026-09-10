import "server-only";
import { prisma } from "@/lib/prisma";
import type { CompanyInput } from "@/lib/validations/employer";

export class CompanyError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "company";
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

/**
 * Companies discovered from an external source (the browser extension, or a
 * job aggregator sync) are consolidated by name among themselves, but never
 * merged into a real employer's own Company row (those always have at least
 * one CompanyMember) — so a discovered "Acme Robotics" never lands on an
 * actual employer's public page.
 */
export async function findOrCreateExternalCompany(name: string) {
  const trimmed = name?.trim() || "Unknown Company";
  const existing = await prisma.company.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, members: { none: {} } },
  });
  if (existing) return existing;

  const slug = await uniqueSlug(trimmed);
  return prisma.company.create({ data: { slug, name: trimmed } });
}

function cleanInput(input: CompanyInput) {
  return {
    name: input.name,
    description: input.description || null,
    industry: input.industry || null,
    size: input.size || null,
    location: input.location || null,
    website: input.website || null,
    linkedinUrl: input.linkedinUrl || null,
    logoUrl: input.logoUrl || null,
  };
}

export async function createCompanyForUser(userId: string, input: CompanyInput) {
  const existing = await prisma.companyMember.findFirst({ where: { userId } });
  if (existing) throw new CompanyError("You already belong to a company.", "ALREADY_HAS_COMPANY");

  const slug = await uniqueSlug(input.name);

  return prisma.company.create({
    data: {
      slug,
      ...cleanInput(input),
      members: { create: { userId, role: "OWNER" } },
    },
  });
}

export async function updateCompany(companyId: string, input: CompanyInput) {
  return prisma.company.update({ where: { id: companyId }, data: cleanInput(input) });
}

export async function getCompanyForUser(userId: string) {
  const membership = await prisma.companyMember.findFirst({
    where: { userId },
    include: { company: true },
  });
  return membership?.company ?? null;
}

export async function getCompanyDashboardStats(companyId: string) {
  const [openJobs, totalApplications, newApplicationsThisWeek] = await Promise.all([
    prisma.job.count({ where: { companyId, status: "OPEN", deletedAt: null } }),
    prisma.application.count({ where: { job: { companyId } } }),
    prisma.application.count({
      where: { job: { companyId }, appliedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return { openJobs, totalApplications, newApplicationsThisWeek };
}

export async function getPublicCompanyBySlug(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { status: "OPEN", deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { skills: { include: { skill: true } } },
      },
    },
  });
  if (!company || company.deletedAt) return null;
  return company;
}
