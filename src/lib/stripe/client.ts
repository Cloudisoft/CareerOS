import "server-only";
import Stripe from "stripe";

export class StripeNotConfiguredError extends Error {
  code = "BILLING_NOT_CONFIGURED";
  constructor() {
    super("Billing isn't configured in this environment. Set STRIPE_SECRET_KEY to enable it.");
  }
}

let cachedClient: Stripe | null = null;

/** Throws a clear, typed error (never a raw SDK crash) when Stripe isn't configured. */
export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new StripeNotConfiguredError();

  cachedClient = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });
  return cachedClient;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
