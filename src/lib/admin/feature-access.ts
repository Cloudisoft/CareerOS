import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import { addMonths, AdminPlanError } from "@/lib/admin/plans";

/**
 * Platform-admin tool to give one account Interview AI and/or Learning Hub on their own, for a set time
 * (1, 3, 6 or 12 months), e.g. for someone who joined offline. Like granted plans, these are never charged
 * and end on their own: an add-on with no PayPal subscription stops counting at currentPeriodEnd (see
 * getEntitlements). An add-on the person is paying for through PayPal is left alone.
 */

export const FEATURES = ["INTERVIEW_AI", "LEARNING_HUB"] as const;
export type GrantableFeature = (typeof FEATURES)[number];
export const FEATURE_LABEL: Record<GrantableFeature, string> = { INTERVIEW_AI: "Interview AI", LEARNING_HUB: "Learning Hub" };

export const grantFeatureSchema = z.object({
  userId: z.string().trim().min(1, "Pick an account"),
  features: z.array(z.enum(FEATURES)).min(1, "Pick Interview AI, Learning Hub or both").max(2),
  months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
});

export const revokeFeatureSchema = z.object({ userId: z.string().trim().min(1), feature: z.enum(FEATURES) });

/** Accounts matching a name or email, for "pick the account" (job seekers first, newest first). */
export async function searchAccounts(q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { email: { contains: term, mode: "insensitive" } },
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true,
      addOnSubscriptions: { select: { addOn: true, status: true, currentPeriodEnd: true, paypalSubscriptionId: true } },
      subscription: { select: { plan: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const now = Date.now();
  return users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
    plan: u.subscription && ["ACTIVE", "TRIALING"].includes(u.subscription.status) ? u.subscription.plan : null,
    access: u.addOnSubscriptions
      .filter((a) => (FEATURES as readonly string[]).includes(a.addOn) && ["ACTIVE", "TRIALING"].includes(a.status))
      .filter((a) => a.paypalSubscriptionId || !a.currentPeriodEnd || a.currentPeriodEnd.getTime() > now)
      .map((a) => ({ feature: a.addOn as GrantableFeature, endsAt: a.currentPeriodEnd, paid: Boolean(a.paypalSubscriptionId) })),
  }));
}

export async function grantFeatures(adminUserId: string, input: z.infer<typeof grantFeatureSchema>) {
  const user = await prisma.user.findFirst({ where: { id: input.userId, deletedAt: null }, select: { id: true, email: true } });
  if (!user) throw new AdminPlanError("That account no longer exists.", "NOT_FOUND");
  const endsAt = addMonths(new Date(), input.months);
  const results: { feature: GrantableFeature; endsAt: Date }[] = [];
  for (const feature of Array.from(new Set(input.features))) {
    const current = await prisma.addOnSubscription.findUnique({ where: { userId_addOn: { userId: user.id, addOn: feature } } });
    if (current?.paypalSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(current.status)) {
      throw new AdminPlanError(`${user.email} already pays for ${FEATURE_LABEL[feature]} through PayPal. Cancel that first so they aren't charged twice.`, "CONFLICT");
    }
    const data = { status: "ACTIVE" as const, paypalSubscriptionId: null, currentPeriodEnd: endsAt, cancelAtPeriodEnd: false };
    await prisma.addOnSubscription.upsert({
      where: { userId_addOn: { userId: user.id, addOn: feature } },
      create: { userId: user.id, addOn: feature, ...data },
      update: data,
    });
    results.push({ feature, endsAt });
  }
  await writeAuditLog({
    userId: adminUserId,
    action: "admin.access.granted",
    targetType: "user",
    targetId: user.id,
    metadata: { features: results.map((r) => r.feature), months: input.months, endsAt: endsAt.toISOString() },
  });
  return { email: user.email, features: results.map((r) => r.feature), endsAt };
}

export async function revokeFeature(adminUserId: string, input: z.infer<typeof revokeFeatureSchema>) {
  const current = await prisma.addOnSubscription.findUnique({ where: { userId_addOn: { userId: input.userId, addOn: input.feature } } });
  if (!current || current.paypalSubscriptionId || !["ACTIVE", "TRIALING"].includes(current.status)) {
    throw new AdminPlanError(`This account has no granted ${FEATURE_LABEL[input.feature]} access to end.`, "NOT_FOUND");
  }
  await prisma.addOnSubscription.update({
    where: { userId_addOn: { userId: input.userId, addOn: input.feature } },
    data: { status: "CANCELED", currentPeriodEnd: new Date() },
  });
  await writeAuditLog({ userId: adminUserId, action: "admin.access.revoked", targetType: "user", targetId: input.userId, metadata: { feature: input.feature } });
}

/** Interview AI and Learning Hub access given by an admin that is still running, soonest end first. */
export async function listFeatureGrants() {
  const rows = await prisma.addOnSubscription.findMany({
    where: { addOn: { in: [...FEATURES] }, paypalSubscriptionId: null, status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { gt: new Date() } },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    orderBy: { currentPeriodEnd: "asc" },
    take: 300,
  });
  return rows.map((r) => ({
    userId: r.user.id,
    who: `${r.user.firstName} ${r.user.lastName}`.trim(),
    email: r.user.email,
    feature: r.addOn as GrantableFeature,
    endsAt: r.currentPeriodEnd,
  }));
}
