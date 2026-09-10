import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserEntitlements } from "@/lib/billing/entitlements";
import { findOrCreateExternalCompany } from "@/lib/company/service";

export class AutoApplyError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Clamps a stored limit against the plan's cap; Infinity clamps to Infinity (Math.min(x, Infinity) === x). */
function clampToPlan(value: number, planMax: number) {
  return Math.max(0, Math.min(value, planMax));
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
    monthlyLimit: number;
    pacingSeconds: number;
    concurrency: number;
    autoSubmit: boolean;
  },
  entitlements: UserEntitlements
) {
  const clampedMonthlyLimit = clampToPlan(input.monthlyLimit, entitlements.monthlyApplicationLimit);

  return prisma.autoApplySettings.upsert({
    where: { profileId },
    update: { ...input, monthlyLimit: clampedMonthlyLimit },
    create: { profileId, ...input, monthlyLimit: clampedMonthlyLimit },
  });
}

/** Applications the extension has submitted or assisted with this calendar month, for monthly-limit enforcement. */
export async function countAppliedThisMonth(profileId: string) {
  return prisma.application.count({
    where: {
      profileId,
      source: { in: ["EXTENSION", "AUTO"] },
      appliedAt: { gte: startOfMonthUtc() },
    },
  });
}

/** Distinct Auto Apply runs ("campaigns") started this calendar month, for campaign-limit enforcement. */
export async function countCampaignsThisMonth(profileId: string) {
  return prisma.autoApplyRun.count({
    where: { profileId, startedAt: { gte: startOfMonthUtc() } },
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

export async function recordRunHeartbeat(
  profileId: string,
  input: RunHeartbeatInput,
  entitlements: UserEntitlements
) {
  const existing = await prisma.autoApplyRun.findUnique({ where: { runId: input.runId } });

  if (!existing) {
    const campaignsThisMonth = await countCampaignsThisMonth(profileId);
    if (campaignsThisMonth >= entitlements.campaignMonthlyLimit) {
      throw new AutoApplyError("This month's AI Application Campaign limit has been reached.", "CAMPAIGN_LIMIT_REACHED");
    }
  }

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
