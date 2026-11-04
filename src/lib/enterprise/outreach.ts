import "server-only";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications/service";
import type { Prisma } from "@prisma/client";
import { EnterpriseError, consumeCredit, requireFeature, canManageBilling, lockAccount, type RecruiterContext } from "./account";

/**
 * InMail, modelled on LinkedIn Sales Navigator:
 *  - Lead search finds people: hiring managers and recruiters at other
 *    companies on CareerOS, and candidates who made themselves visible to
 *    recruiters (PUBLIC / RECRUITERS_ONLY). No one else is ever listed, and
 *    no email address or phone number is ever shown.
 *  - Account search finds companies and the people on CareerOS at each one.
 *  - An InMail goes straight to the member's CareerOS Messages inbox with
 *    no connection needed, and costs one InMail credit.
 *  - If the member replies within 90 days the credit is returned, as on
 *    Sales Navigator.
 *  - Only one unanswered InMail per member at a time: once they reply, the
 *    conversation continues for free in Messages.
 *  - A retry with the same requestId never sends or charges twice.
 */

export const INMAIL_REPLY_WINDOW_DAYS = 90;

/**
 * Cold InMail only reaches candidates who opted into being found by
 * recruiters. (A firm's own applicants are messaged free from the Pipeline.)
 */
const INMAIL_VISIBLE: Prisma.CandidateProfileWhereInput = { visibility: { in: ["PUBLIC", "RECRUITERS_ONLY"] } };
const DAY = 24 * 60 * 60 * 1000;

export interface LeadFilters {
  q?: string;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  minYears?: number;
  type?: "all" | "company" | "candidate";
  page?: number;
}

const PAGE_SIZE = 25;

export interface Lead {
  userId: string;
  name: string;
  avatarUrl: string | null;
  type: "company" | "candidate";
  title: string | null;
  company: string | null;
  companyId: string | null;
  location: string | null;
  industry: string | null;
}

function nameOrTitle(q: string): Prisma.UserWhereInput[] {
  const parts = q.split(/\s+/).filter(Boolean).slice(0, 3);
  return parts.map((p) => ({
    OR: [{ firstName: { contains: p, mode: "insensitive" } }, { lastName: { contains: p, mode: "insensitive" } }],
  }));
}

