import "server-only";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { getPlanPriceId, getAddOnPriceId } from "@/lib/stripe/prices";
import type { PayablePlanKey, AddOnKey } from "@/lib/billing/plans";
import type { User } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getOrCreateStripeCustomerId(user: User): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user.id },
  });
  return customer.id;
}

export async function createPlanCheckoutSession(user: User, plan: PayablePlanKey) {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomerId(user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPlanPriceId(plan), quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?checkout=success`,
    cancel_url: `${APP_URL}/pricing?checkout=canceled`,
    metadata: { userId: user.id, kind: "plan", plan },
    subscription_data: { metadata: { userId: user.id, kind: "plan", plan } },
  });

  return session.url;
}

export async function createAddOnCheckoutSession(user: User, addOn: AddOnKey) {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomerId(user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getAddOnPriceId(addOn), quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?checkout=success`,
    cancel_url: `${APP_URL}/pricing?checkout=canceled`,
    metadata: { userId: user.id, kind: "addon", addOn },
    subscription_data: { metadata: { userId: user.id, kind: "addon", addOn } },
  });

  return session.url;
}

export async function createBillingPortalSession(user: User) {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomerId(user);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings/billing`,
  });

  return session.url;
}
