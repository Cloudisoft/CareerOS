import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { educationSchema } from "@/lib/validations/profile";
import { addEducation } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const input = educationSchema.parse(await req.json());
    const education = await addEducation(profile.id, input);
    return apiOk({ education });
  } catch (error) {
    return apiCatch(error);
  }
}
