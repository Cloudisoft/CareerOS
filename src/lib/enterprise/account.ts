import "server-only";
import { prisma } from "@/lib/prisma";
import { requireEmployerCompany } from "@/lib/auth/guards";
import type {
  CompanyMemberRole,
  CreditKind,
  EnterpriseAccount,
  EnterprisePlanKey,
  EnterpriseStatus,
  Prisma,
} from "@prisma/client";
import {
  FREE_ENTITLEMENTS,
  TRIAL_DAYS,
  TRIAL_ENTITLEMENTS,
  getEnterprisePlan,
  type EnterpriseEntitlements,
} from "./plans";

export class EnterpriseError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const upgradeRequired = (feature: string) =>
  new EnterpriseError(`${feature} is part of the Enterprise Recruiter Suite. Upgrade your plan to use it.`, "UPGRADE_REQUIRED");

type Db = Prisma.TransactionClient | typeof prisma;

export interface EnterpriseState {
  companyId: string;
  account: EnterpriseAccount | null;
  status: EnterpriseStatus;
  plan: EnterprisePlanKey | null;
  entitlements: EnterpriseEntitlements;
  /** Key of the billing period credits belong to. Null when there are no paid credits. */
  periodKey: string | null;
  trialEligible: boolean;
  introEligible: boolean;
  trialEndsAt: Date | null;
}

/** UTC calendar day — the one timezone every daily quota resets on. */
export function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function nextUtcMidnight(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
}

function periodKeyFor(account: EnterpriseAccount) {
  if (account.currentPeriodStart) return account.currentPeriodStart.toISOString();
  // A paid account always gets a period start from PayPal; this only covers
  // an account activated by hand without one.
  return `month:${new Date().toISOString().slice(0, 7)}`;
}

export async function recordEvent(
  db: Db,
  accountId: string,
  event: {
    type: string;
    fromStatus?: EnterpriseStatus | null;
    toStatus?: EnterpriseStatus | null;
    plan?: EnterprisePlanKey | null;
    amountCents?: number | null;
    detail?: string | null;
    actorUserId?: string | null;
  }
) {
  await db.enterpriseEvent.create({ data: { accountId, ...event } });
}

/**
 * Applies time-based transitions the moment anything reads the account —
 * a lapsed trial becomes FREE, a cancelled subscription past its paid-up
 * period becomes EXPIRED. Doing it on read (not on a cron) means there is
 * no window where an expired trial still has access. Data is never removed.
 */
async function applyLifecycle(account: EnterpriseAccount): Promise<EnterpriseAccount> {
  const now = new Date();
  if (account.status === "TRIAL" && account.trialEndsAt && account.trialEndsAt <= now) {
    const updated = await prisma.enterpriseAccount.updateMany({
      where: { id: account.id, status: "TRIAL" },
      data: { status: "FREE" },
    });
    if (updated.count) {
      await recordEvent(prisma, account.id, { type: "TRIAL_EXPIRED", fromStatus: "TRIAL", toStatus: "FREE" });
    }
    return { ...account, status: "FREE" };
  }
  // A plan an admin granted for a set time ends on its own (no PayPal subscription to cancel).
  if (account.status === "ACTIVE" && !account.paypalSubscriptionId && account.currentPeriodEnd && account.currentPeriodEnd <= now) {
    const updated = await prisma.enterpriseAccount.updateMany({
      where: { id: account.id, status: "ACTIVE", paypalSubscriptionId: null },
      data: { status: "EXPIRED" },
    });
    if (updated.count) {
      await recordEvent(prisma, account.id, { type: "COMPLIMENTARY_EXPIRED", fromStatus: "ACTIVE", toStatus: "EXPIRED", plan: account.plan });
    }
    return { ...account, status: "EXPIRED" };
  }
  if (account.status === "CANCELLED" && (!account.currentPeriodEnd || account.currentPeriodEnd <= now)) {
    const updated = await prisma.enterpriseAccount.updateMany({
      where: { id: account.id, status: "CANCELLED" },
      data: { status: "EXPIRED" },
    });
    if (updated.count) {
      await recordEvent(prisma, account.id, { type: "SUBSCRIPTION_EXPIRED", fromStatus: "CANCELLED", toStatus: "EXPIRED", plan: account.plan });
    }
    return { ...account, status: "EXPIRED" };
  }
  return account;
}

function hasPaidAccess(account: EnterpriseAccount) {
  if (!account.plan) return false;
  if (account.status === "ACTIVE") return true;
  // Cancelled but still inside the period they paid for.
  return account.status === "CANCELLED" && Boolean(account.currentPeriodEnd && account.currentPeriodEnd > new Date());
}

