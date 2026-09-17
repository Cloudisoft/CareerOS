import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAndCacheMatch, getProfileForMatching, getJobForMatching } from "@/lib/matching/service";
import type { ApplicationSource } from "@prisma/client";

export class ApplicationServiceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function createApplication(
  profileId: string,
  input: { jobId: string; resumeId?: string; coverLetter?: string },
  source: ApplicationSource = "MANUAL"
) {
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job || job.deletedAt || job.status !== "OPEN") {
    throw new ApplicationServiceError("This job is no longer accepting applications.", "JOB_UNAVAILABLE");
  }
  if (job.source !== "careeros") {
    throw new ApplicationServiceError(
      "This listing is from an external job board — apply on the original posting.",
      "EXTERNAL_JOB"
    );
  }

  const existing = await prisma.application.findUnique({
    where: { profileId_jobId: { profileId, jobId: input.jobId } },
  });
  if (existing) {
    throw new ApplicationServiceError("You've already applied to this job.", "ALREADY_APPLIED");
  }

  if (input.resumeId) {
    const resume = await prisma.resume.findUnique({ where: { id: input.resumeId } });
    if (!resume || resume.profileId !== profileId) {
      throw new ApplicationServiceError("That resume could not be found.", "RESUME_NOT_FOUND");
    }
  }

  const [profileForMatching, jobForMatching] = await Promise.all([
    getProfileForMatching(profileId),
    getJobForMatching(input.jobId),
  ]);
  const match = await computeAndCacheMatch(profileForMatching, jobForMatching);

  const application = await prisma.application.create({
    data: {
      profileId,
      jobId: input.jobId,
      resumeId: input.resumeId,
      coverLetter: input.coverLetter || null,
      status: "APPLIED",
      source,
      matchScoreAtApply: match.score,
      events: { create: { toStatus: "APPLIED" } },
    },
  });

  // Applying implies interest, not completeness — drop the saved-job entry if present.
  await prisma.savedJob.deleteMany({ where: { profileId, jobId: input.jobId } });

  return application;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TREND_WEEKS = 10;

/** Cross-platform application analytics for one candidate — status mix, which job boards/ATS sourced the postings, and a recent weekly trend. */
export async function getApplicationAnalytics(profileId: string) {
  const since = new Date(Date.now() - TREND_WEEKS * WEEK_MS);

  const [byStatus, applications] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], where: { profileId }, _count: { _all: true } }),
    prisma.application.findMany({
      where: { profileId },
      select: { appliedAt: true, job: { select: { source: true } } },
    }),
  ]);

  const bySourceMap = new Map<string, number>();
  for (const a of applications) {
    bySourceMap.set(a.job.source, (bySourceMap.get(a.job.source) ?? 0) + 1);
  }

  const weekBuckets: { weekStart: string; count: number }[] = [];
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * WEEK_MS);
    const weekEnd = new Date(Date.now() - i * WEEK_MS);
    const count = applications.filter((a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd).length;
    weekBuckets.push({ weekStart: weekStart.toISOString().slice(0, 10), count });
  }

  return {
    total: applications.length,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    bySource: Array.from(bySourceMap.entries()).map(([source, count]) => ({ source, count })),
    weeklyTrend: weekBuckets,
    sinceApplications: applications.filter((a) => a.appliedAt >= since).length,
  };
}

/** Full application history as CSV — title, company, platform, status, applied date, match score. */
export async function exportApplicationsCsv(profileId: string): Promise<string> {
  const applications = await prisma.application.findMany({
    where: { profileId },
    include: { job: { include: { company: true } } },
    orderBy: { appliedAt: "desc" },
  });

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Title", "Company", "Platform", "Location", "Status", "Applied At", "Match Score"].join(",");
  const rows = applications.map((a) =>
    [
      escape(a.job.title),
      escape(a.job.company.name),
      escape(a.job.source),
      escape(a.job.location ?? ""),
      escape(a.status),
      escape(a.appliedAt.toISOString()),
      a.matchScoreAtApply ?? "",
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

export async function withdrawApplication(profileId: string, applicationId: string, note?: string) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application || application.profileId !== profileId) {
    throw new ApplicationServiceError("This application could not be found.", "NOT_FOUND");
  }
  if (application.status === "WITHDRAWN") return application;

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "WITHDRAWN",
      events: { create: { fromStatus: application.status, toStatus: "WITHDRAWN", note } },
    },
  });
  return updated;
}
