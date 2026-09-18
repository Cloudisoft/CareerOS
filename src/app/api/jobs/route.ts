import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { scoreJobsForProfile } from "@/lib/matching/service";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { apiCatch, apiOk } from "@/lib/api-response";
import { isUsZipCode, resolveZip, resolveLocationCoords } from "@/lib/geo/zip";
import { resolveCity, haversineMiles } from "@/lib/geo/distance";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;
const DEFAULT_RADIUS_MILES = 25;

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
    const sort = params.get("sort");
    const radiusMiles = Math.max(1, Number(params.get("radius")) || DEFAULT_RADIUS_MILES);

    // A zip code can't be matched with a substring search against the free-text
    // Job.location field, so it gets a real radius search instead (see below).
    const zipSearch = location && isUsZipCode(location) ? resolveZip(location) : null;

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
    };

    const user = await getSessionUser();
    let profileId: string | null = null;
    if (user && user.role === "CANDIDATE") {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      profileId = profile?.id ?? null;
    }

    if (sort === "match" && profileId) {
      where.NOT = { applications: { some: { profileId } } };
    }

    let jobs: Prisma.JobGetPayload<{ include: { company: true; skills: { include: { skill: true } } } }>[];
    let total: number;

    if (zipSearch) {
      // Distance can't be expressed as a SQL predicate against the free-text
      // location field, so every open match is scored in JS and the
      // filtered/sorted result is paginated in memory instead of at the DB
      // level. Remote jobs always match — they aren't tied to a place.
      const allMatches = await prisma.job.findMany({
        where,
        include: { company: true, skills: { include: { skill: true } } },
        orderBy: { createdAt: "desc" },
      });

      const withDistance = allMatches
        .map((job) => {
          if (job.workplaceType === "REMOTE") return { job, distance: 0 };
          const coords = resolveLocationCoords(job.location) ?? resolveCity(job.location);
          if (!coords) return null;
          const distance = haversineMiles(zipSearch, coords);
          return distance <= radiusMiles ? { job, distance } : null;
        })
        .filter((x): x is { job: (typeof allMatches)[number]; distance: number } => x !== null)
        .sort((a, b) => a.distance - b.distance);

      total = withDistance.length;
      jobs = withDistance.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((x) => x.job);
    } else {
      [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: { company: true, skills: { include: { skill: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.job.count({ where }),
      ]);
    }

    let scores = new Map<string, number>();
    if (user && user.role === "CANDIDATE" && profileId) {
      const entitlements = await getEntitlements(user.id);
      if (entitlements.matchInsights) {
        scores = await scoreJobsForProfile(profileId, jobs.map((j) => j.id));
      }
    }

    if (sort === "match" && scores.size) {
      jobs.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
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
