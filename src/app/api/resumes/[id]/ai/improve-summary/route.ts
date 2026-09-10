import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getResume } from "@/lib/resume/service";
import { improveResumeSummary } from "@/lib/resume/ai";
import { improveSummarySchema } from "@/lib/validations/resume";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await requireEntitlement(user.id, "resumeOptimization");
    const resume = await getResume(profile.id, params.id); // ownership check
    const input = improveSummarySchema.parse(await req.json());

    // A manually pasted description wins if given; otherwise fall back to the
    // resume's live target job (fetched fresh, never the client's own copy).
    let jobDescription = input.jobDescription;
    if (!jobDescription && resume.targetJobId) {
      const job = await prisma.job.findUnique({ where: { id: resume.targetJobId } });
      if (job && job.status === "OPEN") jobDescription = job.description;
    }

    const result = await improveResumeSummary({
      currentSummary: input.currentSummary,
      headline: profile.headline ?? undefined,
      currentTitle: profile.currentTitle ?? undefined,
      jobDescription,
      executiveMode: entitlements.executiveMode,
    });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
