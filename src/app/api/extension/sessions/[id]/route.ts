import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { revokeExtensionSession } from "@/lib/extension/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    await revokeExtensionSession(user.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
