import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { markRead } from "@/lib/notifications/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    await markRead(user.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
