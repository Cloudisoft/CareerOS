import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/crypto";
import { sendEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit/log";
import { createCompanyForUser } from "@/lib/company/service";
import { grantComplimentaryPlan, revokeComplimentaryPlan } from "@/lib/enterprise/complimentary";
import { EnterpriseError } from "@/lib/enterprise/account";

/**
 * Platform-admin tools to create Career OS accounts and to give an account a
 * plan for a set time (1, 3, 6 or 12 months). Granted plans never involve
 * PayPal and are never charged; they end on their own when the time is up
 * (job seeker plans in billing/lifecycle.ts, company plans in
 * enterprise/account.ts). An account already paying through PayPal is
 * refused, so nobody is billed twice.
 */

export class AdminPlanError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const GRANT_MONTHS = [1, 3, 6, 12] as const;
export const CANDIDATE_PLANS = ["BASIC", "STANDARD", "PREMIUM", "ELITE"] as const;
export const ENTERPRISE_PLANS = ["STARTER", "PROFESSIONAL"] as const;

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function addMonths(from: Date, months: number) {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  // 31 Jan + 1 month → 28/29 Feb, not 3 March.
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d;
}

export const createAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  firstName: z.string().trim().min(1, "Add a first name").max(80),
  lastName: z.string().trim().min(1, "Add a last name").max(80),
  type: z.enum(["CANDIDATE", "EMPLOYER"]),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  sendInvite: z.boolean().default(true),
});

export const grantPlanSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("CANDIDATE"), email: z.string().trim().email(), plan: z.enum(CANDIDATE_PLANS), months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]) }),
  z.object({
    kind: z.literal("ENTERPRISE"),
    email: z.string().trim().email(),
    plan: z.enum(ENTERPRISE_PLANS),
    months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
    companyName: z.string().trim().max(120).optional().or(z.literal("")),
    convertToEmployer: z.boolean().optional(),
  }),
]);

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** A one-time "set your password" link (valid 7 days), reusing the password-reset flow. */
async function issueInvite(user: { id: string; email: string; firstName: string }, send: boolean) {
  const token = generateToken();
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) } });
  const url = `${appUrl()}/reset-password?token=${token}`;
  let emailed = false;
  if (send) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Your Career OS account is ready",
        html: `<div style="font-family:sans-serif;max-width:520px"><h2>Welcome to Career OS, ${escapeHtml(user.firstName)}</h2><p>An account has been created for you. Set your password to get started:</p><p><a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#EF862D;color:#fff;text-decoration:none;font-weight:600">Set my password</a></p><p style="color:#64748b;font-size:13px">This link works for 7 days. You can also sign in with Google using this email address.</p></div>`,
        text: `Welcome to Career OS, ${user.firstName}. Set your password: ${url} (valid for 7 days). You can also sign in with Google using this email address.`,
      });
      emailed = true;
    } catch (error) {
      console.error("Invite email failed", error);
    }
  }
  return { url, emailed };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function createAccount(adminUserId: string, input: z.infer<typeof createAccountSchema>) {
  const existing = await prisma.user.findFirst({ where: { email: { equals: input.email, mode: "insensitive" } }, select: { id: true } });
  if (existing) throw new AdminPlanError("An account with this email already exists. Use “Give a plan” instead.", "ALREADY_EXISTS");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: null,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.type,
      ...(input.type === "CANDIDATE" ? { candidateProfile: { create: {} } } : { employerProfile: { create: {} } }),
    },
  });
  let company: { id: string; name: string } | null = null;
  if (input.type === "EMPLOYER" && input.companyName) {
    const c = await createCompanyForUser(user.id, { name: input.companyName } as never);
    company = { id: c.id, name: c.name };
  }
  const invite = await issueInvite(user, input.sendInvite);
  await writeAuditLog({ userId: adminUserId, action: "admin.user.created", targetType: "user", targetId: user.id, metadata: { email: user.email, role: user.role, company: company?.name ?? null, invited: invite.emailed } });
  return { user: { id: user.id, email: user.email, role: user.role }, company, inviteUrl: invite.url, emailed: invite.emailed };
}

