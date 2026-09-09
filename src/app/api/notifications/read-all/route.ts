import { getSessionUser } from "@/lib/auth/session";
import { markAllRead } from "@/lib/notifications/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    await markAllRead(user.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
