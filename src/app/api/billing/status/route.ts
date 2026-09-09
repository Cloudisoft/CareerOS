import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe/client";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const [entitlements, subscription, payments] = await Promise.all([
      getEntitlements(user.id),
      prisma.subscription.findUnique({ where: { userId: user.id } }),
      prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

    return apiOk({
      entitlements,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
      })),
      billingConfigured: isStripeConfigured(),
    });
  } catch (error) {
    return apiCatch(error);
  }
}
