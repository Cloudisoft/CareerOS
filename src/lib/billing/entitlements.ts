import "server-only";
import { prisma } from "@/lib/prisma";
import { PLANS, getPlan, type Entitlements, type AddOnKey } from "@/lib/billing/plans";

const FREE_ENTITLEMENTS: Entitlements = getPlan("FREE").entitlements;

export interface UserEntitlements extends Entitlements {
  planKey: string | null;
  addOns: AddOnKey[];
}

/**
 * Career OS's Free plan is always available with no subscription — see
 * `getPlan("FREE")` in plans.ts for exactly what it includes. Everything
 * beyond that is gated per-plan (see plans.ts) or by a standalone add-on.
 *
 * `DEV_GRANT_PLAN` is a development-only escape hatch (never honored when
 * PayPal is configured or in production) so gated features are testable
 * without a real subscription. See .env.example.
 */
export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.PAYPAL_CLIENT_ID &&
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

  const hasResumeStudio = activeAddOns.includes("RESUME_STUDIO");
  const hasInterviewAiAddOn = activeAddOns.includes("INTERVIEW_AI");

  return {
    ...base,
    // The Resume Studio add-on bundles unlimited resumes, cover letters, and
    // full ATS detail regardless of the base plan — see plans.ts's ADD_ONS entry.
    resumeOptimization: base.resumeOptimization || hasResumeStudio,
    resumeImportLimit: hasResumeStudio ? Infinity : base.resumeImportLimit,
    coverLetterStudio: base.coverLetterStudio || hasResumeStudio,
    atsScanner: base.atsScanner || hasResumeStudio,
    atsScannerDetail: base.atsScannerDetail || hasResumeStudio,
    // The Interview AI add-on bundles unlimited, company-targeted sessions.
    interviewAi: base.interviewAi || hasInterviewAiAddOn,
    interviewSessionMonthlyLimit: hasInterviewAiAddOn ? Infinity : base.interviewSessionMonthlyLimit,
    companyInterviewPrep: base.companyInterviewPrep || hasInterviewAiAddOn,
    planKey: isActive ? subscription!.plan : null,
    addOns: activeAddOns,
  };
}

/**
 * `Infinity` (an unlimited allotment) doesn't survive JSON — it serializes
 * to `null`. Do that conversion explicitly wherever entitlements cross the
 * API boundary, so the client can treat `null` as the documented "unlimited"
 * sentinel instead of silently receiving one by accident.
 */
export function serializeEntitlements<T extends object>(entitlements: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entitlements)) {
    out[key] = value === Infinity ? null : value;
  }
  return out as T;
}

export class EntitlementError extends Error {
  code = "UPGRADE_REQUIRED";
}

/** For plain boolean/on-off gates and "0 blocks, any positive or Infinity allows" numeric caps. */
export async function requireEntitlement(userId: string, key: keyof Entitlements) {
  const entitlements = await getEntitlements(userId);
  const value = entitlements[key];
  if (value === false || value === 0) {
    throw new EntitlementError(`This feature requires a plan upgrade.`);
  }
  return entitlements;
}
