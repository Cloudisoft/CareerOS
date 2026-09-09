import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { setResourceStatus } from "@/lib/learning/service";
import { updateProgressSchema } from "@/lib/validations/learning";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { resourceId: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const { status } = updateProgressSchema.parse(await req.json());
    const progress = await setResourceStatus(profile.id, params.resourceId, status);
    return apiOk({ progress });
  } catch (error) {
    return apiCatch(error);
  }
}
