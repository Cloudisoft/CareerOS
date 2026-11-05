import "server-only";
import { prisma } from "@/lib/prisma";

export interface DashboardJob {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  createdAt: Date;
  matchScore: number | null;
  company: { name: string; slug: string; logoUrl: string | null };
}

const JOB_SELECT = {
  id: true,
  title: true,
  location: true,
  workplaceType: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  createdAt: true,
  company: { select: { name: true, slug: true, logoUrl: true } },
} as const;

/**
 * Jobs for the home page: the person's best cached matches first, topped up
 * with the newest open roles. Reads only stored data, so it is fast.
 */
export async function recommendedJobs(profileId: string | null, take = 6): Promise<DashboardJob[]> {
  const open = { status: "OPEN" as const, deletedAt: null };
  const notApplied = profileId ? { applications: { none: { profileId } } } : {};
  const matches = profileId
    ? await prisma.jobMatch.findMany({
        where: { profileId, job: { ...open, ...notApplied } },
        orderBy: { score: "desc" },
        take,
        select: { score: true, job: { select: JOB_SELECT } },
      })
    : [];
  const jobs: DashboardJob[] = matches.map((m) => ({ ...m.job, matchScore: m.score }));
  if (jobs.length < take) {
    const recent = await prisma.job.findMany({
      where: { ...open, ...notApplied, id: { notIn: jobs.map((j) => j.id) } },
      orderBy: { createdAt: "desc" },
      take: take - jobs.length,
      select: JOB_SELECT,
    });
    jobs.push(...recent.map((j) => ({ ...j, matchScore: null })));
  }
  return jobs;
}

/** Companies with the most open roles right now. */
export async function companiesHiring(take = 5) {
  const groups = await prisma.job.groupBy({
    by: ["companyId"],
    where: { status: "OPEN", deletedAt: null, company: { deletedAt: null } },
    _count: { _all: true },
    orderBy: { _count: { companyId: "desc" } },
    take,
  });
  if (!groups.length) return [];
  const companies = await prisma.company.findMany({
    where: { id: { in: groups.map((g) => g.companyId) } },
    select: { id: true, name: true, slug: true, logoUrl: true, industry: true },
  });
  const byId = new Map(companies.map((c) => [c.id, c]));
  return groups
    .map((g) => {
      const c = byId.get(g.companyId);
      return c ? { ...c, openJobs: g._count._all } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/** Application counts for the pipeline strip. */
export async function applicationSummary(profileId: string | null) {
  if (!profileId) return { applied: 0, interviewing: 0, offers: 0, saved: 0 };
  const [byStatus, saved] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], where: { profileId }, _count: { _all: true } }),
    prisma.savedJob.count({ where: { profileId } }),
  ]);
  const count = (...statuses: string[]) => byStatus.filter((s) => statuses.includes(s.status)).reduce((n, s) => n + s._count._all, 0);
  return {
    applied: count("APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"),
    interviewing: count("SCREENING", "INTERVIEW"),
    offers: count("OFFER"),
    saved,
  };
}

/**
 * Applications that are due a follow-up, on the cadence career-ops uses
 * (modes/followup.md): first nudge 7 days after applying, then every 7 days,
 * and after two follow-ups the application is treated as gone quiet.
 * "Due" is measured from the last status change, so any reply resets it.
 */
export async function followUpsDue(profileId: string | null, take = 3) {
  if (!profileId) return [];
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const rows = await prisma.application.findMany({
    where: { profileId, status: { in: ["APPLIED", "VIEWED"] }, updatedAt: { lte: weekAgo }, job: { status: "OPEN" } },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      appliedAt: true,
      updatedAt: true,
      job: { select: { id: true, title: true, company: { select: { name: true, logoUrl: true } } } },
    },
  });
  return rows
    .map((a) => {
      const days = Math.floor((Date.now() - a.updatedAt.getTime()) / 86_400_000);
      return { ...a, days, quiet: days >= 21 };
    })
    .filter((a) => !a.quiet)
    .slice(0, take);
}
