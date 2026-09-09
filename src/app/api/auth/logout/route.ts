import { destroySession } from "@/lib/auth/session";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST() {
  try {
    await destroySession();
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
