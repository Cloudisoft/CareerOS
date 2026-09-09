import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema } from "@/lib/validations/application";
import { createApplication } from "@/lib/applications/service";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { ApplicationStatus, ApplicationSource } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const status = req.nextUrl.searchParams.get("status") as ApplicationStatus | null;
    const source = req.nextUrl.searchParams.get("source") as ApplicationSource | null;
    const limitParam = req.nextUrl.searchParams.get("limit");

    const applications = await prisma.application.findMany({
      where: { profileId: profile.id, ...(status ? { status } : {}), ...(source ? { source } : {}) },
      include: { job: { include: { company: true } } },
      orderBy: { appliedAt: "desc" },
      ...(limitParam ? { take: Math.min(Number(limitParam) || 20, 100) } : {}),
    });

    return apiOk({
      applications: applications.map((a) => ({
        id: a.id,
        status: a.status,
        source: a.source,
        appliedAt: a.appliedAt,
        matchScoreAtApply: a.matchScoreAtApply,
        job: {
          id: a.job.id,
          title: a.job.title,
          location: a.job.location,
          workplaceType: a.job.workplaceType,
          company: { name: a.job.company.name, slug: a.job.company.slug },
        },
      })),
    });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = createApplicationSchema.parse(await req.json());
    const application = await createApplication(profile.id, input, "MANUAL");
    return apiOk({ application });
  } catch (error) {
    return apiCatch(error);
  }
}
