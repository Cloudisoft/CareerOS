import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserEntitlements } from "@/lib/billing/entitlements";

export class AutoApplyError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getOrCreateSettings(profileId: string) {
  const existing = await prisma.autoApplySettings.findUnique({ where: { profileId } });
  if (existing) return existing;
  return prisma.autoApplySettings.create({ data: { profileId } });
}

export async function updateSettings(
  profileId: string,
  input: {
    minMatchScore: number;
    dailyLimit: number;
    pacingSeconds: number;
    concurrency: number;
    autoSubmit: boolean;
  },
  entitlements: UserEntitlements
) {
  const clampedDailyLimit = Math.max(0, Math.min(input.dailyLimit, entitlements.dailyApplicationLimit));

  return prisma.autoApplySettings.upsert({
    where: { profileId },
    update: { ...input, dailyLimit: clampedDailyLimit },
    create: { profileId, ...input, dailyLimit: clampedDailyLimit },
  });
}

/** Applications the extension has submitted or assisted with today, for daily-limit enforcement. */
export async function countAppliedToday(profileId: string) {
  return prisma.application.count({
    where: {
      profileId,
      source: { in: ["EXTENSION", "AUTO"] },
      appliedAt: { gte: startOfTodayUtc() },
    },
  });
}

/** Every external URL this candidate has already applied to, for the extension's cross-device dedupe. */
export async function listAppliedUrls(profileId: string) {
  const applications = await prisma.application.findMany({
    where: { profileId, job: { externalUrl: { not: null } } },
    select: { job: { select: { externalUrl: true } } },
    orderBy: { appliedAt: "desc" },
    take: 500,
  });
  return applications.map((a) => a.job.externalUrl).filter((u): u is string => Boolean(u));
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "company"
  );
}

/**
 * Extension-discovered companies are consolidated by name among themselves,
 * but never merged into a real employer's own Company row (those always
 * have at least one CompanyMember) — so an extension-logged "Acme Robotics"
 * never lands on an actual employer's public page.
 */
async function findOrCreateExternalCompany(name: string) {
  const trimmed = name?.trim() || "Unknown Company";
  const existing = await prisma.company.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, members: { none: {} } },
  });
  if (existing) return existing;

  const base = slugify(trimmed);
  let slug = base;
  let attempt = 0;
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return prisma.company.create({ data: { slug, name: trimmed } });
}

async function findOrCreateExternalJob(companyId: string, input: { url: string; title: string; ats: string }) {
  const existing = await prisma.job.findFirst({ where: { companyId, externalUrl: input.url } });
  if (existing) return existing;

  return prisma.job.create({
    data: {
      companyId,
      title: input.title || "Untitled role",
      description: `Discovered and applied to via the Career OS browser extension (${input.ats || "unknown platform"}).`,
      status: "CLOSED", // not part of the Career OS marketplace — tracking only
      source: "extension",
      externalUrl: input.url,
    },
  });
}

export interface LogExtensionApplicationInput {
  url: string;
  title: string;
  company: string;
  ats: string;
  matchScore: number;
  outcome: "submitted" | "assisted";
  detail?: string;
}

export async function logExtensionApplication(profileId: string, input: LogExtensionApplicationInput) {
  const company = await findOrCreateExternalCompany(input.company);
  const job = await findOrCreateExternalJob(company.id, input);

  const application = await prisma.application.upsert({
    where: { profileId_jobId: { profileId, jobId: job.id } },
    update: {
      status: "APPLIED",
      matchScoreAtApply: Math.round(input.matchScore),
    },
    create: {
      profileId,
      jobId: job.id,
      status: "APPLIED",
      source: "EXTENSION",
      matchScoreAtApply: Math.round(input.matchScore),
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      toStatus: "APPLIED",
      note: `Applied via browser extension (${input.ats || "unknown platform"}), outcome: ${input.outcome}${
        input.detail ? ` — ${input.detail}` : ""
      }`,
    },
  });

  return application;
}

export interface RunHeartbeatInput {
  runId: string;
  status: "running" | "finished";
  queued: number;
  submitted: number;
  assisted: number;
  skipped: number;
  failed: number;
  lastError?: string;
}

export async function recordRunHeartbeat(profileId: string, input: RunHeartbeatInput) {
  return prisma.autoApplyRun.upsert({
    where: { runId: input.runId },
    update: {
      status: input.status,
      queued: input.queued,
      submitted: input.submitted,
      assisted: input.assisted,
      skipped: input.skipped,
      failed: input.failed,
      lastError: input.lastError ?? null,
    },
    create: {
      runId: input.runId,
      profileId,
      status: input.status,
      queued: input.queued,
      submitted: input.submitted,
      assisted: input.assisted,
      skipped: input.skipped,
      failed: input.failed,
      lastError: input.lastError ?? null,
    },
  });
}

export async function listRecentRuns(profileId: string) {
  return prisma.autoApplyRun.findMany({
    where: { profileId },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}
