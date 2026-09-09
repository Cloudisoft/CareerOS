import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { workExperienceSchema } from "@/lib/validations/profile";
import { addWorkExperience } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = workExperienceSchema.parse(await req.json());
    const experience = await addWorkExperience(profile.id, input);
    return apiOk({ experience });
  } catch (error) {
    return apiCatch(error);
  }
}
