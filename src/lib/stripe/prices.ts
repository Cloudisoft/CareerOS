import "server-only";
import type { PayablePlanKey, AddOnKey } from "@/lib/billing/plans";

const PLAN_PRICE_ENV: Record<PayablePlanKey, string> = {
  BASIC: "STRIPE_PRICE_BASIC",
  STANDARD: "STRIPE_PRICE_STANDARD",
  PREMIUM: "STRIPE_PRICE_PREMIUM",
  ELITE: "STRIPE_PRICE_ELITE",
};

const ADDON_PRICE_ENV: Record<AddOnKey, string> = {
  RESUME_STUDIO: "STRIPE_PRICE_RESUME_STUDIO",
  INTERVIEW_AI: "STRIPE_PRICE_INTERVIEW_AI",
};

export class PriceNotConfiguredError extends Error {
  code = "PRICE_NOT_CONFIGURED";
}

export function getPlanPriceId(plan: PayablePlanKey): string {
  const envVar = PLAN_PRICE_ENV[plan];
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new PriceNotConfiguredError(`No Stripe price configured for plan ${plan}. Set ${envVar}.`);
  }
  return priceId;
}

export function getAddOnPriceId(addOn: AddOnKey): string {
  const envVar = ADDON_PRICE_ENV[addOn];
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new PriceNotConfiguredError(`No Stripe price configured for add-on ${addOn}. Set ${envVar}.`);
  }
  return priceId;
}

export function planFromPriceId(priceId: string): PayablePlanKey | null {
  for (const [plan, envVar] of Object.entries(PLAN_PRICE_ENV) as [PayablePlanKey, string][]) {
    if (process.env[envVar] === priceId) return plan;
  }
  return null;
}

export function addOnFromPriceId(priceId: string): AddOnKey | null {
  for (const [addOn, envVar] of Object.entries(ADDON_PRICE_ENV) as [AddOnKey, string][]) {
    if (process.env[envVar] === priceId) return addOn;
  }
  return null;
}
