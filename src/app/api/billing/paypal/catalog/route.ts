import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { PLANS, ADD_ONS, type PayablePlanKey, type AddOnKey } from "@/lib/billing/plans";
import { getPlanPayPalId, getAddOnPayPalId } from "@/lib/paypal/plans";
import { isPayPalConfigured } from "@/lib/paypal/client";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/** Gives the checkout page what it needs to mount a PayPal subscribe button, without exposing the plan ID env vars directly to the client bundle. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    if (!isPayPalConfigured()) return apiError("Billing isn't configured in this environment.", 503, "BILLING_NOT_CONFIGURED");

    const kind = req.nextUrl.searchParams.get("kind");
    const key = req.nextUrl.searchParams.get("key");
    if (kind !== "plan" && kind !== "addon") return apiError("Invalid request.", 422, "INVALID_INPUT");
    if (!key) return apiError("Invalid request.", 422, "INVALID_INPUT");

    const planId =
      kind === "plan"
        ? PLANS.some((p) => p.key === key && p.key !== "FREE")
          ? getPlanPayPalId(key as PayablePlanKey)
          : null
        : ADD_ONS.some((a) => a.key === key)
          ? getAddOnPayPalId(key as AddOnKey)
          : null;
    if (!planId) return apiError("Unknown plan.", 422, "INVALID_PLAN");

    return apiOk({
      clientId: process.env.PAYPAL_CLIENT_ID,
      planId,
      userId: user.id,
    });
  } catch (error) {
    return apiCatch(error);
  }
}
