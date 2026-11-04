import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isComplimentary } from "@/lib/enterprise/complimentary";

/**
 * Platform Insights for platform admins: what job seekers and recruiting
 * firms are doing, which plans and add-ons they hold, and recent activity.
 * Counts and activity only — no resume contents or messages.
 */

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY);

export async function insightsOverview() {
  const [
    usersByRole,
    newUsers7,
    newUsers30,
    activeSessions7,
    subsByPlan,
    addOns,
    entByStatus,
    entByPlan,
    revenue30,
    applications7,
    applicationsBySource7,
    autoApply7,
    ai7,
    interviews7,
    inmail30,
    unlocks30,
    screenings30,
    jobsPosted30,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.user.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.session.findMany({ where: { createdAt: { gte: since(7) } }, distinct: ["userId"], select: { userId: true } }),
    prisma.subscription.groupBy({ by: ["plan"], where: { status: { in: ["ACTIVE", "TRIALING"] } }, _count: { _all: true } }),
    prisma.addOnSubscription.groupBy({ by: ["addOn"], where: { status: { in: ["ACTIVE", "TRIALING"] } }, _count: { _all: true } }),
    prisma.enterpriseAccount.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.enterpriseAccount.groupBy({ by: ["plan"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: since(30) }, status: { in: ["completed", "COMPLETED"] } }, _sum: { amount: true }, _count: true }),
    prisma.application.count({ where: { appliedAt: { gte: since(7) }, status: { notIn: ["SAVED"] } } }),
    prisma.application.groupBy({ by: ["source"], where: { appliedAt: { gte: since(7) }, status: { notIn: ["SAVED"] } }, _count: { _all: true } }),
    prisma.autoApplyRun.aggregate({ where: { startedAt: { gte: since(7) } }, _sum: { submitted: true, failed: true }, _count: true }),
    prisma.aiUsage.groupBy({ by: ["feature"], where: { createdAt: { gte: since(7) } }, _count: { _all: true } }),
    prisma.interviewSession.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.outreachMessage.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.resumeUnlock.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.atsScreening.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.enterpriseJobPost.count({ where: { createdAt: { gte: since(30) } } }),
  ]);

  return {
    users: {
      byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all])),
      new7: newUsers7,
      new30: newUsers30,
      active7: activeSessions7.length,
    },
    candidates: {
      plans: Object.fromEntries(subsByPlan.map((r) => [r.plan, r._count._all])),
      addOns: Object.fromEntries(addOns.map((r) => [r.addOn, r._count._all])),
      applications7,
      applicationsBySource7: Object.fromEntries(applicationsBySource7.map((r) => [r.source, r._count._all])),
      autoApplyRuns7: autoApply7._count,
      autoApplySubmitted7: autoApply7._sum.submitted ?? 0,
      autoApplyFailed7: autoApply7._sum.failed ?? 0,
      interviews7,
      aiUsage7: Object.fromEntries(ai7.map((r) => [r.feature, r._count._all])),
    },
    enterprise: {
      byStatus: Object.fromEntries(entByStatus.map((r) => [r.status, r._count._all])),
      byPlan: Object.fromEntries(entByPlan.filter((r) => r.plan).map((r) => [r.plan!, r._count._all])),
      jobsPosted30,
      inmail30,
      unlocks30,
      screenings30,
    },
    revenue30: { cents: revenue30._sum.amount ?? 0, payments: revenue30._count },
  };
}

// ---------------------------------------------------------------- candidates

