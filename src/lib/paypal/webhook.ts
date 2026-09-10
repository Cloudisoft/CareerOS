import "server-only";
import { prisma } from "@/lib/prisma";
import { paypalRequest } from "./client";
import { planFromPayPalId, addOnFromPayPalId } from "./plans";
import type { PayPalSubscriptionDetails } from "./subscriptions";

export interface PayPalWebhookHeaders {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
}

/**
 * POST /v1/notifications/verify-webhook-signature — PayPal's server-to-server
 * equivalent of Stripe's local HMAC check. PAYPAL_WEBHOOK_ID comes from the
 * webhook's configuration page in the PayPal developer dashboard.
 */
export async function verifyPayPalWebhookSignature(headers: PayPalWebhookHeaders, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const result = await paypalRequest<{ verification_status: "SUCCESS" | "FAILURE" }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    }
  );
  return result.verification_status === "SUCCESS";
}

function mapStatus(status: PayPalSubscriptionDetails["status"]): "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "SUSPENDED":
      return "PAST_DUE";
    case "CANCELLED":
    case "EXPIRED":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

interface PayPalSubscriptionEventResource {
  id: string;
  plan_id: string;
  status: PayPalSubscriptionDetails["status"];
  custom_id?: string; // userId, set at subscription creation time
  billing_info?: { next_billing_time?: string };
}

async function syncSubscriptionFromResource(resource: PayPalSubscriptionEventResource) {
  const userId = resource.custom_id;
  if (!userId) {
    console.warn(`PayPal subscription ${resource.id} has no custom_id (userId) — skipping sync.`);
    return;
  }

  const status = mapStatus(resource.status);
  const currentPeriodEnd = resource.billing_info?.next_billing_time ? new Date(resource.billing_info.next_billing_time) : null;
  const cancelAtPeriodEnd = status === "CANCELED";

  const plan = planFromPayPalId(resource.plan_id);
  if (plan) {
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, plan, status, paypalSubscriptionId: resource.id, currentPeriodEnd, cancelAtPeriodEnd },
      update: { plan, status, paypalSubscriptionId: resource.id, currentPeriodEnd, cancelAtPeriodEnd },
    });
    return;
  }

  const addOn = addOnFromPayPalId(resource.plan_id);
  if (addOn) {
    await prisma.addOnSubscription.upsert({
      where: { userId_addOn: { userId, addOn } },
      create: { userId, addOn, status, paypalSubscriptionId: resource.id, currentPeriodEnd, cancelAtPeriodEnd },
      update: { status, paypalSubscriptionId: resource.id, currentPeriodEnd, cancelAtPeriodEnd },
    });
    return;
  }

  console.warn(`PayPal subscription ${resource.id} has an unrecognized plan_id ${resource.plan_id} — skipping sync.`);
}

interface PayPalSaleResource {
  id: string;
  amount: { total: string; currency: string };
  billing_agreement_id?: string;
  state: string;
}

async function recordPaymentFromSale(resource: PayPalSaleResource) {
  if (!resource.billing_agreement_id) return;

  const [subscription, addOnSubscription] = await Promise.all([
    prisma.subscription.findFirst({ where: { paypalSubscriptionId: resource.billing_agreement_id } }),
    prisma.addOnSubscription.findFirst({ where: { paypalSubscriptionId: resource.billing_agreement_id } }),
  ]);
  const userId = subscription?.userId ?? addOnSubscription?.userId;
  if (!userId) return;

  await prisma.payment.upsert({
    where: { paypalTransactionId: resource.id },
    create: {
      userId,
      paypalTransactionId: resource.id,
      amount: Math.round(parseFloat(resource.amount.total) * 100),
      currency: resource.amount.currency.toLowerCase(),
      status: resource.state,
    },
    update: { status: resource.state },
  });
}

export interface PayPalWebhookEvent {
  event_type: string;
  resource: Record<string, unknown>;
}

export async function handlePayPalWebhookEvent(event: PayPalWebhookEvent) {
  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.UPDATED":
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
      await syncSubscriptionFromResource(event.resource as unknown as PayPalSubscriptionEventResource);
      break;
    case "PAYMENT.SALE.COMPLETED":
      await recordPaymentFromSale(event.resource as unknown as PayPalSaleResource);
      break;
    default:
      break;
  }
}
