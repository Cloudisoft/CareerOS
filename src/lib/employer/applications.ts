import "server-only";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import type { ApplicationStatus } from "@prisma/client";

export class EmployerApplicationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const CANDIDATE_INCLUDE = {
  profile: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } } } },
  job: { select: { id: true, title: true, companyId: true } },
  resume: { select: { id: true, name: true } },
} as const;

export async function listApplicationsForCompany(companyId: string, filters: { jobId?: string; status?: ApplicationStatus }) {
  return prisma.application.findMany({
    where: {
      job: { companyId },
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { appliedAt: "desc" },
    include: CANDIDATE_INCLUDE,
  });
}

export async function updateApplicationStatusForCompany(
  companyId: string,
  applicationId: string,
  status: ApplicationStatus,
  note?: string
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { companyId } },
    include: CANDIDATE_INCLUDE,
  });
  if (!application) throw new EmployerApplicationError("This application could not be found.", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id: applicationId },
      data: { status },
      include: CANDIDATE_INCLUDE,
    });
    await tx.applicationEvent.create({
      data: { applicationId, fromStatus: application.status, toStatus: status, note: note || null },
    });
    return app;
  });

  await createNotification({
    userId: application.profile.user.id,
    type: "APPLICATION_UPDATE",
    title: `Your application for ${application.job.title} was updated`,
    body: STATUS_LABEL[status],
    linkUrl: "/applications",
  });

  return updated;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  VIEWED: "Your application was viewed by the employer",
  SCREENING: "You've moved to screening",
  INTERVIEW: "You've been invited to interview",
  OFFER: "You've received an offer",
  REJECTED: "The employer has moved forward with other candidates",
  WITHDRAWN: "Withdrawn",
};