export async function getEnterpriseStateForCompany(companyId: string): Promise<EnterpriseState> {
  const raw = await prisma.enterpriseAccount.findUnique({ where: { companyId } });
  const account = raw ? await applyLifecycle(raw) : null;

  const everPaid = account
    ? (await prisma.enterpriseEvent.count({ where: { accountId: account.id, type: "SUBSCRIBED" } })) > 0
    : false;

  const base = {
    companyId,
    account,
    trialEligible: !account || (!account.trialStartedAt && !everPaid && !account.plan),
    introEligible: !account || (!account.introUsedAt && !everPaid),
    trialEndsAt: account?.trialEndsAt ?? null,
  };

  if (account && hasPaidAccess(account)) {
    return {
      ...base,
      status: account.status,
      plan: account.plan,
      entitlements: getEnterprisePlan(account.plan!).entitlements,
      periodKey: periodKeyFor(account),
    };
  }
  if (account?.status === "TRIAL") {
    return { ...base, status: "TRIAL", plan: null, entitlements: TRIAL_ENTITLEMENTS, periodKey: null };
  }
  return { ...base, status: account?.status ?? "FREE", plan: account?.plan ?? null, entitlements: FREE_ENTITLEMENTS, periodKey: null };
}

export interface RecruiterContext {
  user: Awaited<ReturnType<typeof requireEmployerCompany>>["user"];
  company: Awaited<ReturnType<typeof requireEmployerCompany>>["company"];
  role: CompanyMemberRole;
  state: EnterpriseState;
}

/** The authenticated recruiter, their firm, their role in it, and the firm's live entitlements. */
export async function requireRecruiter(): Promise<RecruiterContext> {
  const { user, company, role } = await requireEmployerCompany();
  const state = await getEnterpriseStateForCompany(company.id);
  return { user, company, role, state };
}

