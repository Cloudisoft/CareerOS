import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getResume } from "@/lib/resume/service";
import { computeAtsScore } from "@/lib/ats/scanner";
import { atsScanSchema, resumeContentSchema } from "@/lib/validations/resume";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "atsScanner");
    const input = atsScanSchema.parse(await req.json());

    const resume = await getResume(profile.id, input.resumeId);
    const content = resumeContentSchema.parse(resume.content);

    let jobDescription = input.jobDescription ?? "";
    if (input.jobId) {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } });
      if (!job) return apiError("This job could not be found.", 404, "NOT_FOUND");
      jobDescription = job.description;
    }
    if (!jobDescription.trim()) {
      return apiError("Paste a job description or select a job to scan against.", 422, "VALIDATION_ERROR");
    }

    const result = await computeAtsScore(content, jobDescription);

    const scoreRecord = await prisma.resumeScore.create({
      data: {
        resumeId: resume.id,
        jobId: input.jobId ?? null,
        score: result.score,
        keywordScore: result.keywordScore,
        formatScore: result.formatScore,
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
        recommendations: result.recommendations,
      },
    });

    return apiOk({ result, scoreId: scoreRecord.id });
  } catch (error) {
    return apiCatch(error);
  }
}
