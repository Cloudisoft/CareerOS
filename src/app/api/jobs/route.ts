import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { scoreJobsForProfile } from "@/lib/matching/service";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { refreshBoardJobs } from "@/lib/jobs/boards/store";
import { apiCatch, apiOk } from "@/lib/api-response";
import { activeCampaignJobIds } from "@/lib/enterprise/boosts";
import { isUsZipCode, resolveZip, resolveLocationCoords } from "@/lib/geo/zip";
import { resolveCity, haversineMiles } from "@/lib/geo/distance";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;
/** How long the first page waits for a candidate's employer-board scan before answering with what is stored. */
const BOARD_SCAN_WAIT_MS = 8000;
const SOURCES = ["greenhouse", "lever", "ashby", "workday", "adzuna", "jsearch", "careeros"];
const DEFAULT_RADIUS_MILES = 25;
type JobRow = Prisma.JobGetPayload<{ include: { company: true; skills: { include: { skill: true } } } }>;

export async function GET(req: NextRequest) {
  try {
    await closeExpiredJobs();
    const params = req.nextUrl.searchParams;
    const q = params.get("q")?.trim();
    const location = params.get("location")?.trim();
    const workplaceTypes = params.get("workplaceType")?.split(",").filter(Boolean);
    const employmentTypes = params.get("employmentType")?.split(",").filter(Boolean);
    const careerLevels = params.get("careerLevel")?.split(",").filter(Boolean);
    const minSalary = params.get("minSalary") ? Number(params.get("minSalary")) : undefined;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const sources = params.get("source")?.split(",").filter((x) => SOURCES.includes(x));
    const sort = params.get("sort");
    const radiusMiles = Math.max(1, Number(params.get("radius")) || DEFAULT_RADIUS_MILES);
    // A US zip code gets a real radius search; any other text matches the job's location.
    const zipSearch = location && isUsZipCode(location) ? resolveZip(location) : null;

    // Greenhouse, Lever, Ashby and Workday postings that fit the candidate join the Adzuna listings here.
    // The scan runs at most every few hours per person; a slow one finishes in the background.
    const user = await getSessionUser();
    if (user && user.role === "CANDIDATE" && page === 1) {
      await Promise.race([refreshBoardJobs(user.id), new Promise((r) => setTimeout(r, BOARD_SCAN_WAIT_MS))]);
    }

    const where: Prisma.JobWhereInput = {
      status: "OPEN",
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(location && !zipSearch ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(workplaceTypes?.length ? { workplaceType: { in: workplaceTypes as never[] } } : {}),
      ...(employmentTypes?.length ? { employmentType: { in: employmentTypes as never[] } } : {}),
      ...(careerLevels?.length ? { careerLevel: { in: careerLevels as never[] } } : {}),
      ...(minSalary ? { salaryMax: { gte: minSalary } } : {}),
      ...(sources?.length ? { source: { in: sources } } : {}),
    };

    let profileId: string | null = null;
    if (user && user.role === "CANDIDATE") {
      profileId = (await prisma.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } }))?.id ?? null;
    }
    // "Best match" (used by the swipe view) leaves out jobs the person already applied to.
    if (sort === "match" && profileId) where.NOT = { applications: { some: { profileId } } };

    // Jobs in an active paid/free campaign boost lead the results, labelled
    // Promoted — but only when they match the search, and never twice.
    const campaignIds = await activeCampaignJobIds();
    const include = { company: true, skills: { include: { skill: true } } } as const;
    const offset = (page - 1) * PAGE_SIZE;
    let jobs: JobRow[];
    let total: number;
    let promotedIds = new Set<string>();

    if (zipSearch) {
      // Distance can't be a SQL filter on the free-text location, so matches are
      // scored here and paginated in memory. Remote jobs always count as in range.
      const all = await prisma.job.findMany({ where, include, orderBy: { createdAt: "desc" }, take: 2000 });
      const inRange = all
        .map((job) => {
          if (job.workplaceType === "REMOTE") return { job, distance: 0 };
          const coords = resolveLocationCoords(job.location) ?? resolveCity(job.location);
          if (!coords) return null;
          const distance = haversineMiles(zipSearch, coords);
          return distance <= radiusMiles ? { job, distance } : null;
        })
        .filter((x): x is { job: JobRow; distance: number } => x !== null)
        .sort((a, b) => a.distance - b.distance);
      const promotedSet = new Set(campaignIds);
      const ordered = [...inRange.filter((x) => promotedSet.has(x.job.id)), ...inRange.filter((x) => !promotedSet.has(x.job.id))];
      promotedIds = new Set(ordered.filter((x) => promotedSet.has(x.job.id)).map((x) => x.job.id));
      total = ordered.length;
      jobs = ordered.slice(offset, offset + PAGE_SIZE).map((x) => x.job);
    } else {
      const promotedJobs = campaignIds.length
        ? await prisma.job.findMany({ where: { AND: [where, { id: { in: campaignIds } }] }, include, orderBy: { createdAt: "desc" }, take: 10 })
        : [];
      promotedIds = new Set(promotedJobs.map((j) => j.id));
      const regularWhere: Prisma.JobWhereInput = promotedIds.size ? { AND: [where, { id: { notIn: Array.from(promotedIds) } }] } : where;
      const fromPromoted = promotedJobs.slice(offset, offset + PAGE_SIZE);
      const [regularJobs, regularTotal] = await Promise.all([
        prisma.job.findMany({
          where: regularWhere,
          include,
          orderBy: { createdAt: "desc" },
          skip: Math.max(0, offset - promotedJobs.length),
          take: PAGE_SIZE - fromPromoted.length,
        }),
        prisma.job.count({ where: regularWhere }),
      ]);
      jobs = [...fromPromoted, ...regularJobs];
      total = regularTotal + promotedJobs.length;
    }

    let scores = new Map<string, number>();
    if (user && user.role === "CANDIDATE" && profileId) {
      const entitlements = await getEntitlements(user.id);
      if (entitlements.matchInsights) scores = await scoreJobsForProfile(profileId, jobs.map((j) => j.id));
    }
    if (sort === "match" && scores.size) {
      // Promoted jobs stay first; the rest are ordered by fit.
      jobs.sort((a, b) => Number(promotedIds.has(b.id)) - Number(promotedIds.has(a.id)) || (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    }

    return apiOk({
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        workplaceType: job.workplaceType,
        employmentType: job.employmentType,
        careerLevel: job.careerLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        createdAt: job.createdAt,
        company: { id: job.company.id, name: job.company.name, slug: job.company.slug, logoUrl: job.company.logoUrl },
        skills: job.skills.map((s) => s.skill.name),
        matchScore: scores.get(job.id) ?? null,
        source: job.source,
        externalUrl: job.externalUrl,
        promoted: promotedIds.has(job.id),
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return apiCatch(error);
  }
}
