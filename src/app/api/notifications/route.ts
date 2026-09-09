import { getSessionUser } from "@/lib/auth/session";
import { listNotifications, unreadCount } from "@/lib/notifications/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const [notifications, unread] = await Promise.all([
      listNotifications(user.id),
      unreadCount(user.id),
    ]);
    return apiOk({ notifications, unread });
  } catch (error) {
    return apiCatch(error);
  }
}
