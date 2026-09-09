import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { computeAndCacheMatch, getProfileForMatching, getJobForMatching } from "@/lib/matching/service";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { company: true, skills: { include: { skill: true } } },
    });
    if (!job || job.deletedAt) return apiError("This job could not be found.", 404, "NOT_FOUND");

    const user = await getSessionUser();
    let match = null;
    let saved = false;
    let alreadyApplied = false;

    if (user && user.role === "CANDIDATE") {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (profile) {
        const [profileForMatching, jobForMatching, savedJob, application] = await Promise.all([
          getProfileForMatching(profile.id),
          getJobForMatching(job.id),
          prisma.savedJob.findUnique({ where: { profileId_jobId: { profileId: profile.id, jobId: job.id } } }),
          prisma.application.findUnique({ where: { profileId_jobId: { profileId: profile.id, jobId: job.id } } }),
        ]);
        match = await computeAndCacheMatch(profileForMatching, jobForMatching);
        saved = Boolean(savedJob);
        alreadyApplied = Boolean(application);
        await recomputeCareerReadiness(profile.id);
      }
    }

    return apiOk({
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        workplaceType: job.workplaceType,
        employmentType: job.employmentType,
        careerLevel: job.careerLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        createdAt: job.createdAt,
        company: {
          id: job.company.id,
          name: job.company.name,
          slug: job.company.slug,
          logoUrl: job.company.logoUrl,
          industry: job.company.industry,
          location: job.company.location,
        },
        skills: job.skills.map((s) => ({ name: s.skill.name, required: s.required })),
      },
      match,
      saved,
      alreadyApplied,
    });
  } catch (error) {
    return apiCatch(error);
  }
}
