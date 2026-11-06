/**
 * Giving Interview AI and Learning Hub access by hand, against a real database. Runs only when
 * TEST_DATABASE_URL points at a migrated, disposable Postgres (it creates and deletes its own rows).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("admin: Interview AI and Learning Hub access (database)", async () => {
  const { prisma } = await import("@/lib/prisma");
  const access = await import("@/lib/admin/feature-access");
  const { getEntitlements } = await import("@/lib/billing/entitlements");
  const stamp = Date.now();
  const emails = [`access-admin-${stamp}@example.com`, `access-offline-${stamp}@example.com`];
  let adminId = "";
  let userId = "";

  beforeAll(async () => {
    adminId = (await prisma.user.create({ data: { email: emails[0], firstName: "Fakhruddin", lastName: "Admin", role: "PLATFORM_ADMIN" } })).id;
    userId = (await prisma.user.create({ data: { email: emails[1], firstName: "Offline", lastName: "Learner", role: "CANDIDATE", candidateProfile: { create: {} } } })).id;
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
  });

  it("finds the account by name or email", async () => {
    const byName = await access.searchAccounts("Offline Lear".split(" ")[0]);
    expect(byName.some((a) => a.id === userId)).toBe(true);
    const byEmail = await access.searchAccounts(`access-offline-${stamp}`);
    expect(byEmail[0]).toMatchObject({ id: userId, plan: null, access: [] });
  });

  it("a free account has neither until it's given; then both, for the time chosen", async () => {
    let e = await getEntitlements(userId);
    expect(e.interviewAi).toBe(false);
    expect(e.learning).toBe(false);

    const r = await access.grantFeatures(adminId, { userId, features: ["INTERVIEW_AI", "LEARNING_HUB"], months: 6 });
    expect(r.features).toEqual(["INTERVIEW_AI", "LEARNING_HUB"]);
    const days = (r.endsAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(178);
    expect(days).toBeLessThan(186);

    e = await getEntitlements(userId);
    expect(e.interviewAi).toBe(true);
    expect(e.companyInterviewPrep).toBe(true);
    expect(e.learning).toBe(true);
    expect((await access.listFeatureGrants()).filter((g) => g.userId === userId).map((g) => g.feature).sort()).toEqual(["INTERVIEW_AI", "LEARNING_HUB"]);
    const audit = await prisma.auditLog.findFirst({ where: { userId: adminId, action: "admin.access.granted", targetId: userId } });
    expect(audit).not.toBeNull();
  });

  it("ends on its own when the time is up", async () => {
    await prisma.addOnSubscription.update({ where: { userId_addOn: { userId, addOn: "LEARNING_HUB" } }, data: { currentPeriodEnd: new Date(Date.now() - 60_000) } });
    const e = await getEntitlements(userId);
    expect(e.learning).toBe(false);
    expect(e.interviewAi).toBe(true);
    expect((await access.listFeatureGrants()).some((g) => g.userId === userId && g.feature === "LEARNING_HUB")).toBe(false);
  });

  it("can be given again for a year, and ended early", async () => {
    await access.grantFeatures(adminId, { userId, features: ["LEARNING_HUB"], months: 12 });
    expect((await getEntitlements(userId)).learning).toBe(true);
    await access.revokeFeature(adminId, { userId, feature: "INTERVIEW_AI" });
    const e = await getEntitlements(userId);
    expect(e.interviewAi).toBe(false);
    expect(e.learning).toBe(true);
    await expect(access.revokeFeature(adminId, { userId, feature: "INTERVIEW_AI" })).rejects.toThrow(/no granted Interview AI/);
  });

  it("never touches access someone pays for through PayPal", async () => {
    await prisma.addOnSubscription.update({
      where: { userId_addOn: { userId, addOn: "INTERVIEW_AI" } },
      data: { status: "ACTIVE", paypalSubscriptionId: `I-TEST-${stamp}`, currentPeriodEnd: new Date(Date.now() + 86_400_000) },
    });
    await expect(access.grantFeatures(adminId, { userId, features: ["INTERVIEW_AI"], months: 6 })).rejects.toThrow(/PayPal/);
    await expect(access.revokeFeature(adminId, { userId, feature: "INTERVIEW_AI" })).rejects.toThrow();
  });
});
