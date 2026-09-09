import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { identityStepSchema } from "@/lib/validations/profile";
import { saveIdentityStep } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    const input = identityStepSchema.parse(await req.json());
    const scores = await saveIdentityStep(user.id, profile.id, profile.onboardingStep, input);
    return apiOk({ scores });
  } catch (error) {
    return apiCatch(error);
  }
}
