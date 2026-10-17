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

/** Settings the person changed in the extension's options page; only the fields sent are written. */
export async function updateExtensionSettings(
  profileId: string,
  input: {
    minMatchScore?: number;
    pacingSeconds?: number;
    concurrency?: number;
    autoSubmit?: boolean;
    platformModes?: Record<string, string>;
  }
) {
  const data = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  return prisma.autoApplySettings.upsert({
    where: { profileId },
    update: data,
    create: { profileId, ...data },
  });
}

/** Statuses that mean the application really reached the employer (SAVED = filled or prepared only). */
export const SUBMITTED_STATUSES = ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"] as const;

/** Applications the extension actually submitted this calendar month, for monthly-limit enforcement. */
export async function countAppliedThisMonth(profileId: string) {
  return prisma.application.count({
    where: {
      profileId,
      source: { in: ["EXTENSION", "AUTO"] },
      status: { in: [...SUBMITTED_STATUSES] },
      appliedAt: { gte: startOfMonthUtc() },
    },
  });
}

/**
 * One canonical form of a job URL, so the same posting reached through different links (tracking
 * parameters, trailing slash, #fragment) is recognised as one job and never applied to twice.
 */
export function normalizeJobUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    for (const key of Array.from(u.searchParams.keys())) {
      if (/^(utm_|gh_src$|source$|src$|ref$|referrer$|lever-source|lever-origin$|trk|refId$|trackingId$)/i.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    let out = u.toString();
    if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch {
    return raw.trim();
  }
}

/** Distinct Auto Apply runs ("campaigns") started this calendar month, for campaign-limit enforcement. */
export async function countCampaignsThisMonth(profileId: string) {
  return prisma.autoApplyRun.count({
    where: { profileId, startedAt: { gte: startOfMonthUtc() } },
  });
}

/**
 * Every external URL this candidate has actually applied to, for the extension's cross-device dedupe.
 * Prepared-but-unsent (SAVED) and withdrawn applications are not included, so they can still be applied to.
 */
export async function listAppliedUrls(profileId: string) {
  const applications = await prisma.application.findMany({
    where: { profileId, status: { in: [...SUBMITTED_STATUSES] }, job: { externalUrl: { not: null } } },
    select: { job: { select: { externalUrl: true } } },
    orderBy: { appliedAt: "desc" },
    take: 5000,
  });
  return Array.from(new Set(applications.map((a) => a.job.externalUrl).filter((u): u is string => Boolean(u)).map(normalizeJobUrl)));
}

export async function findOrCreateExternalJob(
  companyId: string,
  input: { url: string; title: string; ats: string; description?: string }
) {
  const url = normalizeJobUrl(input.url);
  const existing = await prisma.job.findFirst({ where: { companyId, externalUrl: { in: Array.from(new Set([url, input.url])) } } });
  if (existing) {
    // A real description arriving later (e.g. the package endpoint sees the
    // full posting) upgrades the placeholder text from a bare application log.
    if (input.description && existing.description.startsWith("Discovered and applied to via")) {
      return prisma.job.update({ where: { id: existing.id }, data: { description: input.description } });
    }
    return existing;
  }

  return prisma.job.create({
    data: {
      companyId,
      title: input.title || "Untitled role",
      description:
        input.description ||
        `Discovered and applied to via the Career OS browser extension (${input.ats || "unknown platform"}).`,
      status: "CLOSED", // not part of the Career OS marketplace — tracking only
      source: "extension",
      externalUrl: url,
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
  // "assisted" = the form was filled but the person hasn't submitted it: that is not an application yet.
  const submitted = input.outcome === "submitted";
  const existing = await prisma.application.findUnique({ where: { profileId_jobId: { profileId, jobId: job.id } } });
  const alreadySubmitted = !!existing && (SUBMITTED_STATUSES as readonly string[]).includes(existing.status);
  const status = submitted || alreadySubmitted ? (alreadySubmitted ? existing!.status : "APPLIED") : "SAVED";

  const application = await prisma.application.upsert({
    where: { profileId_jobId: { profileId, jobId: job.id } },
    update: {
      status,
      matchScoreAtApply: Math.round(input.matchScore),
      // The submission date is when it was actually sent, not when a package was first prepared.
      ...(submitted && !alreadySubmitted ? { appliedAt: new Date() } : {}),
    },
    create: {
      profileId,
      jobId: job.id,
      status,
      source: "EXTENSION",
      matchScoreAtApply: Math.round(input.matchScore),
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      fromStatus: existing?.status ?? null,
      toStatus: status,
      note: `${submitted ? "Applied" : "Filled (not yet submitted)"} via browser extension (${input.ats || "unknown platform"}), outcome: ${input.outcome}${
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
  waiting?: { title: string; company: string; url: string; reason: string; message: string; since?: number }[];
}

export async function recordRunHeartbeat(
  profileId: string,
  input: RunHeartbeatInput,
  entitlements: UserEntitlements
) {
  const existing = await prisma.autoApplyRun.findUnique({ where: { runId: input.runId } });
  // Run ids come from the browser; never let one account update another account's run.
  if (existing && existing.profileId !== profileId) throw new AutoApplyError("Unknown run.", "NOT_FOUND");

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
      ...(input.waiting ? { waiting: input.waiting } : {}),
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
      waiting: input.waiting ?? [],
    },
  });
}

/** Commands older than this are dropped: the browser was closed, and starting a run hours later would surprise. */
const RUN_COMMAND_TTL_MS = 15 * 60 * 1000;

/** Start or Stop pressed on the Auto Apply page; the extension picks it up within a minute. */
export async function requestRunCommand(profileId: string, action: "start" | "stop") {
  await getOrCreateSettings(profileId);
  return prisma.autoApplySettings.update({ where: { profileId }, data: { runCommand: action, runCommandAt: new Date() } });
}

/** The extension collecting a pending command, exactly once (two browsers can't both take it). */
export async function takeRunCommand(profileId: string): Promise<"start" | "stop" | null> {
  const settings = await prisma.autoApplySettings.findUnique({ where: { profileId } });
  if (!settings?.runCommand || !settings.runCommandAt) return null;
  const taken = await prisma.autoApplySettings.updateMany({
    where: { profileId, runCommand: settings.runCommand, runCommandAt: settings.runCommandAt },
    data: { runCommand: null, runCommandAt: null },
  });
  if (taken.count !== 1) return null;
  if (Date.now() - settings.runCommandAt.getTime() > RUN_COMMAND_TTL_MS) return null;
  return settings.runCommand === "stop" ? "stop" : "start";
}

export async function listRecentRuns(profileId: string) {
  return prisma.autoApplyRun.findMany({
    where: { profileId },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}
