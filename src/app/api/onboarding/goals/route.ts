import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { goalsStepSchema } from "@/lib/validations/profile";
import { saveGoalsStepAndComplete } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = goalsStepSchema.parse(await req.json());
    const scores = await saveGoalsStepAndComplete(profile.id, input);
    return apiOk({ scores });
  } catch (error) {
    return apiCatch(error);
  }
}
