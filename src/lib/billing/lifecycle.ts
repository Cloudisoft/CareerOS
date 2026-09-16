import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Real, cron-free downgrade for subscriptions granted without a PayPal
 * billing agreement — e.g. the 6-month ELITE grants created by the admin
 * provisioning route. Those have no webhook keeping status/currentPeriodEnd
 * in sync, so once currentPeriodEnd passes they need to be downgraded here.
 *
 * A PayPal-billed subscription (paypalSubscriptionId set) is deliberately
 * excluded: its status and currentPeriodEnd are kept current by the PayPal
 * webhook (see lib/paypal/webhook.ts) on every renewal, so this would only
 * ever race that sync, never help it.
 *
 * Cheap and idempotent — safe to call on every entitlements read rather
 * than needing a scheduler. Pass a userId to scope it to one subscription
 * (the common case, hitting the unique index); omit it for the admin-stats
 * sweep across all users.
 */
export async function downgradeExpiredSubscriptions(userId?: string): Promise<number> {
  const result = await prisma.subscription.updateMany({
    where: {
      ...(userId ? { userId } : {}),
      status: { in: ["ACTIVE", "TRIALING"] },
      paypalSubscriptionId: null,
      currentPeriodEnd: { lt: new Date() },
    },
    data: { status: "CANCELED" },
  });
  return result.count;
}
