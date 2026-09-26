import { NextRequest } from "next/server";
import { requireExtensionUser } from "@/lib/auth/extension";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import { syncExternalJobs } from "@/lib/jobs/external/sync";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { withinRadius } from "@/lib/geo/cities";
import { extOk, extCatch } from "@/lib/extension/response";
import type { Prisma } from "@prisma/client";

/**
 * Broad keyword/location job search for the Chrome extension, run entirely
 * server-side against Career OS's own Adzuna/JSearch keys — see
 * extension/lib/careeros-api.js `getJobs()` and extension/lib/discovery.js's
 * header comment for why this moved out of the browser (no API keys sitting
 * in extension storage, and results are shared/cached across every user
 * instead of refetched per install).
 *
 * Reads from the same `Job` table the marketplace and the admin "Sync
 * external job listings" tool write to (source in ["adzuna","jsearch"]).
 * When a signed-in candidate's own target titles turn up almost nothing —
 * the common case for a niche title nobody has searched yet — this does one
 * best-effort live sync for their top title before answering, so the first
 * person to search something isn't stuck with an empty result waiting on an
 * admin to run the batch job.
 */

const MIN_RESULTS_BEFORE_LIVE_SYNC = 5;
const RESULT_LIMIT = 60;

export async function GET(req: NextRequest) {
  try {
    await closeExpiredJobs();
    const user = await requireExtensionUser(req);
    const entitlements = await getEntitlements(user.id);
    if (!entitlements.autoApply || entitlements.monthlyApplicationLimit === 0) {
      return extOk({ jobs: [], message: "Auto Apply is included from the Free plan — finish onboarding to activate it." });
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidateProfile) {
      return extOk({ jobs: [], message: "Finish your Career Profile in Career OS before running Auto Apply." });
    }

    const titles = candidateProfile.desiredTitles.filter(Boolean).slice(0, 3);
    const location = candidateProfile.desiredLocations.filter(Boolean)[0] ?? null;
    const wantsRemote = candidateProfile.workplaceTypes.includes("REMOTE");

    // The extension passes its own radiusMiles setting along, since that's a
    // client-only preference today (no server column for it yet) — default
    // to a reasonable metro-sized radius when it's missing or malformed.
    const radiusParam = Number(req.nextUrl.searchParams.get("radius"));
    const radiusMiles = Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : 25;

    if (!titles.length) {
      return extOk({ jobs: [], message: "Add at least one target role in your Career Profile." });
    }

    let jobs = await queryCachedJobs(titles, location, radiusMiles, wantsRemote);

    // Nothing worth sending back yet — try one live pull for the top title
    // before giving up, same sources the admin sync uses, keyed the same way
    // so a later real sync just updates these rows rather than duplicating.
    if (jobs.length < MIN_RESULTS_BEFORE_LIVE_SYNC) {
      try {
        await syncExternalJobs([titles[0]], { country: guessCountry(location) });
        jobs = await queryCachedJobs(titles, location, radiusMiles, wantsRemote);
      } catch {
        // No API keys configured, or both sources failed — the cached query
        // above is still a valid (if thin) answer, so this isn't fatal.
      }
    }

    return extOk({ jobs: jobs.slice(0, RESULT_LIMIT) });
  } catch (error) {
    return extCatch(error);
  }
}

async function queryCachedJobs(titles: string[], location: string | null, radiusMiles: number, wantsRemote: boolean) {
  const where: Prisma.JobWhereInput = {
    status: "OPEN",
    deletedAt: null,
    source: { in: ["adzuna", "jsearch"] },
    OR: titles.map((t) => ({ title: { contains: t, mode: "insensitive" } })),
  };

  const rows = await prisma.job.findMany({
    where,
    include: { company: true },
    orderBy: { updatedAt: "desc" },
    take: 300, // filtered further below (radius etc), cheap to overfetch from an indexed query
  });

  const filtered = rows.filter((job) => {
    if (wantsRemote && /\bremote\b/i.test(`${job.title} ${job.location ?? ""}`)) return true;
    if (!location) return true;
    if (job.workplaceType === "REMOTE") return true;

    const inRadius = withinRadius(location, job.location, radiusMiles);
    if (inRadius !== null) return inRadius;
    // Neither city resolved to a known metro — fall back to a plain
    // substring match rather than dropping the posting outright.
    return (job.location ?? "").toLowerCase().includes(location.toLowerCase());
  });

  return filtered.map((job) => ({
    source: job.source,
    externalId: job.externalId,
    title: job.title,
    company: job.company.name,
    location: job.location ?? "",
    description: job.description,
    url: job.externalUrl ?? "",
    applyUrl: job.externalUrl ?? "",
    postedAt: job.updatedAt.getTime(),
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    remote: job.workplaceType === "REMOTE",
  }));
}

function guessCountry(location: string | null): string {
  if (!location) return "us";
  const l = location.toLowerCase();
  if (/india|mumbai|bengaluru|bangalore|delhi|pune|hyderabad|chennai/.test(l)) return "in";
  if (/london|manchester|birmingham|uk|united kingdom/.test(l)) return "gb";
  if (/toronto|vancouver|montreal|canada/.test(l)) return "ca";
  if (/sydney|melbourne|brisbane|perth|australia/.test(l)) return "au";
  return "us";
}
