import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { PlanKey, AddOnKey } from "@/lib/billing/plans";

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const kind = subscription.metadata.kind;
  if (!userId || !kind) {
    console.warn(`Stripe subscription ${subscription.id} has no userId/kind metadata — skipping sync.`);
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (kind === "plan") {
    const plan = subscription.metadata.plan as PlanKey;
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        plan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } else if (kind === "addon") {
    const addOn = subscription.metadata.addOn as AddOnKey;
    await prisma.addOnSubscription.upsert({
      where: { userId_addOn: { userId, addOn } },
      create: {
        userId,
        addOn,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}

async function recordInvoicePayment(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;
  if (!subscriptionId) return;

  const [subscription, addOnSubscription] = await Promise.all([
    prisma.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } }),
    prisma.addOnSubscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } }),
  ]);
  const userId = subscription?.userId ?? addOnSubscription?.userId;
  if (!userId) return;

  await prisma.payment.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "paid",
      description: invoice.lines.data[0]?.description ?? undefined,
    },
    update: {
      amount: invoice.amount_paid,
      status: invoice.status ?? "paid",
    },
  });
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
      await recordInvoicePayment(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }
}
