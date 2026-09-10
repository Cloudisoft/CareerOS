import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAndCacheMatch, getProfileForMatching, getJobForMatching } from "@/lib/matching/service";
import type { ApplicationSource } from "@prisma/client";

export class ApplicationServiceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function createApplication(
  profileId: string,
  input: { jobId: string; resumeId?: string; coverLetter?: string },
  source: ApplicationSource = "MANUAL"
) {
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job || job.deletedAt || job.status !== "OPEN") {
    throw new ApplicationServiceError("This job is no longer accepting applications.", "JOB_UNAVAILABLE");
  }
  if (job.source !== "careeros") {
    throw new ApplicationServiceError(
      "This listing is from an external job board — apply on the original posting.",
      "EXTERNAL_JOB"
    );
  }

  const existing = await prisma.application.findUnique({
    where: { profileId_jobId: { profileId, jobId: input.jobId } },
  });
  if (existing) {
    throw new ApplicationServiceError("You've already applied to this job.", "ALREADY_APPLIED");
  }

  if (input.resumeId) {
    const resume = await prisma.resume.findUnique({ where: { id: input.resumeId } });
    if (!resume || resume.profileId !== profileId) {
      throw new ApplicationServiceError("That resume could not be found.", "RESUME_NOT_FOUND");
    }
  }

  const [profileForMatching, jobForMatching] = await Promise.all([
    getProfileForMatching(profileId),
    getJobForMatching(input.jobId),
  ]);
  const match = await computeAndCacheMatch(profileForMatching, jobForMatching);

  const application = await prisma.application.create({
    data: {
      profileId,
      jobId: input.jobId,
      resumeId: input.resumeId,
      coverLetter: input.coverLetter || null,
      status: "APPLIED",
      source,
      matchScoreAtApply: match.score,
      events: { create: { toStatus: "APPLIED" } },
    },
  });

  // Applying implies interest, not completeness — drop the saved-job entry if present.
  await prisma.savedJob.deleteMany({ where: { profileId, jobId: input.jobId } });

  return application;
}

export async function withdrawApplication(profileId: string, applicationId: string, note?: string) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application || application.profileId !== profileId) {
    throw new ApplicationServiceError("This application could not be found.", "NOT_FOUND");
  }
  if (application.status === "WITHDRAWN") return application;

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "WITHDRAWN",
      events: { create: { fromStatus: application.status, toStatus: "WITHDRAWN", note } },
    },
  });
  return updated;
}
