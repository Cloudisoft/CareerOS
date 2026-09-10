import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { computeAndCacheMatch, getProfileForMatching, getJobForMatching } from "@/lib/matching/service";
import { recomputeCareerReadiness } from "@/lib/scoring/career-readiness";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/** "Salary Intelligence" — a real comparison of the posted range against the candidate's own, not a fabricated market estimate. */
function computeSalaryIntelligence(
  desiredMin: number | null,
  desiredMax: number | null,
  jobMin: number | null,
  jobMax: number | null
) {
  const wantMin = desiredMin ?? 0;
  const wantMax = desiredMax ?? Infinity;
  const postedMin = jobMin ?? 0;
  const postedMax = jobMax ?? Infinity;

  const overlapStart = Math.max(wantMin, postedMin);
  const overlapEnd = Math.min(wantMax, postedMax);
  const overlaps = overlapEnd >= overlapStart;

  const wantSpan = wantMax === Infinity ? postedMax - postedMin || 1 : wantMax - wantMin || 1;
  const overlapPercent = overlaps ? Math.round(Math.min(100, ((overlapEnd - overlapStart) / wantSpan) * 100)) : 0;

  return {
    overlapPercent,
    meetsMinimum: postedMax >= wantMin,
    gapAmount: overlaps ? null : Math.round(overlapStart - overlapEnd),
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await closeExpiredJobs();
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { company: true, skills: { include: { skill: true } } },
    });
    if (!job || job.deletedAt) return apiError("This job could not be found.", 404, "NOT_FOUND");

    const user = await getSessionUser();
    let match = null;
    let saved = false;
    let alreadyApplied = false;
    let salaryIntelligence: { overlapPercent: number; meetsMinimum: boolean; gapAmount: number | null } | null = null;

    if (user && user.role === "CANDIDATE") {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (profile) {
        const entitlements = await getEntitlements(user.id);
        const [savedJob, application] = await Promise.all([
          prisma.savedJob.findUnique({ where: { profileId_jobId: { profileId: profile.id, jobId: job.id } } }),
          prisma.application.findUnique({ where: { profileId_jobId: { profileId: profile.id, jobId: job.id } } }),
        ]);
        saved = Boolean(savedJob);
        alreadyApplied = Boolean(application);

        if (entitlements.matchInsights) {
          const [profileForMatching, jobForMatching] = await Promise.all([
            getProfileForMatching(profile.id),
            getJobForMatching(job.id),
          ]);
          match = await computeAndCacheMatch(profileForMatching, jobForMatching);
          await recomputeCareerReadiness(profile.id);
        }

        if (entitlements.salaryIntelligence && (job.salaryMin != null || job.salaryMax != null)) {
          salaryIntelligence = computeSalaryIntelligence(
            profile.desiredSalaryMin,
            profile.desiredSalaryMax,
            job.salaryMin,
            job.salaryMax
          );
        }
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
        source: job.source,
        externalUrl: job.externalUrl,
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
      salaryIntelligence,
    });
  } catch (error) {
    return apiCatch(error);
  }
}
