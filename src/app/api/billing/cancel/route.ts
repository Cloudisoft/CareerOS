import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cancelPayPalSubscription } from "@/lib/paypal/subscriptions";
import { cancelSchema } from "@/lib/validations/billing";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

/** PayPal has no hosted billing portal — cancellation is a direct API call we make on the user's behalf. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { target } = cancelSchema.parse(await req.json());

    if (target === "plan") {
      const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
      if (!subscription?.paypalSubscriptionId) return apiError("No active plan to cancel.", 404, "NOT_FOUND");
      await cancelPayPalSubscription(subscription.paypalSubscriptionId, "Canceled by user from Career OS billing settings.");
      await prisma.subscription.update({ where: { userId: user.id }, data: { cancelAtPeriodEnd: true } });
    } else {
      const addOnSubscription = await prisma.addOnSubscription.findUnique({
        where: { userId_addOn: { userId: user.id, addOn: target } },
      });
      if (!addOnSubscription?.paypalSubscriptionId) return apiError("No active add-on to cancel.", 404, "NOT_FOUND");
      await cancelPayPalSubscription(addOnSubscription.paypalSubscriptionId, "Canceled by user from Career OS billing settings.");
      await prisma.addOnSubscription.update({
        where: { userId_addOn: { userId: user.id, addOn: target } },
        data: { cancelAtPeriodEnd: true },
      });
    }

    return apiOk({ canceled: true });
  } catch (error) {
    return apiCatch(error);
  }
}
