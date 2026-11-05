import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { scoreJobsForProfile } from "@/lib/matching/service";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { refreshBoardJobs, isBoardScanRunning } from "@/lib/jobs/boards/store";
import { apiCatch, apiOk } from "@/lib/api-response";
import { activeCampaignJobIds } from "@/lib/enterprise/boosts";
import { isUsZipCode, resolveZip, resolveLocationCoords } from "@/lib/geo/zip";
import { resolveCity, haversineMiles } from "@/lib/geo/distance";
import type { Prisma } from "@prisma/client";
import { CITIZENS_ONLY, VISA_NEGATIVE, VISA_POSITIVE, closingInDays } from "@/lib/jobs/signals";
import { COUNTRIES, isCountryCode } from "@/lib/jobs/countries";

const PAGE_SIZE = 20;
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
    const visaOnly = params.get("visa") === "1";
    const closingSoon = params.get("closing") === "1";
    const noExperience = params.get("experience") === "none";
    const studentsOnly = params.get("opt") === "1";
    const openToAll = params.get("open") === "1";
    const country = params.get("country");
    const radiusMiles = Math.max(1, Number(params.get("radius")) || DEFAULT_RADIUS_MILES);
    // A US zip code gets a real radius search; any other text matches the job's location.
    const zipSearch = location && isUsZipCode(location) ? resolveZip(location) : null;

    // Greenhouse, Lever, Ashby and Workday postings that fit the candidate join the Adzuna listings here.
    // The scan runs at most every few hours per person, always in the background, so search answers
    // straight away from what is stored; `refreshing` tells the page to quietly reload once it lands.
    const user = await getSessionUser();
    let refreshing = false;
    if (user && user.role === "CANDIDATE" && page === 1) {
      void refreshBoardJobs(user.id);
      refreshing = isBoardScanRunning(user.id);
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
      ...(closingSoon ? { expiresAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) } } : {}),
    };
    const extra: Prisma.JobWhereInput[] = [];
    if (visaOnly) {
      // Postings that offer sponsorship and don't also refuse it (same vocabulary as the detail pane).
      extra.push({ OR: VISA_POSITIVE.map((k) => ({ description: { contains: k, mode: "insensitive" as const } })) });
      for (const k of VISA_NEGATIVE) extra.push({ NOT: { description: { contains: k, mode: "insensitive" } } });
    }
    if (studentsOnly) {
      extra.push({ OR: ["opt/cpt", "cpt/opt", "stem opt", " opt ", "cpt", "f-1", "student visa", "graduate visa", "post-study work"].map((k) => ({ description: { contains: k, mode: "insensitive" as const } })) });
    }
    if (openToAll) {
      for (const k of CITIZENS_ONLY) extra.push({ NOT: { description: { contains: k, mode: "insensitive" } } });
    }
    if (isCountryCode(country)) {
      // Remote roles are open across countries, so they stay in.
      extra.push({ OR: [{ workplaceType: "REMOTE" }, ...COUNTRIES[country].match.map((k) => ({ location: { contains: k, mode: "insensitive" as const } }))] });
    }
    if (noExperience) {
      extra.push({
        OR: [
          { careerLevel: "ENTRY" },
          { employmentType: "INTERNSHIP" },
          ...["no experience", "entry level", "entry-level", "new grad", "recent graduate"].map((k) => ({ description: { contains: k, mode: "insensitive" as const } })),
          ...["junior", "entry level", "graduate", "intern"].map((k) => ({ title: { contains: k, mode: "insensitive" as const } })),
        ],
      });
    }
    if (extra.length) where.AND = extra;

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
    const savedIds = new Set<string>();
    if (profileId && jobs.length) {
      const saved = await prisma.savedJob.findMany({ where: { profileId, jobId: { in: jobs.map((j) => j.id) } }, select: { jobId: true } });
      saved.forEach((s) => savedIds.add(s.jobId));
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
        closingInDays: closingInDays(job.expiresAt),
        saved: savedIds.has(job.id),
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
      refreshing,
    });
  } catch (error) {
    return apiCatch(error);
  }
}
