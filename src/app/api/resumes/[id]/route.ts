import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { updateResumeSchema } from "@/lib/validations/resume";
import { getResume, updateResume, deleteResume } from "@/lib/resume/service";
import { closeExpiredJobs } from "@/lib/jobs/lifecycle";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await closeExpiredJobs();
    const resume = await getResume(profile.id, params.id);

    let targetJob = null;
    if (resume.targetJobId) {
      const job = await prisma.job.findUnique({
        where: { id: resume.targetJobId },
        include: { company: true },
      });
      targetJob = job
        ? { id: job.id, title: job.title, company: job.company.name, status: job.status }
        : null;
    }

    return apiOk({ resume, targetJob });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const patch = updateResumeSchema.parse(await req.json());
    const resume = await updateResume(profile.id, params.id, patch);
    return apiOk({ resume });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await deleteResume(profile.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
