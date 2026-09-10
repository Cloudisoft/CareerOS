import "server-only";
import type { PayablePlanKey, AddOnKey } from "@/lib/billing/plans";
import { PayPalNotConfiguredError } from "./client";

const PLAN_ID_ENV: Record<PayablePlanKey, string> = {
  BASIC: "PAYPAL_PLAN_BASIC",
  STANDARD: "PAYPAL_PLAN_STANDARD",
  PREMIUM: "PAYPAL_PLAN_PREMIUM",
  ELITE: "PAYPAL_PLAN_ELITE",
};

const ADDON_PLAN_ID_ENV: Record<AddOnKey, string> = {
  RESUME_STUDIO: "PAYPAL_PLAN_RESUME_STUDIO",
  INTERVIEW_AI: "PAYPAL_PLAN_INTERVIEW_AI",
};

export class PlanIdNotConfiguredError extends PayPalNotConfiguredError {}

export function getPlanPayPalId(plan: PayablePlanKey): string {
  const envVar = PLAN_ID_ENV[plan];
  const planId = process.env[envVar];
  if (!planId) throw new Error(`No PayPal billing plan configured for ${plan}. Set ${envVar}.`);
  return planId;
}

export function getAddOnPayPalId(addOn: AddOnKey): string {
  const envVar = ADDON_PLAN_ID_ENV[addOn];
  const planId = process.env[envVar];
  if (!planId) throw new Error(`No PayPal billing plan configured for add-on ${addOn}. Set ${envVar}.`);
  return planId;
}

export function planFromPayPalId(planId: string): PayablePlanKey | null {
  for (const [plan, envVar] of Object.entries(PLAN_ID_ENV) as [PayablePlanKey, string][]) {
    if (process.env[envVar] === planId) return plan;
  }
  return null;
}

export function addOnFromPayPalId(planId: string): AddOnKey | null {
  for (const [addOn, envVar] of Object.entries(ADDON_PLAN_ID_ENV) as [AddOnKey, string][]) {
    if (process.env[envVar] === planId) return addOn;
  }
  return null;
}
