import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { educationSchema } from "@/lib/validations/profile";
import { updateEducation, deleteEducation } from "@/lib/profile/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    const input = educationSchema.parse(await req.json());
    const education = await updateEducation(profile.id, params.id, input);
    return apiOk({ education });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await deleteEducation(profile.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
