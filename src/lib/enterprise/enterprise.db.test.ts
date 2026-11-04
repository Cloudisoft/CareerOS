/**
 * Database-backed tests for the enterprise ledger, quotas, lifecycle and
 * InMail. They need a migrated Postgres database and run only when
 * ENTERPRISE_DB_TEST=1 (DATABASE_URL pointing at a throwaway database):
 *
 *   ENTERPRISE_DB_TEST=1 DATABASE_URL=postgresql://… pnpm vitest run src/lib/enterprise/enterprise.db.test.ts
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/notifications/service", () => ({ createNotification: async () => null }));

const enabled = process.env.ENTERPRISE_DB_TEST === "1";

describe.skipIf(!enabled)("enterprise (database)", async () => {
  const { prisma } = await import("@/lib/prisma");
  const acct = await import("./account");
  const outreach = await import("./outreach");
  const candidates = await import("./candidates");
  const boosts = await import("./boosts");
  const careers = await import("@/lib/careers/service");

  const tag = `t${Date.now()}`;
  let owner: Awaited<ReturnType<typeof prisma.user.create>>;
  let company: Awaited<ReturnType<typeof prisma.company.create>>;
  let otherCompany: Awaited<ReturnType<typeof prisma.company.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let candidateUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let privateUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let candidateProfileId: string;
  let privateProfileId: string;

  const mkUser = (name: string, role: "EMPLOYER" | "CANDIDATE") =>
    prisma.user.create({ data: { email: `${name}-${tag}@test.local`, passwordHash: "x", firstName: name, lastName: "Test", role } });

  async function ctx(): Promise<import("./account").RecruiterContext> {
    return { user: owner, company, role: "OWNER", state: await acct.getEnterpriseStateForCompany(company.id) } as never;
  }
  const newJob = (tx: import("@prisma/client").Prisma.TransactionClient, title = "Engineer") =>
    tx.job.create({ data: { companyId: company.id, title, description: "desc" } });
  async function setPaid(plan: "STARTER" | "PROFESSIONAL", periodStart: Date) {
    await prisma.enterpriseAccount.update({
      where: { companyId: company.id },
      data: { plan, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: new Date(periodStart.getTime() + 30 * 864e5) },
    });
  }

  beforeAll(async () => {
    owner = await mkUser("owner", "EMPLOYER");
    otherUser = await mkUser("hm", "EMPLOYER");
    candidateUser = await mkUser("cand", "CANDIDATE");
    privateUser = await mkUser("priv", "CANDIDATE");
    company = await prisma.company.create({ data: { name: `Firm ${tag}`, slug: `firm-${tag}`, members: { create: { userId: owner.id, role: "OWNER" } } } });
    otherCompany = await prisma.company.create({ data: { name: `Acme ${tag}`, slug: `acme-${tag}`, members: { create: { userId: otherUser.id, role: "OWNER" } } } });
    candidateProfileId = (
      await prisma.candidateProfile.create({ data: { userId: candidateUser.id, visibility: "RECRUITERS_ONLY", onboardingCompletedAt: new Date(), currentTitle: "Backend Engineer" } })
    ).id;
    privateProfileId = (
      await prisma.candidateProfile.create({ data: { userId: privateUser.id, visibility: "PRIVATE_UNTIL_APPLY", onboardingCompletedAt: new Date(), currentTitle: "Backend Engineer" } })
    ).id;
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { id: { in: [company.id, otherCompany.id] } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${tag}@test.local` } } });
    await prisma.careersListing.deleteMany({ where: { title: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  it("a new firm is FREE, trial-eligible, and cannot post jobs", async () => {
    const c = await ctx();
    expect(c.state.status).toBe("FREE");
    expect(c.state.trialEligible).toBe(true);
    expect(c.state.introEligible).toBe(true);
    await expect(acct.postJobWithinQuota(c, (tx) => newJob(tx))).rejects.toMatchObject({ code: "UPGRADE_REQUIRED" });
  });

  it("trial allows exactly 1 job per day, even under concurrency, and only once per firm", async () => {
    await acct.startTrial(await ctx());
    const c = await ctx();
    expect(c.state.status).toBe("TRIAL");
    expect(c.state.entitlements.resumeFetching).toBe(false);
    const results = await Promise.allSettled([1, 2, 3].map(() => acct.postJobWithinQuota(c, (tx) => newJob(tx))));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(rejected.every((r) => r.reason.code === "QUOTA_EXCEEDED")).toBe(true);
    await expect(acct.startTrial(await ctx())).rejects.toMatchObject({ code: "TRIAL_USED" });
    // premium features are refused server-side during the trial
    await expect(candidates.searchCandidates(c, {})).rejects.toMatchObject({ code: "UPGRADE_REQUIRED" });
  });

  it("an expired trial becomes FREE once, keeps the firm's data, and is not trial-eligible again", async () => {
    await prisma.enterpriseAccount.update({ where: { companyId: company.id }, data: { trialEndsAt: new Date(Date.now() - 1000) } });
    const [a, b] = await Promise.all([ctx(), ctx()]);
    expect(a.state.status).toBe("FREE");
    expect(b.state.status).toBe("FREE");
    expect(a.state.trialEligible).toBe(false);
    const events = await prisma.enterpriseEvent.count({ where: { account: { companyId: company.id }, type: "TRIAL_EXPIRED" } });
    expect(events).toBe(1);
    expect(await prisma.job.count({ where: { companyId: company.id } })).toBe(1);
  });

  it("credits: grant on first use, concurrent spends never exceed the allowance, never negative", async () => {
    await setPaid("STARTER", new Date("2026-11-01T00:00:00Z"));
    const c = await ctx();
    const attempts = await Promise.allSettled(
      Array.from({ length: 80 }, (_, i) => acct.consumeCredit(c.state, "INMAIL", `load:${i}`, { actorUserId: owner.id }))
    );
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(75);
    expect(
      attempts.filter((r): r is PromiseRejectedResult => r.status === "rejected").every((r) => r.reason.code === "NO_CREDITS")
    ).toBe(true);
    const bal = await acct.creditBalance(prisma, c.state, "INMAIL");
    expect(bal).toEqual({ granted: 75, used: 75, remaining: 0 });
  });

  it("the same refKey is charged once; a refund returns one credit, once", async () => {
    const c = await ctx();
    const first = await acct.consumeCredit(c.state, "RESUME_FETCH", "dup", { actorUserId: owner.id });
    const second = await acct.consumeCredit(c.state, "RESUME_FETCH", "dup", { actorUserId: owner.id });
    expect(first.charged).toBe(true);
    expect(second.charged).toBe(false);
    expect((await acct.creditBalance(prisma, c.state, "RESUME_FETCH")).used).toBe(1);
    await acct.refundCredit(c.state, "RESUME_FETCH", "dup", "test");
    await acct.refundCredit(c.state, "RESUME_FETCH", "dup", "test");
    expect((await acct.creditBalance(prisma, c.state, "RESUME_FETCH")).used).toBe(0);
  });

  it("an effect that fails rolls back the credit with it", async () => {
    const c = await ctx();
    await expect(
      acct.consumeCredit(c.state, "RESUME_FETCH", "boom", { actorUserId: owner.id }, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect((await acct.creditBalance(prisma, c.state, "RESUME_FETCH")).used).toBe(0);
  });

  it("upgrading in the same period tops up the allowance; a new period starts fresh", async () => {
    await setPaid("PROFESSIONAL", new Date("2026-11-01T00:00:00Z"));
    let c = await ctx();
    await acct.creditSummary(c.state);
    expect(await acct.creditBalance(prisma, c.state, "INMAIL")).toEqual({ granted: 175, used: 75, remaining: 100 });
    await setPaid("PROFESSIONAL", new Date("2026-12-01T00:00:00Z"));
    c = await ctx();
    await acct.creditSummary(c.state);
    expect(await acct.creditBalance(prisma, c.state, "INMAIL")).toEqual({ granted: 175, used: 0, remaining: 175 });
  });

  it("resume unlocks: hidden profiles are never reachable; unlock charges once; package needs unlock", async () => {
    const c = await ctx();
    const found = await candidates.searchCandidates(c, { q: "Backend" });
    const ids = found.results.map((r) => r.profileId);
    expect(ids).toContain(candidateProfileId);
    expect(ids).not.toContain(privateProfileId);
    const preview = found.results.find((r) => r.profileId === candidateProfileId)!;
    expect(preview.displayName).toBe("cand T.");
    await expect(candidates.candidatePackage(c, candidateProfileId)).rejects.toMatchObject({ code: "LOCKED" });
    await expect(candidates.unlockCandidate(c, privateProfileId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [u1, u2] = await Promise.all([candidates.unlockCandidate(c, candidateProfileId), candidates.unlockCandidate(c, candidateProfileId)]);
    expect([u1.charged, u2.charged].filter(Boolean)).toHaveLength(1);
    expect((await acct.creditBalance(prisma, c.state, "RESUME_FETCH")).used).toBe(1);
    expect((await candidates.unlockCandidate(c, candidateProfileId)).charged).toBe(false);
  });

  it("InMail: delivers in-app, blocks a second unanswered InMail, refunds the credit when they reply", async () => {
    const c = await ctx();
    const before = await acct.creditBalance(prisma, c.state, "INMAIL");
    const msg = await outreach.sendInMail(c, { requestId: crypto.randomUUID(), recipientUserId: otherUser.id, subject: "Hi", body: "Partnership?" });
    expect(msg.status).toBe("DELIVERED");
    expect(await prisma.message.count({ where: { conversationId: msg.conversationId! } })).toBe(1);
    // Retrying the same request neither re-sends nor re-charges.
    await outreach.sendInMail(c, { requestId: msg.id, recipientUserId: otherUser.id, subject: "Hi", body: "Partnership?" });
    expect((await acct.creditBalance(prisma, c.state, "INMAIL")).used).toBe(before.used + 1);
    await expect(
      outreach.sendInMail(c, { requestId: crypto.randomUUID(), recipientUserId: otherUser.id, subject: "Again", body: "?" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    // Private candidates and own team members can't be InMailed.
    await expect(outreach.sendInMail(c, { requestId: crypto.randomUUID(), recipientUserId: privateUser.id, subject: "x", body: "y" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    await prisma.message.create({ data: { conversationId: msg.conversationId!, senderId: otherUser.id, content: "Sure!" } });
    expect(await outreach.settleInmailReplies(c)).toBe(1);
    expect(await outreach.settleInmailReplies(c)).toBe(0);
    expect((await acct.creditBalance(prisma, c.state, "INMAIL")).used).toBe(before.used);
    const sent = await outreach.listInMail(c);
    expect(sent[0].status).toBe("REPLIED");
  });

  it("free post boost: one per allowance, no double boost of the same post", async () => {
    const c = await ctx();
    const post = await boosts.createAnnouncement(c, "We're hiring");
    const reqId = crypto.randomUUID();
    const [a, b] = await Promise.allSettled([
      boosts.createFreeBoost(c, "POST", { postId: post.id }, reqId),
      boosts.createFreeBoost(c, "POST", { postId: post.id }, crypto.randomUUID()),
    ]);
    const ok = [a, b].filter((r) => r.status === "fulfilled");
    expect(ok).toHaveLength(1);
    expect(await prisma.boost.count({ where: { postId: post.id } })).toBe(1);
    expect((await acct.creditBalance(prisma, c.state, "POST_BOOST")).remaining).toBe(0);
    expect(await boosts.activeBoostedPostIds()).toContain(post.id);
  });

  it("cancelled keeps access until period end, then EXPIRED with data kept", async () => {
    await prisma.enterpriseAccount.update({
      where: { companyId: company.id },
      data: { status: "CANCELLED", currentPeriodEnd: new Date(Date.now() + 864e5) },
    });
    expect((await ctx()).state.entitlements.resumeFetching).toBe(true);
    await prisma.enterpriseAccount.update({ where: { companyId: company.id }, data: { currentPeriodEnd: new Date(Date.now() - 1000) } });
    const c = await ctx();
    expect(c.state.status).toBe("EXPIRED");
    expect(c.state.entitlements.resumeFetching).toBe(false);
    expect(c.state.trialEligible).toBe(false);
    expect(await prisma.resumeUnlock.count({ where: { account: { companyId: company.id } } })).toBe(1);
    await expect(candidates.candidatePackage(c, candidateProfileId)).rejects.toMatchObject({ code: "UPGRADE_REQUIRED" });
  });

  it("PAST_DUE loses premium access", async () => {
    await prisma.enterpriseAccount.update({ where: { companyId: company.id }, data: { status: "PAST_DUE", currentPeriodEnd: new Date(Date.now() + 864e5) } });
    const c = await ctx();
    expect(c.state.entitlements.atsScreening).toBe(false);
    expect(c.state.entitlements.jobsPerDay).toBe(0);
  });

  it("careers: public reads never include the apply URL", async () => {
    const l = await careers.createListing(owner.id, { title: `${tag} Designer`, description: "Design things well.", applyUrl: "https://jobs.example.com/d" });
    const list = await careers.listPublicListings(tag);
    expect(list[0]).not.toHaveProperty("applyUrl");
    expect(JSON.stringify(list)).not.toContain("jobs.example.com");
    expect(await careers.getPublicListing(l.id)).not.toHaveProperty("applyUrl");
    expect(await careers.applyUrlFor(l.id)).toBe("https://jobs.example.com/d");
    await careers.updateListing(l.id, { published: false });
    expect(await careers.applyUrlFor(l.id)).toBeNull();
    expect(await careers.isCareersPublisher(owner.id)).toBe(false);
  });
});