export async function listCandidates(q: string | undefined, filter: string | undefined, page: number) {
  const pageSize = 25;
  const where: Prisma.UserWhereInput = {
    role: "CANDIDATE",
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filter === "paid" ? { subscription: { status: { in: ["ACTIVE", "TRIALING"] } } } : {}),
    ...(filter === "addons" ? { addOnSubscriptions: { some: { status: { in: ["ACTIVE", "TRIALING"] } } } } : {}),
    ...(filter === "extension" ? { extensionSessions: { some: { expiresAt: { gt: new Date() } } } } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true, paypalSubscriptionId: true } },
        addOnSubscriptions: { where: { status: { in: ["ACTIVE", "TRIALING"] } }, select: { addOn: true } },
        candidateProfile: { select: { id: true, currentTitle: true, profileScore: true } },
        sessions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        extensionSessions: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { lastSeenAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const profileIds = users.map((u) => u.candidateProfile?.id).filter(Boolean) as string[];
  const userIds = users.map((u) => u.id);
  const [apps, apps30, runs, interviews, ai30] = await Promise.all([
    prisma.application.groupBy({ by: ["profileId"], where: { profileId: { in: profileIds }, status: { not: "SAVED" } }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["profileId"], where: { profileId: { in: profileIds }, status: { not: "SAVED" }, appliedAt: { gte: since(30) } }, _count: { _all: true } }),
    prisma.autoApplyRun.groupBy({ by: ["profileId"], where: { profileId: { in: profileIds } }, _sum: { submitted: true } }),
    prisma.interviewSession.groupBy({ by: ["profileId"], where: { profileId: { in: profileIds } }, _count: { _all: true } }),
    prisma.aiUsage.groupBy({ by: ["userId"], where: { userId: { in: userIds }, createdAt: { gte: since(30) } }, _count: { _all: true } }),
  ]);
  const byProfile = <T extends { profileId: string }>(rows: T[], id: string | undefined) => rows.find((r) => r.profileId === id);

  return {
    candidates: users.map((u) => {
      const pid = u.candidateProfile?.id;
      const lastLogin = u.sessions[0]?.createdAt ?? null;
      const lastExtension = u.extensionSessions[0]?.lastSeenAt ?? null;
      const lastActive = [lastLogin, lastExtension].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
      const subActive = u.subscription && ["ACTIVE", "TRIALING"].includes(u.subscription.status);
      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        status: u.status,
        joined: u.createdAt,
        lastActive,
        title: u.candidateProfile?.currentTitle ?? null,
        plan: subActive ? u.subscription!.plan : "FREE",
        planComplimentary: Boolean(subActive && !u.subscription!.paypalSubscriptionId),
        addOns: u.addOnSubscriptions.map((a) => a.addOn),
        extensionConnected: Boolean(lastExtension),
        applications: byProfile(apps, pid)?._count._all ?? 0,
        applications30: byProfile(apps30, pid)?._count._all ?? 0,
        autoApplied: byProfile(runs, pid)?._sum.submitted ?? 0,
        interviews: byProfile(interviews, pid)?._count._all ?? 0,
        aiUses30: ai30.find((r) => r.userId === u.id)?._count._all ?? 0,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function candidateActivity(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true, paypalSubscriptionId: true } },
      addOnSubscriptions: { select: { addOn: true, status: true, currentPeriodEnd: true } },
      candidateProfile: { select: { id: true, currentTitle: true, location: true, visibility: true, profileScore: true, resumeScore: true, careerReadinessScore: true } },
      sessions: { orderBy: { createdAt: "desc" }, take: 10, select: { createdAt: true, userAgent: true } },
      extensionSessions: { orderBy: { lastSeenAt: "desc" }, take: 5, select: { deviceLabel: true, lastSeenAt: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 20, select: { amount: true, currency: true, status: true, description: true, createdAt: true } },
    },
  });
  if (!user) return null;
  const pid = user.candidateProfile?.id;
  const [applications, runs, interviews, aiByFeature, resumes, audit] = await Promise.all([
    pid
      ? prisma.application.findMany({
          where: { profileId: pid },
          orderBy: { appliedAt: "desc" },
          take: 25,
          select: { id: true, status: true, source: true, appliedAt: true, job: { select: { title: true, company: { select: { name: true } } } } },
        })
      : [],
    pid ? prisma.autoApplyRun.findMany({ where: { profileId: pid }, orderBy: { startedAt: "desc" }, take: 10, select: { startedAt: true, status: true, submitted: true, assisted: true, skipped: true, failed: true } }) : [],
    pid ? prisma.interviewSession.findMany({ where: { profileId: pid }, orderBy: { createdAt: "desc" }, take: 10, select: { createdAt: true, type: true, status: true, overallScore: true } }) : [],
    prisma.aiUsage.groupBy({ by: ["feature"], where: { userId, createdAt: { gte: since(30) } }, _count: { _all: true } }),
    pid ? prisma.resume.count({ where: { profileId: pid } }) : 0,
    prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30, select: { action: true, createdAt: true } }),
  ]);
  return {
    user: { ...user, sessions: user.sessions, payments: user.payments },
    applications: applications.map((a) => ({ id: a.id, status: a.status, source: a.source, appliedAt: a.appliedAt, title: a.job.title, company: a.job.company.name })),
    autoApplyRuns: runs,
    interviews,
    aiUsage30: Object.fromEntries(aiByFeature.map((r) => [r.feature, r._count._all])),
    resumes,
    recentActions: audit,
  };
}

