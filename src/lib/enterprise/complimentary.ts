import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import { createCompanyForUser } from "@/lib/company/service";
import type { EnterpriseAccount, EnterprisePlanKey } from "@prisma/client";
import { EnterpriseError, recordEvent } from "./account";

/**
 * Complimentary Enterprise plans, granted by a platform admin. A
 * complimentary account is ACTIVE on a plan with no PayPal subscription:
 * nothing is ever charged, and its credits reset every calendar month (UTC),
 * like a paid plan's do every billing period. It runs until an admin ends it,
 * or until currentPeriodEnd when the grant was for a set time.
 */
export function isComplimentary(account: Pick<EnterpriseAccount, "status" | "plan" | "paypalSubscriptionId"> | null | undefined) {
  return Boolean(account && account.status === "ACTIVE" && account.plan && !account.paypalSubscriptionId);
}

export interface GrantInput {
  email: string;
  plan: EnterprisePlanKey;
  /** Switch a job-seeker account to an employer account first. Their candidate data is kept. */
  convertToEmployer?: boolean;
  /** Create this company for them if they don't belong to one. */
  companyName?: string;
  /** Full-access accounts reach the employer area through the view switcher, whatever their own role. */
  allowAnyRole?: boolean;
  /** When the plan ends. Omitted means no end date. */
  endsAt?: Date;
}

export async function grantComplimentaryPlan(adminUserId: string, input: GrantInput) {
  const user = await prisma.user.findFirst({ where: { email: { equals: input.email.trim(), mode: "insensitive" }, deletedAt: null } });
  if (!user) throw new EnterpriseError("No Career OS account uses that email.", "NOT_FOUND");

  if (input.allowAnyRole) {
    // no role change: the account switches into the employer view instead
  } else if (user.role === "PLATFORM_ADMIN") {
    throw new EnterpriseError("Platform admin accounts can't hold a company plan. Use the person's employer account.", "VALIDATION_ERROR");
  }
  else if (user.role !== "EMPLOYER" && user.role !== "COMPANY_ADMIN") {
    if (!input.convertToEmployer) {
      throw new EnterpriseError(
        `${user.email} is a job seeker account. Tick "Switch to an employer account" to give it company access.`,
        "NEEDS_EMPLOYER"
      );
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: "EMPLOYER" } });
    await writeAuditLog({ userId: adminUserId, action: "admin.user.role_changed", targetType: "user", targetId: user.id, metadata: { from: user.role, to: "EMPLOYER", reason: "complimentary enterprise plan" } });
  }

  let membership = await prisma.companyMember.findFirst({ where: { userId: user.id }, include: { company: true } });
  if (!membership) {
    const name = input.companyName?.trim();
    if (!name) throw new EnterpriseError(`${user.email} doesn't belong to a company yet. Enter a company name to create one.`, "NEEDS_COMPANY");
    await createCompanyForUser(user.id, { name } as never);
    membership = await prisma.companyMember.findFirst({ where: { userId: user.id }, include: { company: true } });
  }
  const company = membership!.company;

  const account = await prisma.$transaction(async (tx) => {
    const existing = await tx.enterpriseAccount.findUnique({ where: { companyId: company.id } });
    if (existing?.paypalSubscriptionId && ["ACTIVE", "PAST_DUE"].includes(existing.status)) {
      throw new EnterpriseError(
        `${company.name} is paying through PayPal right now. Cancel that subscription first so they aren't charged.`,
        "CONFLICT"
      );
    }
    const data = {
      plan: input.plan,
      status: "ACTIVE" as const,
      paypalSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: input.endsAt ?? null,
      cancelAtPeriodEnd: false,
      introActive: false,
    };
    const acc = existing
      ? await tx.enterpriseAccount.update({ where: { id: existing.id }, data })
      : await tx.enterpriseAccount.create({ data: { companyId: company.id, ...data } });
    await recordEvent(tx, acc.id, {
      type: "COMPLIMENTARY_GRANTED",
      fromStatus: existing?.status ?? null,
      toStatus: "ACTIVE",
      plan: input.plan,
      amountCents: 0,
      actorUserId: adminUserId,
      detail: input.endsAt ? `Complimentary plan — no charge, until ${input.endsAt.toISOString().slice(0, 10)}` : "Complimentary plan — no charge, no expiry",
    });
    return acc;
  });

  await writeAuditLog({ userId: adminUserId, action: "admin.enterprise.complimentary_granted", targetType: "company", targetId: company.id, metadata: { plan: input.plan, email: user.email, endsAt: input.endsAt?.toISOString() ?? null } });
  return { account, company: { id: company.id, name: company.name }, user: { id: user.id, email: user.email } };
}

export async function revokeComplimentaryPlan(adminUserId: string, companyId: string) {
  const account = await prisma.enterpriseAccount.findUnique({ where: { companyId } });
  if (!account || !isComplimentary(account)) throw new EnterpriseError("This company doesn't have a complimentary plan.", "NOT_FOUND");
  await prisma.enterpriseAccount.update({ where: { id: account.id }, data: { status: "FREE", plan: null } });
  await recordEvent(prisma, account.id, { type: "COMPLIMENTARY_REVOKED", fromStatus: "ACTIVE", toStatus: "FREE", plan: account.plan, actorUserId: adminUserId });
  await writeAuditLog({ userId: adminUserId, action: "admin.enterprise.complimentary_revoked", targetType: "company", targetId: companyId });
}

export async function listComplimentary() {
  const accounts = await prisma.enterpriseAccount.findMany({
    where: { status: "ACTIVE", plan: { not: null }, paypalSubscriptionId: null },
    include: { company: { select: { id: true, name: true, members: { where: { role: "OWNER" }, select: { user: { select: { email: true } } }, take: 1 } } } },
    orderBy: { updatedAt: "desc" },
  });
  return accounts.map((a) => ({ companyId: a.company.id, company: a.company.name, owner: a.company.members[0]?.user.email ?? null, plan: a.plan, since: a.updatedAt }));
}
