import { NextRequest } from "next/server";
import { requireExtensionCandidateProfile } from "@/lib/auth/extension";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";
import { extCatch, extOk } from "@/lib/extension/response";

/** The jobs this person has applied to, newest first, for "which interview is this?" in the extension
    (practice for a job, or Live Copilot during the real one). Interviewing ones come first. */
export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await requireExtensionCandidateProfile(req);
    const entitlements = await requireEntitlement(user.id, "interviewAi");
    const applications = await prisma.application.findMany({
      where: { profileId: profile.id },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: { id: true, status: true, jobId: true, job: { select: { title: true, company: { select: { name: true } } } }, prepPack: { select: { id: true } } },
    });
    const interviewing = (s: string) => (/INTERVIEW|OFFER/.test(s) ? 0 : 1);
    return extOk({
      jobSpecific: Boolean(entitlements.companyInterviewPrep),
      targets: applications
        .sort((a, b) => interviewing(a.status) - interviewing(b.status))
        .map((a) => ({
          applicationId: a.id,
          jobId: a.jobId,
          jobTitle: a.job.title,
          companyName: a.job.company.name,
          status: a.status,
          hasPrepPack: Boolean(a.prepPack),
        })),
    });
  } catch (error) {
    return extCatch(error);
  }
}
