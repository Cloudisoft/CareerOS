import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getResume } from "@/lib/resume/service";
import { improveResumeSummary } from "@/lib/resume/ai";
import { improveSummarySchema } from "@/lib/validations/resume";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await getResume(profile.id, params.id); // ownership check
    const input = improveSummarySchema.parse(await req.json());

    const result = await improveResumeSummary({
      currentSummary: input.currentSummary,
      headline: profile.headline ?? undefined,
      currentTitle: profile.currentTitle ?? undefined,
      jobDescription: input.jobDescription,
    });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
