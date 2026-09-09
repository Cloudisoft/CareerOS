import { getSessionUser } from "@/lib/auth/session";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const url = await createBillingPortalSession(user);
    return apiOk({ url });
  } catch (error) {
    return apiCatch(error);
  }
}
