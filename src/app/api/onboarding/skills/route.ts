import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { skillsStepSchema } from "@/lib/validations/profile";
import { saveSkillsStep } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = skillsStepSchema.parse(await req.json());
    const scores = await saveSkillsStep(profile.id, profile.onboardingStep, input);
    return apiOk({ scores });
  } catch (error) {
    return apiCatch(error);
  }
}
