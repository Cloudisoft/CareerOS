import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { scoreJobsForProfile } from "@/lib/matching/service";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

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
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
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

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { company: true, skills: { include: { skill: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.job.count({ where }),
    ]);

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