// ---------------------------------------------------------------- enterprise

export async function listEnterprise(q: string | undefined) {
  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      OR: [{ enterpriseAccount: { isNot: null } }, { jobs: { some: {} } }],
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      enterpriseAccount: true,
      _count: { select: { members: true, jobs: { where: { status: "OPEN", deletedAt: null } } } },
      members: { where: { role: "OWNER" }, take: 1, select: { user: { select: { email: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const accountIds = companies.map((c) => c.enterpriseAccount?.id).filter(Boolean) as string[];
  const [jobs30, inmail30, unlocks30, screenings30, payments, lastEvent] = await Promise.all([
    prisma.enterpriseJobPost.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, createdAt: { gte: since(30) } }, _count: { _all: true } }),
    prisma.outreachMessage.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, createdAt: { gte: since(30) } }, _count: { _all: true } }),
    prisma.resumeUnlock.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, createdAt: { gte: since(30) } }, _count: { _all: true } }),
    prisma.atsScreening.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, createdAt: { gte: since(30) } }, _count: { _all: true } }),
    prisma.enterpriseEvent.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, type: { in: ["PAYMENT", "BOOST_PURCHASED"] } }, _sum: { amountCents: true } }),
    prisma.creditTransaction.groupBy({ by: ["accountId"], where: { accountId: { in: accountIds }, type: "CONSUME" }, _max: { createdAt: true } }),
  ]);
  const pick = <T extends { accountId: string }>(rows: T[], id?: string) => rows.find((r) => r.accountId === id);

  return companies.map((c) => {
    const a = c.enterpriseAccount;
    return {
      companyId: c.id,
      name: c.name,
      owner: c.members[0]?.user.email ?? null,
      members: c._count.members,
      openJobs: c._count.jobs,
      plan: a?.plan ?? null,
      status: a?.status ?? "FREE",
      complimentary: isComplimentary(a),
      trialEndsAt: a?.trialEndsAt ?? null,
      renewsAt: a?.currentPeriodEnd ?? null,
      jobsPosted30: pick(jobs30, a?.id)?._count._all ?? 0,
      inmail30: pick(inmail30, a?.id)?._count._all ?? 0,
      unlocks30: pick(unlocks30, a?.id)?._count._all ?? 0,
      screenings30: pick(screenings30, a?.id)?._count._all ?? 0,
      lifetimeRevenueCents: pick(payments, a?.id)?._sum.amountCents ?? 0,
      lastCreditUse: pick(lastEvent, a?.id)?._max.createdAt ?? null,
    };
  });
}

export async function enterpriseActivity(companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      enterpriseAccount: true,
      members: { select: { role: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
  });
  if (!company) return null;
  const accountId = company.enterpriseAccount?.id;
  const [events, credits, jobs] = await Promise.all([
    accountId ? prisma.enterpriseEvent.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 50 }) : [],
    accountId ? prisma.creditTransaction.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 50, select: { kind: true, type: true, delta: true, note: true, createdAt: true } }) : [],
    prisma.job.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, title: true, status: true, createdAt: true, _count: { select: { applications: true } } } }),
  ]);
  return {
    company: { id: company.id, name: company.name, createdAt: company.createdAt },
    account: company.enterpriseAccount ? { ...company.enterpriseAccount, complimentary: isComplimentary(company.enterpriseAccount) } : null,
    members: company.members.map((m) => ({ role: m.role, name: `${m.user.firstName} ${m.user.lastName}`, email: m.user.email, userId: m.user.id })),
    events,
    credits,
    jobs: jobs.map((j) => ({ id: j.id, title: j.title, status: j.status, createdAt: j.createdAt, applicants: j._count.applications })),
  };
}
