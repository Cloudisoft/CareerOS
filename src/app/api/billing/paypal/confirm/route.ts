import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PLANS, ADD_ONS, type PayablePlanKey, type AddOnKey } from "@/lib/billing/plans";
import { getPlanPayPalId, getAddOnPayPalId } from "@/lib/paypal/plans";
import { getSubscriptionDetails } from "@/lib/paypal/subscriptions";
import { paypalConfirmSchema } from "@/lib/validations/billing";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/**
 * Confirms a PayPal subscription the client just approved and persists it —
 * this is the server-side source of truth (never trust the client's own
 * claim of which plan it approved). The webhook keeps things in sync after
 * this point, but the user sees their new entitlements immediately rather
 * than waiting on webhook delivery.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { subscriptionID, kind, key } = paypalConfirmSchema.parse(await req.json());

    const expectedPlanId =
      kind === "plan"
        ? PLANS.some((p) => p.key === key && p.key !== "FREE")
          ? getPlanPayPalId(key as PayablePlanKey)
          : null
        : ADD_ONS.some((a) => a.key === key)
          ? getAddOnPayPalId(key as AddOnKey)
          : null;
    if (!expectedPlanId) return apiError("Unknown plan.", 422, "INVALID_PLAN");

    const details = await getSubscriptionDetails(subscriptionID);

    if (details.plan_id !== expectedPlanId) {
      return apiError("This subscription doesn't match the requested plan.", 422, "PLAN_MISMATCH");
    }
    if (details.status !== "ACTIVE") {
      return apiError(`PayPal reports this subscription as ${details.status.toLowerCase()}, not active yet.`, 409, "NOT_ACTIVE");
    }

    const currentPeriodEnd = details.billing_info?.next_billing_time ? new Date(details.billing_info.next_billing_time) : null;

    if (kind === "plan") {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, plan: key as PayablePlanKey, status: "ACTIVE", paypalSubscriptionId: subscriptionID, currentPeriodEnd },
        update: { plan: key as PayablePlanKey, status: "ACTIVE", paypalSubscriptionId: subscriptionID, currentPeriodEnd, cancelAtPeriodEnd: false },
      });
    } else {
      await prisma.addOnSubscription.upsert({
        where: { userId_addOn: { userId: user.id, addOn: key as AddOnKey } },
        create: { userId: user.id, addOn: key as AddOnKey, status: "ACTIVE", paypalSubscriptionId: subscriptionID, currentPeriodEnd },
        update: { status: "ACTIVE", paypalSubscriptionId: subscriptionID, currentPeriodEnd, cancelAtPeriodEnd: false },
      });
    }

    return apiOk({ confirmed: true });
  } catch (error) {
    return apiCatch(error);
  }
}
