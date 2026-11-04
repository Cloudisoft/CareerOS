import "server-only";
import { prisma } from "@/lib/prisma";
import { creditSummary, jobsPostedToday, nextUtcMidnight, canManageBilling, type RecruiterContext } from "./account";
import { ENTERPRISE_PLANS, INTRO_PRICE_CENTS, TRIAL_DAYS, BOOST_PRICES_CENTS, BOOST_DAYS } from "./plans";
import { settleInmailReplies } from "./outreach";
import { isComplimentary } from "./complimentary";

/** The firm's subscription, allowances and live usage — every number from the database. */
export async function enterpriseOverview(ctx: RecruiterContext) {
  const { state } = ctx;
  if (state.account && state.periodKey) await settleInmailReplies(ctx);
  const [credits, postedToday] = await Promise.all([creditSummary(state), jobsPostedToday(state.account?.id)]);
  const pendingDowngrade = state.account
    ? await prisma.enterpriseEvent.findFirst({
        where: { accountId: state.account.id, type: { in: ["DOWNGRADE_REQUESTED", "PLAN_CHANGED", "SUBSCRIBED"] } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return {
    company: { id: ctx.company.id, name: ctx.company.name },
    role: ctx.role,
    canManageBilling: canManageBilling(ctx.role),
    status: state.status,
    plan: state.plan,
    complimentary: isComplimentary(state.account),
    entitlements: state.entitlements,
    trial: { eligible: state.trialEligible, endsAt: state.trialEndsAt, days: TRIAL_DAYS },
    intro: { eligible: state.introEligible, priceCents: INTRO_PRICE_CENTS, active: state.account?.introActive ?? false },
    period: {
      start: state.account?.currentPeriodStart ?? null,
      end: state.account?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: state.account?.cancelAtPeriodEnd ?? false,
    },
    pendingDowngrade: pendingDowngrade?.type === "DOWNGRADE_REQUESTED" ? { plan: pendingDowngrade.plan, requestedAt: pendingDowngrade.createdAt } : null,
    jobs: { postedToday, perDay: state.entitlements.jobsPerDay, resetsAt: nextUtcMidnight() },
    credits,
    plans: ENTERPRISE_PLANS,
    boostPrices: BOOST_PRICES_CENTS,
    boostDays: BOOST_DAYS,
  };
}

/** Recruiter dashboard metrics. Zeroes are real zeroes. */
export async function dashboardStats(ctx: RecruiterContext) {
  const companyId = ctx.company.id;
  const accountId = ctx.state.account?.id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [openJobs, applicants, applicantsWeek, byStatus, screenings, inmail, activeBoosts, unlocks] = await Promise.all([
    prisma.job.count({ where: { companyId, status: "OPEN", deletedAt: null } }),
    prisma.application.count({ where: { job: { companyId }, status: { notIn: ["SAVED", "WITHDRAWN"] } } }),
    prisma.application.count({ where: { job: { companyId }, appliedAt: { gte: weekAgo }, status: { notIn: ["SAVED", "WITHDRAWN"] } } }),
    prisma.application.groupBy({ by: ["status"], where: { job: { companyId } }, _count: true }),
    accountId ? prisma.atsScreening.groupBy({ by: ["category"], where: { accountId }, _count: true }) : [],
    accountId ? prisma.outreachMessage.groupBy({ by: ["status"], where: { accountId }, _count: true }) : [],
    accountId ? prisma.boost.count({ where: { accountId, endsAt: { gt: now } } }) : 0,
    accountId ? prisma.resumeUnlock.count({ where: { accountId } }) : 0,
  ]);

  const count = <T extends { _count: number }>(rows: T[], key: keyof T, value: string) =>
    rows.find((r) => r[key] === value)?._count ?? 0;

  return {
    openJobs,
    applicants,
    applicantsThisWeek: applicantsWeek,
    pipeline: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    shortlisted: count(byStatus, "status", "SCREENING") + count(byStatus, "status", "INTERVIEW"),
    interviews: count(byStatus, "status", "INTERVIEW"),
    offers: count(byStatus, "status", "OFFER"),
    screenings: {
      total: screenings.reduce((n, r) => n + r._count, 0),
      HIGHLY_QUALIFIED: count(screenings, "category", "HIGHLY_QUALIFIED"),
      QUALIFIED: count(screenings, "category", "QUALIFIED"),
      POTENTIAL_MATCH: count(screenings, "category", "POTENTIAL_MATCH"),
      NOT_SUITABLE: count(screenings, "category", "NOT_SUITABLE"),
    },
    inmail: {
      sent: inmail.reduce((n, r) => n + r._count, 0),
      replied: count(inmail, "status", "REPLIED"),
    },
    activeBoosts,
    resumesUnlocked: unlocks,
  };
}

/** Full credit ledger and subscription history, newest first. */
export async function usageHistory(ctx: RecruiterContext) {
  const accountId = ctx.state.account?.id;
  if (!accountId) return { credits: [], events: [] };
  const [credits, events] = await Promise.all([
    prisma.creditTransaction.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.enterpriseEvent.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const actorIds = Array.from(new Set([...credits.map((c) => c.actorUserId), ...events.map((e) => e.actorUserId)].filter(Boolean) as string[]));
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, firstName: true, lastName: true } });
  const actorName = (id: string | null) => {
    const a = actors.find((x) => x.id === id);
    return a ? `${a.firstName} ${a.lastName}` : null;
  };
  return {
    credits: credits.map((c) => ({
      id: c.id,
      kind: c.kind,
      delta: c.delta,
      type: c.type,
      note: c.note,
      by: actorName(c.actorUserId),
      createdAt: c.createdAt,
    })),
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      plan: e.plan,
      amountCents: e.amountCents,
      // Transaction ids are useful to billing managers only.
      detail: canManageBilling(ctx.role) ? e.detail : null,
      by: actorName(e.actorUserId),
      createdAt: e.createdAt,
    })),
  };
}
