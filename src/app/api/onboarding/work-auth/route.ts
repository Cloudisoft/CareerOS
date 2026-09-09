import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { workAuthStepSchema } from "@/lib/validations/profile";
import { saveWorkAuthStep } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = workAuthStepSchema.parse(await req.json());
    const scores = await saveWorkAuthStep(profile.id, profile.onboardingStep, input);
    return apiOk({ scores });
  } catch (error) {
    return apiCatch(error);
  }
}
