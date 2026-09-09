import { getSessionUser } from "@/lib/auth/session";
import { listExtensionSessions } from "@/lib/extension/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const sessions = await listExtensionSessions(user.id);
    return apiOk({
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceLabel: s.deviceLabel,
        lastSeenAt: s.lastSeenAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    });
  } catch (error) {
    return apiCatch(error);
  }
}