export function canManageBilling(role: CompanyMemberRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function requireBillingManager(ctx: RecruiterContext) {
  if (!canManageBilling(ctx.role)) {
    throw new EnterpriseError("Only your company's owner or admins can manage the subscription.", "FORBIDDEN");
  }
}

/** Fails unless the firm's current plan includes `key`. Every enterprise API calls this server-side. */
export function requireFeature(state: EnterpriseState, key: keyof EnterpriseEntitlements, label: string) {
  const value = state.entitlements[key];
  if (value === false || value === 0) throw upgradeRequired(label);
}

export async function startTrial(ctx: RecruiterContext) {
  requireBillingManager(ctx);
  if (!ctx.state.trialEligible) {
    throw new EnterpriseError("Your company has already used its free trial.", "TRIAL_USED");
  }
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const account = await prisma.$transaction(async (tx) => {
    const existing = await tx.enterpriseAccount.findUnique({ where: { companyId: ctx.company.id } });
    if (existing?.trialStartedAt) throw new EnterpriseError("Your company has already used its free trial.", "TRIAL_USED");
    const acc = existing
      ? await tx.enterpriseAccount.update({ where: { id: existing.id }, data: { status: "TRIAL", trialStartedAt: now, trialEndsAt } })
      : await tx.enterpriseAccount.create({
          data: { companyId: ctx.company.id, status: "TRIAL", trialStartedAt: now, trialEndsAt },
        });
    await recordEvent(tx, acc.id, {
      type: "TRIAL_STARTED",
      fromStatus: existing?.status ?? null,
      toStatus: "TRIAL",
      actorUserId: ctx.user.id,
      detail: `Trial ends ${trialEndsAt.toISOString()}`,
    });
    return acc;
  });
  return account;
}

/** Row lock on the firm's account — serializes every credit and quota write for that firm. */
export async function lockAccount(tx: Prisma.TransactionClient, accountId: string) {
  await tx.$queryRaw`SELECT id FROM enterprise_accounts WHERE id = ${accountId} FOR UPDATE`;
}

// ---------------------------------------------------------------- credits

const ALLOWANCE: Record<CreditKind, keyof EnterpriseEntitlements> = {
  RESUME_FETCH: "resumeCredits",
  INMAIL: "inmailCredits",
  POST_BOOST: "freePostBoosts",
  CAMPAIGN_BOOST: "freeCampaignBoosts",
};

/**
 * Writes this period's grant (or the top-up after an upgrade) as ledger
 * rows, so every credit added is recorded. Idempotent: the refKey encodes
 * the allowance being granted, so re-running adds nothing.
 */
async function ensureGrant(tx: Db, state: EnterpriseState, kind: CreditKind) {
  if (!state.account || !state.periodKey) return;
  const allowance = state.entitlements[ALLOWANCE[kind]] as number;
  if (!allowance) return;
  const granted = await tx.creditTransaction.aggregate({
    where: { accountId: state.account.id, kind, periodKey: state.periodKey, type: "GRANT" },
    _sum: { delta: true },
  });
  const already = granted._sum.delta ?? 0;
  if (already >= allowance) return;
  await tx.creditTransaction.upsert({
    where: { accountId_kind_refKey: { accountId: state.account.id, kind, refKey: `grant:${state.periodKey}:${allowance}` } },
    create: {
      accountId: state.account.id,
      kind,
      delta: allowance - already,
      type: "GRANT",
      periodKey: state.periodKey,
      refKey: `grant:${state.periodKey}:${allowance}`,
      note: state.plan ? `${state.plan} allowance` : null,
    },
    update: {},
  });
}

export async function creditBalance(tx: Db, state: EnterpriseState, kind: CreditKind) {
  if (!state.account || !state.periodKey) return { granted: 0, used: 0, remaining: 0 };
  const rows = await tx.creditTransaction.groupBy({
    by: ["type"],
    where: { accountId: state.account.id, kind, periodKey: state.periodKey },
    _sum: { delta: true },
  });
  const sum = (t: string) => rows.find((r) => r.type === t)?._sum.delta ?? 0;
  const granted = sum("GRANT");
  const used = Math.max(0, -(sum("CONSUME") + sum("REFUND")));
  return { granted, used, remaining: Math.max(0, granted - used) };
}

export async function creditSummary(state: EnterpriseState) {
  if (state.account && state.periodKey) {
    for (const kind of Object.keys(ALLOWANCE) as CreditKind[]) await ensureGrant(prisma, state, kind);
  }
  const [resume, inmail, postBoost, campaignBoost] = await Promise.all(
    (["RESUME_FETCH", "INMAIL", "POST_BOOST", "CAMPAIGN_BOOST"] as CreditKind[]).map((k) => creditBalance(prisma, state, k))
  );
  return { resume, inmail, postBoost, campaignBoost };
}

export interface ConsumeMeta {
  actorUserId: string;
  candidateProfileId?: string;
  jobId?: string;
  boostId?: string;
  outreachId?: string;
  note?: string;
}

/**
 * Spends one credit, atomically. Inside one transaction with the firm's
 * account row locked: if `refKey` was already charged this returns
 * `{ charged: false }` without touching the balance; otherwise it checks
 * the balance, writes the -1, and runs `effect` — so the credit and the
 * thing it paid for commit together or not at all. Two concurrent
 * requests for the last credit cannot both succeed, and the balance can
 * never go negative.
 */
export async function consumeCredit<T>(
  state: EnterpriseState,
  kind: CreditKind,
  refKey: string,
  meta: ConsumeMeta,
  effect?: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<{ charged: boolean; result: T | undefined }> {
  if (!state.account || !state.periodKey) throw upgradeRequired("This feature");
  const accountId = state.account.id;
  const periodKey = state.periodKey;

  return prisma.$transaction(async (tx) => {
    await lockAccount(tx, accountId);

    const fullKey = `${periodKey}:${refKey}`;
    const prior = await tx.creditTransaction.findUnique({
      where: { accountId_kind_refKey: { accountId, kind, refKey: fullKey } },
    });
    if (prior) return { charged: false, result: effect ? await effect(tx) : undefined };

    await ensureGrant(tx, state, kind);
    const balance = await creditBalance(tx, state, kind);
    if (balance.remaining < 1) {
      throw new EnterpriseError("You've used all your credits for this billing period.", "NO_CREDITS");
    }

    await tx.creditTransaction.create({
      data: { accountId, kind, delta: -1, type: "CONSUME", periodKey, refKey: fullKey, ...meta },
    });
    const result = effect ? await effect(tx) : undefined;
    return { charged: true, result };
  });
}

/** Puts back a credit whose operation then failed (e.g. an email the provider rejected). Recorded, and only once. */
export async function refundCredit(state: EnterpriseState, kind: CreditKind, refKey: string, note: string) {
  if (!state.account || !state.periodKey) return;
  const fullKey = `${state.periodKey}:${refKey}`;
  await prisma.creditTransaction.upsert({
    where: { accountId_kind_refKey: { accountId: state.account.id, kind, refKey: `refund:${fullKey}` } },
    create: {
      accountId: state.account.id,
      kind,
      delta: 1,
      type: "REFUND",
      periodKey: state.periodKey,
      refKey: `refund:${fullKey}`,
      note,
    },
    update: {},
  });
}

// ---------------------------------------------------------------- job quota

export async function jobsPostedToday(accountId: string | undefined) {
  if (!accountId) return 0;
  return prisma.enterpriseJobPost.count({ where: { accountId, dayKey: utcDayKey() } });
}

/**
 * Posts a formal job against the firm's daily quota. The quota check and
 * the job insert happen in one transaction under the account lock, so two
 * simultaneous posts can't both take the last slot.
 */
export async function postJobWithinQuota<T extends { id: string }>(
  ctx: RecruiterContext,
  create: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const { state } = ctx;
  if (!state.account || state.entitlements.jobsPerDay < 1) {
    throw new EnterpriseError(
      state.status === "FREE" && state.trialEligible
        ? "Start your free 3-day Enterprise trial or subscribe to post jobs."
        : "Posting jobs needs an active Enterprise subscription.",
      "UPGRADE_REQUIRED"
    );
  }
  const accountId = state.account.id;
  const dayKey = utcDayKey();
  return prisma.$transaction(async (tx) => {
    await lockAccount(tx, accountId);
    const today = await tx.enterpriseJobPost.count({ where: { accountId, dayKey } });
    if (today >= state.entitlements.jobsPerDay) {
      throw new EnterpriseError(
        `You've posted ${today} of ${state.entitlements.jobsPerDay} jobs today. Your quota resets at midnight UTC.`,
        "QUOTA_EXCEEDED"
      );
    }
    const job = await create(tx);
    await tx.enterpriseJobPost.create({ data: { accountId, jobId: job.id, dayKey, postedById: ctx.user.id } });
    return job;
  });
}
