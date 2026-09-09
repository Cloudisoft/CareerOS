import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { setUserStatus } from "@/lib/admin/service";
import { updateUserStatusSchema } from "@/lib/validations/admin";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requirePlatformAdmin();
    const { status } = updateUserStatusSchema.parse(await req.json());
    const updated = await setUserStatus(user.id, params.id, status, ipFromRequest(req));
    return apiOk({ user: updated });
  } catch (error) {
    return apiCatch(error);
  }
}
