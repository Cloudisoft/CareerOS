import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { workExperienceSchema } from "@/lib/validations/profile";
import { updateWorkExperience, deleteWorkExperience } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const input = workExperienceSchema.parse(await req.json());
    const experience = await updateWorkExperience(profile.id, params.id, input);
    return apiOk({ experience });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await deleteWorkExperience(profile.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
