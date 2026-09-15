import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";
import { prisma } from "@/lib/prisma";
import { syncExternalJobs } from "@/lib/jobs/external/sync";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { scoreJobsForProfile } from "@/lib/matching/service";
import { extCatch, extError, extOk } from "@/lib/extension/response";
import { rateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

// Below this many already-open matching postings, pull a fresh batch from
// Adzuna/JSearch before answering — keeps results current without hitting
// those APIs (which have real quotas) on every single "Find jobs" click.
const MIN_FRESH_RESULTS = 15;
const MAX_RESULTS = 60;

/** Adzuna wants a 2-letter country code; the profile only has free-text
    location. A light guess beats defaulting everyone to "us". */
function guessCountryCode(location: string | null): string {
  const l = (location || "").toLowerCase();
  if (/\bindia\b/.test(l)) return "in";
  if (/\bunited kingdom\b|\buk\b/.test(l)) return "gb";
  if (/\bcanada\b/.test(l)) return "ca";
  if (/\baustralia\b/.test(l)) return "au";
  return "us";
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireExtensionUser(req);

    const limit = rateLimit(`ext-jobs:${user.id}`, 10, 60 * 1000);
    if (!limit.allowed) return extError("Too many requests — try again in a minute.", 429);

    const candidateProfile = await getOrCreateCandidateProfile(user.id);
    const titles = (candidateProfile.desiredTitles.length ? candidateProfile.desiredTitles : candidateProfile.targetTitles).slice(0, 2);

    if (!titles.length) {
      return extOk({ jobs: [], message: "Add at least one target role on CareerOS to start finding jobs." });
    }

    await closeExpiredJobs();

    const where: Prisma.JobWhereInput = {
      status: "OPEN",
      deletedAt: null,
      OR: titles.map((t) => ({ title: { contains: t, mode: "insensitive" as const } })),
    };

    const existingCount = await prisma.job.count({ where });
    if (existingCount < MIN_FRESH_RESULTS) {
      // Best-effort: a source being down or unconfigured shouldn't block
      // serving whatever's already in the marketplace.
      await syncExternalJobs(titles, { country: guessCountryCode(candidateProfile.location) }).catch(() => {});
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: MAX_RESULTS,
    });

    const scores = await scoreJobsForProfile(candidateProfile.id, jobs.map((j) => j.id));
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://careeros.silverspringstaffing.com").replace(/\/$/, "");

    return extOk({
      jobs: jobs.map((j) => ({
        externalId: j.id,
        title: j.title,
        company: j.company.name,
        location: j.location || "",
        description: j.description.slice(0, 6000),
        url: j.externalUrl || `${appUrl}/jobs/${j.id}`,
        applyUrl: j.externalUrl || `${appUrl}/jobs/${j.id}`,
        postedAt: j.createdAt.getTime(),
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        score: scores.get(j.id) ?? 0,
      })),
    });
  } catch (error) {
    return extCatch(error);
  }
}