/** People at other companies (employer accounts). */
async function companyLeads(ctx: RecruiterContext, f: LeadFilters): Promise<Lead[]> {
  if (f.minYears != null) return []; // employer profiles carry no experience data to filter on
  const and: Prisma.CompanyMemberWhereInput[] = [
    { companyId: { not: ctx.company.id }, company: { deletedAt: null }, user: { deletedAt: null, status: "ACTIVE" } },
  ];
  if (f.company) and.push({ company: { name: { contains: f.company, mode: "insensitive" } } });
  if (f.industry) and.push({ company: { industry: { contains: f.industry, mode: "insensitive" } } });
  if (f.location) and.push({ company: { location: { contains: f.location, mode: "insensitive" } } });
  if (f.title) and.push({ user: { employerProfile: { title: { contains: f.title, mode: "insensitive" } } } });
  if (f.q) {
    and.push({
      OR: [
        { user: { AND: nameOrTitle(f.q) } },
        { user: { employerProfile: { title: { contains: f.q, mode: "insensitive" } } } },
        { company: { name: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }
  const members = await prisma.companyMember.findMany({
    where: { AND: and },
    select: {
      company: { select: { id: true, name: true, location: true, industry: true } },
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, employerProfile: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return members.map((m) => ({
    userId: m.user.id,
    name: `${m.user.firstName} ${m.user.lastName}`,
    avatarUrl: m.user.avatarUrl,
    type: "company",
    title: m.user.employerProfile?.title ?? null,
    company: m.company.name,
    companyId: m.company.id,
    location: m.company.location,
    industry: m.company.industry,
  }));
}

/** Candidates who chose to be visible to recruiters. */
async function candidateLeads(ctx: RecruiterContext, f: LeadFilters): Promise<Lead[]> {
  const and: Prisma.CandidateProfileWhereInput[] = [
    INMAIL_VISIBLE,
    { onboardingCompletedAt: { not: null }, user: { deletedAt: null, status: "ACTIVE" } },
  ];
  if (f.title) and.push({ currentTitle: { contains: f.title, mode: "insensitive" } });
  if (f.company) and.push({ currentCompany: { contains: f.company, mode: "insensitive" } });
  if (f.location) and.push({ location: { contains: f.location, mode: "insensitive" } });
  if (f.industry) and.push({ industry: { contains: f.industry, mode: "insensitive" } });
  if (f.minYears != null) and.push({ totalExperienceYears: { gte: f.minYears } });
  if (f.q) {
    and.push({
      OR: [
        { user: { AND: nameOrTitle(f.q) } },
        { currentTitle: { contains: f.q, mode: "insensitive" } },
        { headline: { contains: f.q, mode: "insensitive" } },
        { currentCompany: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  const profiles = await prisma.candidateProfile.findMany({
    where: { AND: and },
    select: {
      currentTitle: true,
      headline: true,
      currentCompany: true,
      location: true,
      industry: true,
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return profiles.map((p) => ({
    userId: p.user.id,
    name: `${p.user.firstName} ${p.user.lastName}`,
    avatarUrl: p.user.avatarUrl,
    type: "candidate",
    title: p.currentTitle ?? p.headline,
    company: p.currentCompany,
    companyId: null,
    location: p.location,
    industry: p.industry,
  }));
}

export async function searchLeads(ctx: RecruiterContext, f: LeadFilters) {
  requireFeature(ctx.state, "companyOutreach", "InMail");
  const type = f.type ?? "all";
  const [company, candidate] = await Promise.all([
    type === "candidate" ? [] : companyLeads(ctx, f),
    type === "company" ? [] : candidateLeads(ctx, f),
  ]);
  const all = [...company, ...candidate];
  const page = Math.max(1, f.page ?? 1);
  const slice = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pending = await pendingInmails(ctx, slice.map((l) => l.userId));
  return {
    leads: slice.map((l) => ({ ...l, pendingInmail: pending.has(l.userId) })),
    total: all.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
  };
}

/** Account search: companies, with how many of their people are on CareerOS. */
export async function searchAccounts(ctx: RecruiterContext, q?: string, industry?: string, location?: string) {
  requireFeature(ctx.state, "companyOutreach", "InMail");
  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      id: { not: ctx.company.id },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(industry ? { industry: { contains: industry, mode: "insensitive" } } : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      industry: true,
      size: true,
      location: true,
      website: true,
      _count: { select: { members: true, jobs: { where: { status: "OPEN", deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
    take: 40,
  });
  return companies.map(({ _count, ...c }) => ({ ...c, peopleOnCareerOS: _count.members, openJobs: _count.jobs }));
}

/** Members this firm already has an unanswered InMail out to. */
async function pendingInmails(ctx: RecruiterContext, userIds: string[]) {
  if (!ctx.state.account || !userIds.length) return new Set<string>();
  const rows = await prisma.outreachMessage.findMany({
    where: {
      accountId: ctx.state.account.id,
      recipientUserId: { in: userIds },
      status: "DELIVERED",
      createdAt: { gt: new Date(Date.now() - INMAIL_REPLY_WINDOW_DAYS * DAY) },
    },
    select: { recipientUserId: true },
  });
  return new Set(rows.map((r) => r.recipientUserId!));
}

/** Throws unless this firm may InMail this person. Returns who they are. */
async function eligibleRecipient(ctx: RecruiterContext, userId: string) {
  if (userId === ctx.user.id) throw new EnterpriseError("You can't InMail yourself.", "VALIDATION_ERROR");
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  if (!user) throw new EnterpriseError("This member isn't available.", "NOT_FOUND");

  const membership = await prisma.companyMember.findFirst({
    where: { userId, company: { deletedAt: null } },
    select: { companyId: true, company: { select: { name: true } } },
  });
  if (membership) {
    if (membership.companyId === ctx.company.id) throw new EnterpriseError("That's a member of your own team — use Messages.", "VALIDATION_ERROR");
    return { user, companyId: membership.companyId, companyName: membership.company.name };
  }
  const candidate = await prisma.candidateProfile.findFirst({
    where: { userId, onboardingCompletedAt: { not: null }, ...INMAIL_VISIBLE },
    select: { currentCompany: true },
  });
  if (!candidate) throw new EnterpriseError("This member isn't accepting InMail.", "NOT_FOUND");
  return { user, companyId: null, companyName: candidate.currentCompany };
}

/** The two-person conversation between these users, created inside the caller's transaction. */
async function directConversation(tx: Prisma.TransactionClient, a: string, b: string) {
  const candidates = await tx.conversation.findMany({
    where: { AND: [{ members: { some: { userId: a } } }, { members: { some: { userId: b } } }] },
    include: { members: true },
  });
  const exact = candidates.find((c) => c.members.length === 2);
  if (exact) return exact;
  return tx.conversation.create({ data: { members: { create: [{ userId: a }, { userId: b }] } } });
}

export interface InMailInput {
  requestId: string;
  recipientUserId: string;
  subject: string;
  body: string;
}

export async function sendInMail(ctx: RecruiterContext, input: InMailInput) {
  requireFeature(ctx.state, "companyOutreach", "InMail");
  const limit = rateLimit(`inmail:${ctx.user.id}`, 40, 60 * 60 * 1000);
  if (!limit.allowed) throw new EnterpriseError("You've sent a lot of InMail this hour. Try again shortly.", "RATE_LIMITED");

  const existing = await prisma.outreachMessage.findUnique({ where: { id: input.requestId } });
  if (existing) {
    if (existing.accountId !== ctx.state.account!.id) throw new EnterpriseError("Invalid request.", "CONFLICT");
    return existing;
  }

  const recipient = await eligibleRecipient(ctx, input.recipientUserId);
  await settleInmailReplies(ctx);
  if ((await pendingInmails(ctx, [recipient.user.id])).size) {
    throw new EnterpriseError(
      `You already have an unanswered InMail to ${recipient.user.firstName}. Once they reply, keep the conversation going in Messages.`,
      "CONFLICT"
    );
  }

  // The credit, the record and the in-app message commit together: the
  // InMail is delivered the moment it is stored in the recipient's inbox.
  const { charged, result: record } = await consumeCredit(
    ctx.state,
    "INMAIL",
    `inmail:${input.requestId}`,
    { actorUserId: ctx.user.id, outreachId: input.requestId, note: `InMail to ${recipient.user.firstName} ${recipient.user.lastName}` },
    async (tx) => {
      const prior = await tx.outreachMessage.findUnique({ where: { id: input.requestId } });
      if (prior) return prior;
      // Re-checked under the account lock so two tabs can't both send.
      const pending = await tx.outreachMessage.count({
        where: {
          accountId: ctx.state.account!.id,
          recipientUserId: recipient.user.id,
          status: "DELIVERED",
          createdAt: { gt: new Date(Date.now() - INMAIL_REPLY_WINDOW_DAYS * DAY) },
        },
      });
      if (pending) throw new EnterpriseError("You already have an unanswered InMail to this member.", "CONFLICT");
      const conversation = await directConversation(tx, ctx.user.id, recipient.user.id);
      await tx.message.create({
        data: { conversationId: conversation.id, senderId: ctx.user.id, content: `InMail · ${input.subject}\n\n${input.body}` },
      });
      await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      return tx.outreachMessage.create({
        data: {
          id: input.requestId,
          accountId: ctx.state.account!.id,
          senderUserId: ctx.user.id,
          targetCompanyId: recipient.companyId,
          targetCompanyName: recipient.companyName,
          channel: "IN_APP",
          recipientUserId: recipient.user.id,
          subject: input.subject,
          body: input.body,
          status: "DELIVERED",
          conversationId: conversation.id,
        },
      });
    }
  );

  if (charged) {
    await createNotification({
      userId: recipient.user.id,
      type: "MESSAGE",
      title: `InMail from ${ctx.user.firstName} ${ctx.user.lastName} at ${ctx.company.name}`,
      body: input.subject,
      linkUrl: "/messages",
    }).catch((e) => console.error("InMail notification failed", e));
  }
  return record!;
}

/**
 * Marks InMails answered within 90 days as REPLIED and returns their
 * credit — once each, guarded by the status transition.
 */
export async function settleInmailReplies(ctx: RecruiterContext) {
  const account = ctx.state.account;
  if (!account || !ctx.state.periodKey) return 0;
  const open = await prisma.outreachMessage.findMany({
    where: { accountId: account.id, status: "DELIVERED", conversationId: { not: null }, recipientUserId: { not: null } },
    select: { id: true, conversationId: true, recipientUserId: true, createdAt: true },
    take: 500,
  });
  if (!open.length) return 0;
  const replies = await prisma.message.findMany({
    where: {
      OR: open.map((o) => ({
        conversationId: o.conversationId!,
        senderId: o.recipientUserId!,
        createdAt: { gt: o.createdAt, lte: new Date(o.createdAt.getTime() + INMAIL_REPLY_WINDOW_DAYS * DAY) },
      })),
    },
    select: { conversationId: true, senderId: true, createdAt: true },
  });
  let settled = 0;
  for (const o of open) {
    const replied = replies.some(
      (m) =>
        m.conversationId === o.conversationId &&
        m.senderId === o.recipientUserId &&
        m.createdAt > o.createdAt &&
        m.createdAt.getTime() <= o.createdAt.getTime() + INMAIL_REPLY_WINDOW_DAYS * DAY
    );
    if (!replied) continue;
    await prisma.$transaction(async (tx) => {
      await lockAccount(tx, account.id);
      const moved = await tx.outreachMessage.updateMany({ where: { id: o.id, status: "DELIVERED" }, data: { status: "REPLIED" } });
      if (!moved.count) return;
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          kind: "INMAIL",
          delta: 1,
          type: "REFUND",
          periodKey: ctx.state.periodKey!,
          refKey: `reply-refund:${o.id}`,
          outreachId: o.id,
          note: "Reply received within 90 days — credit returned",
        },
      });
      settled += 1;
    });
  }
  return settled;
}

/** Sent InMail. Recruiters see their own; owners and admins see the whole firm's. */
export async function listInMail(ctx: RecruiterContext) {
  if (!ctx.state.account) return [];
  await settleInmailReplies(ctx);
  const rows = await prisma.outreachMessage.findMany({
    where: { accountId: ctx.state.account.id, ...(canManageBilling(ctx.role) ? {} : { senderUserId: ctx.user.id }) },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const userIds = Array.from(new Set(rows.flatMap((r) => [r.recipientUserId, r.senderUserId]).filter(Boolean) as string[]));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
  const name = (id: string | null) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : null;
  };
  return rows.map((r) => ({
    id: r.id,
    recipientUserId: r.recipientUserId,
    recipientName: name(r.recipientUserId),
    company: r.targetCompanyName,
    subject: r.subject,
    status: r.status,
    creditReturned: r.status === "REPLIED",
    conversationId: r.conversationId,
    sentBy: name(r.senderUserId),
    createdAt: r.createdAt,
  }));
}