/** A fresh set-password link for an account that hasn't set one yet. */
export async function resendInvite(adminUserId: string, email: string) {
  const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" }, deletedAt: null } });
  if (!user) throw new AdminPlanError("No Career OS account uses that email.", "NOT_FOUND");
  const invite = await issueInvite(user, true);
  await writeAuditLog({ userId: adminUserId, action: "admin.user.invite_resent", targetType: "user", targetId: user.id });
  return { inviteUrl: invite.url, emailed: invite.emailed };
}

export async function grantPlan(adminUserId: string, input: z.infer<typeof grantPlanSchema>) {
  const endsAt = addMonths(new Date(), input.months);
  if (input.kind === "ENTERPRISE") {
    const result = await grantComplimentaryPlan(adminUserId, {
      email: input.email,
      plan: input.plan,
      companyName: input.companyName || undefined,
      convertToEmployer: input.convertToEmployer,
      endsAt,
    });
    return { kind: "ENTERPRISE" as const, email: result.user.email, company: result.company.name, plan: input.plan, endsAt };
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: input.email.trim(), mode: "insensitive" }, deletedAt: null } });
  if (!user) throw new AdminPlanError("No Career OS account uses that email. Create the account first.", "NOT_FOUND");
  const current = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (current?.paypalSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(current.status)) {
    throw new AdminPlanError(`${user.email} is paying through PayPal right now. Cancel that subscription first so they aren't charged twice.`, "CONFLICT");
  }
  const data = { plan: input.plan, status: "ACTIVE" as const, paypalSubscriptionId: null, currentPeriodEnd: endsAt, cancelAtPeriodEnd: false };
  await prisma.subscription.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  await writeAuditLog({ userId: adminUserId, action: "admin.plan.granted", targetType: "user", targetId: user.id, metadata: { kind: "CANDIDATE", plan: input.plan, months: input.months, endsAt: endsAt.toISOString() } });
  return { kind: "CANDIDATE" as const, email: user.email, company: null, plan: input.plan, endsAt };
}

export async function revokePlan(adminUserId: string, input: { kind: "CANDIDATE"; userId: string } | { kind: "ENTERPRISE"; companyId: string }) {
  if (input.kind === "ENTERPRISE") {
    await revokeComplimentaryPlan(adminUserId, input.companyId);
    return;
  }
  const sub = await prisma.subscription.findUnique({ where: { userId: input.userId } });
  if (!sub || sub.paypalSubscriptionId || !["ACTIVE", "TRIALING"].includes(sub.status)) {
    throw new AdminPlanError("This account has no granted plan to end.", "NOT_FOUND");
  }
  await prisma.subscription.update({ where: { userId: input.userId }, data: { status: "CANCELED", currentPeriodEnd: new Date() } });
  await writeAuditLog({ userId: adminUserId, action: "admin.plan.revoked", targetType: "user", targetId: input.userId, metadata: { kind: "CANDIDATE", plan: sub.plan } });
}

/** Every plan granted by an admin that is still running, soonest end first. */
export async function listGrants() {
  const [subs, companies] = await Promise.all([
    prisma.subscription.findMany({
      where: { paypalSubscriptionId: null, status: { in: ["ACTIVE", "TRIALING"] } },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, passwordHash: true, googleId: true } } },
      orderBy: { currentPeriodEnd: "asc" },
      take: 300,
    }),
    prisma.enterpriseAccount.findMany({
      where: { status: "ACTIVE", plan: { not: null }, paypalSubscriptionId: null },
      include: { company: { select: { id: true, name: true, members: { where: { role: "OWNER" }, select: { user: { select: { email: true } } }, take: 1 } } } },
      orderBy: { currentPeriodEnd: "asc" },
      take: 300,
    }),
  ]);
  return [
    ...subs.map((s) => ({
      kind: "CANDIDATE" as const,
      id: s.user.id,
      who: `${s.user.firstName} ${s.user.lastName}`.trim(),
      email: s.user.email,
      plan: s.plan as string,
      endsAt: s.currentPeriodEnd,
      invited: !s.user.passwordHash && !s.user.googleId,
    })),
    ...companies.map((a) => ({
      kind: "ENTERPRISE" as const,
      id: a.company.id,
      who: a.company.name,
      email: a.company.members[0]?.user.email ?? null,
      plan: a.plan as string,
      endsAt: a.currentPeriodEnd,
      invited: false,
    })),
  ].sort((a, b) => (a.endsAt?.getTime() ?? Infinity) - (b.endsAt?.getTime() ?? Infinity));
}

export { EnterpriseError };
