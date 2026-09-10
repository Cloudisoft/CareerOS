import "server-only";
import { paypalRequest } from "./client";

export interface PayPalSubscriptionDetails {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount: { value: string; currency_code: string }; time: string };
  };
}

/** GET /v1/billing/subscriptions/{id} — the source of truth after a client-side approval. */
export async function getSubscriptionDetails(subscriptionId: string): Promise<PayPalSubscriptionDetails> {
  return paypalRequest<PayPalSubscriptionDetails>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function cancelPayPalSubscription(subscriptionId: string, reason: string): Promise<void> {
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
