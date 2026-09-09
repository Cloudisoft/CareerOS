import { getSessionUser } from "@/lib/auth/session";
import { generatePairingCode } from "@/lib/extension/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { code, expiresAt } = await generatePairingCode(user.id);
    return apiOk({ code, expiresAt });
  } catch (error) {
    return apiCatch(error);
  }
}
