import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import { setFullAccess, fullAccessUserIds } from "@/lib/auth/multi-role";
import { grantComplimentaryPlan } from "@/lib/enterprise/complimentary";
import { AdminError } from "@/lib/admin/service";
import type { AddOnKey } from "@prisma/client";

const ADD_ONS: AddOnKey[] = ["RESUME_STUDIO", "INTERVIEW_AI"];

/**
 * "Full access" for one person: they can switch between the job seeker,
 * employer and platform admin views, with a complimentary Elite plan and
 * both add-ons as a job seeker and a complimentary Enterprise Professional
 * plan for their company. Nothing is charged; nothing expires.
 */
export async function grantFullAccess(adminUserId: string, input: { email: string; companyName?: string }) {
  const user = await prisma.user.findFirst({ where: { email: { equals: input.email.trim(), mode: "insensitive" }, deletedAt: null } });
  if (!user) throw new AdminError("No Career OS account uses that email.", "NOT_FOUND");

  // Never leave a PayPal subscription billing alongside a free plan.
  const [sub, addOns] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.addOnSubscription.findMany({ where: { userId: user.id } }),
  ]);
  const paying = [sub, ...addOns].some((s) => s?.paypalSubscriptionId && (s.status === "ACTIVE" || s.status === "PAST_DUE" || s.status === "TRIALING"));
  if (paying) {
    throw new AdminError(`${user.email} has an active PayPal subscription as a job seeker. Cancel it first so they aren't charged.`, "CONFLICT");
  }

  // Enterprise first: it validates the company (and may create it).
  const enterprise = await grantComplimentaryPlan(adminUserId, {
    email: user.email,
    plan: "PROFESSIONAL",
    companyName: input.companyName,
    allowAnyRole: true,
  });

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "ELITE", status: "ACTIVE" },
      update: { plan: "ELITE", status: "ACTIVE", paypalSubscriptionId: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    }),
    ...ADD_ONS.map((addOn) =>
      prisma.addOnSubscription.upsert({
        where: { userId_addOn: { userId: user.id, addOn } },
        create: { userId: user.id, addOn, status: "ACTIVE" },
        update: { status: "ACTIVE", paypalSubscriptionId: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      })
    ),
  ]);
  await setFullAccess(user.id, true);
  await writeAuditLog({
    userId: adminUserId,
    action: "admin.full_access.granted",
    targetType: "user",
    targetId: user.id,
    metadata: { email: user.email, company: enterprise.company.name, candidatePlan: "ELITE", enterprisePlan: "PROFESSIONAL" },
  });
  return { email: user.email, company: enterprise.company.name };
}

/** Removes the view switcher. Complimentary plans are revoked separately. */
export async function revokeFullAccess(adminUserId: string, userId: string) {
  await setFullAccess(userId, false);
  await writeAuditLog({ userId: adminUserId, action: "admin.full_access.revoked", targetType: "user", targetId: userId });
}

export async function listFullAccess() {
  const ids = await fullAccessUserIds();
  if (!ids.length) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscription: { select: { plan: true, status: true, paypalSubscriptionId: true } },
      companyMemberships: { select: { company: { select: { name: true, enterpriseAccount: { select: { plan: true, status: true, paypalSubscriptionId: true } } } } }, take: 1 },
    },
  });
  return users.map((u) => ({
    userId: u.id,
    email: u.email,
    name: `${u.firstName} ${u.lastName}`,
    candidatePlan: u.subscription?.status === "ACTIVE" ? u.subscription.plan : null,
    company: u.companyMemberships[0]?.company.name ?? null,
    enterprisePlan: u.companyMemberships[0]?.company.enterpriseAccount?.status === "ACTIVE" ? u.companyMemberships[0].company.enterpriseAccount.plan : null,
  }));
}
