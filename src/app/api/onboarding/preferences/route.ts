import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { preferencesStepSchema } from "@/lib/validations/profile";
import { savePreferencesStep } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = preferencesStepSchema.parse(await req.json());
    const scores = await savePreferencesStep(profile.id, profile.onboardingStep, input);
    return apiOk({ scores });
  } catch (error) {
    return apiCatch(error);
  }
}
