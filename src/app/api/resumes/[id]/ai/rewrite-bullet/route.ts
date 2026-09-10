import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getResume } from "@/lib/resume/service";
import { rewriteResumeBullet } from "@/lib/resume/ai";
import { rewriteBulletSchema } from "@/lib/validations/resume";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await requireEntitlement(user.id, "resumeOptimization");
    const resume = await getResume(profile.id, params.id); // ownership check
    const input = rewriteBulletSchema.parse(await req.json());

    // A manually pasted job title/description wins if given; otherwise fall
    // back to the resume's live target job (fetched fresh, not the client's).
    let jobTitle = input.jobTitle;
    let jobDescription = input.jobDescription;
    if (!jobDescription && resume.targetJobId) {
      const job = await prisma.job.findUnique({ where: { id: resume.targetJobId } });
      if (job && job.status === "OPEN") {
        jobTitle = jobTitle || job.title;
        jobDescription = job.description;
      }
    }

    const result = await rewriteResumeBullet({
      bullet: input.bullet,
      jobTitle,
      jobDescription,
      executiveMode: entitlements.executiveMode,
    });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
