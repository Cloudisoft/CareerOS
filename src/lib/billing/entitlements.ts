import "server-only";
import { prisma } from "@/lib/prisma";
import { PLANS, type Entitlements, type AddOnKey } from "@/lib/billing/plans";

const FREE_ENTITLEMENTS: Entitlements = {
  autoApply: false,
  dailyApplicationLimit: 0,
  jobGpt: false,
  resumeOptimization: false,
  atsScanner: false,
  interviewAi: false,
  learning: false,
  networkFeatures: false,
};

export interface UserEntitlements extends Entitlements {
  planKey: string | null;
  addOns: AddOnKey[];
}

/**
 * Career OS's free tier is the Career Profile, job browsing, matching, and
 * manual applications — always available with no subscription. Everything
 * in `Entitlements` (Auto Apply, Job GPT, AI resume tools, ATS scanner,
 * Interview AI, Learning, network features) requires at least the Basic
 * plan, or the relevant standalone add-on.
 *
 * `DEV_GRANT_PLAN` is a development-only escape hatch (never honored when
 * Stripe is configured or in production) so gated features are testable
 * without a real subscription. See .env.example.
 */
export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.STRIPE_SECRET_KEY &&
    process.env.DEV_GRANT_PLAN
  ) {
    const devPlan = PLANS.find((p) => p.key === process.env.DEV_GRANT_PLAN);
    if (devPlan) {
      return { ...devPlan.entitlements, planKey: devPlan.key, addOns: ["RESUME_STUDIO", "INTERVIEW_AI"] };
    }
  }

  const [subscription, addOnSubs] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.addOnSubscription.findMany({ where: { userId } }),
  ]);

  const activeAddOns = addOnSubs
    .filter((a) => a.status === "ACTIVE" || a.status === "TRIALING")
    .map((a) => a.addOn);

  const isActive = subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING");
  const base = isActive ? PLANS.find((p) => p.key === subscription!.plan)?.entitlements ?? FREE_ENTITLEMENTS : FREE_ENTITLEMENTS;

  return {
    ...base,
    resumeOptimization: base.resumeOptimization || activeAddOns.includes("RESUME_STUDIO"),
    interviewAi: base.interviewAi || activeAddOns.includes("INTERVIEW_AI"),
    planKey: isActive ? subscription!.plan : null,
    addOns: activeAddOns,
  };
}

export class EntitlementError extends Error {
  code = "UPGRADE_REQUIRED";
}

export async function requireEntitlement(userId: string, key: keyof Entitlements) {
  const entitlements = await getEntitlements(userId);
  const value = entitlements[key];
  if (value === false || value === 0) {
    throw new EntitlementError(`This feature requires a plan upgrade.`);
  }
  return entitlements;
}
