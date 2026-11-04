/**
 * Enterprise billing against a real database with the PayPal API mocked.
 * Runs only with ENTERPRISE_DB_TEST=1 (see enterprise.db.test.ts).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const paypal = vi.hoisted(() => ({ handler: (async () => ({})) as (path: string, init?: RequestInit) => Promise<unknown> }));
vi.mock("@/lib/paypal/client", () => ({
  isPayPalConfigured: () => true,
  PayPalNotConfiguredError: class extends Error {},
  paypalRequest: (path: string, init?: RequestInit) => paypal.handler(path, init),
}));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/notifications/service", () => ({ createNotification: async () => null }));

const enabled = process.env.ENTERPRISE_DB_TEST === "1";

describe.skipIf(!enabled)("enterprise billing (database, PayPal mocked)", async () => {
  process.env.PAYPAL_CLIENT_ID = "test-client";
  const { prisma } = await import("@/lib/prisma");
  const acct = await import("./account");
  const billing = await import("./billing");
  const boosts = await import("./boosts");

  const tag = `b${Date.now()}`;
  let owner: Awaited<ReturnType<typeof prisma.user.create>>;
  let company: Awaited<ReturnType<typeof prisma.company.create>>;
  const ctx = async () => ({ user: owner, company, role: "OWNER", state: await acct.getEnterpriseStateForCompany(company.id) }) as never as import("./account").RecruiterContext;
  const sub = (over: Record<string, unknown> = {}) => ({
    id: `I-${tag}`,
    status: "ACTIVE",
    plan_id: `P-STARTER_INTRO-${tag}`,
    custom_id: `ent:${company.id}`,
    start_time: "2026-11-04T10:00:00Z",
    billing_info: { next_billing_time: "2026-12-04T10:00:00Z", last_payment: { amount: { value: "199.00", currency_code: "USD" }, time: "2026-11-04T10:00:05Z" } },
    ...over,
  });

  beforeAll(async () => {
    owner = await prisma.user.create({ data: { email: `owner-${tag}@test.local`, passwordHash: "x", firstName: "O", lastName: "T", role: "EMPLOYER" } });
    company = await prisma.company.create({ data: { name: `Bill ${tag}`, slug: `bill-${tag}`, members: { create: { userId: owner.id, role: "OWNER" } } } });
    for (const v of ["STARTER", "PROFESSIONAL", "STARTER_INTRO", "PROFESSIONAL_INTRO"]) {
      await prisma.appSetting.upsert({ where: { key: `paypal.sandbox.enterprise.plan.${v}` }, create: { key: `paypal.sandbox.enterprise.plan.${v}`, value: `P-${v}-${tag}` }, update: { value: `P-${v}-${tag}` } });
    }
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { id: company.id } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${tag}@test.local` } } });
    await prisma.appSetting.deleteMany({ where: { value: { endsWith: tag } } });
    await prisma.$disconnect();
  });

  it("checkout offers the intro plan to a first-time firm", async () => {
    const c = await billing.subscriptionCheckout(await ctx(), "STARTER");
    expect(c.planId).toBe(`P-STARTER_INTRO-${tag}`);
    expect(c.intro).toBe(true);
    expect(c.customId).toBe(`ent:${company.id}`);
  });

  it("refuses to activate a subscription that isn't ACTIVE at PayPal or belongs to another firm", async () => {
    paypal.handler = async () => sub({ status: "APPROVAL_PENDING" });
    await expect(billing.confirmSubscription(await ctx(), `I-${tag}`)).rejects.toMatchObject({ code: "CONFLICT" });
    paypal.handler = async () => sub({ custom_id: "ent:someone-else" });
    await expect(billing.confirmSubscription(await ctx(), `I-${tag}`)).rejects.toMatchObject({ code: "FORBIDDEN" });
    paypal.handler = async () => sub({ plan_id: "P-UNKNOWN" });
    await expect(billing.confirmSubscription(await ctx(), `I-${tag}`)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect((await ctx()).state.status).toBe("FREE");
  });

  it("activates on a verified ACTIVE subscription; the intro can't be used twice", async () => {
    paypal.handler = async () => sub();
    await billing.confirmSubscription(await ctx(), `I-${tag}`);
    await billing.confirmSubscription(await ctx(), `I-${tag}`); // idempotent
    const c = await ctx();
    expect(c.state.status).toBe("ACTIVE");
    expect(c.state.plan).toBe("STARTER");
    expect(c.state.account!.introActive).toBe(true);
    expect(c.state.introEligible).toBe(false);
    expect(c.state.trialEligible).toBe(false);
    expect(await prisma.enterpriseEvent.count({ where: { accountId: c.state.account!.id, type: "SUBSCRIBED" } })).toBe(1);
    const again = await billing.subscriptionCheckout(c, "PROFESSIONAL");
    expect(again.planId).toBe(`P-PROFESSIONAL-${tag}`);
  });

  it("webhook: the first payment doesn't reset the period; a renewal does, once; plan switches at renewal", async () => {
    const c0 = await ctx();
    const period0 = c0.state.periodKey;
    paypal.handler = async () => sub();
    await billing.handleEnterpriseWebhook("PAYMENT.SALE.COMPLETED", { id: `S1-${tag}`, billing_agreement_id: `I-${tag}`, amount: { total: "199.00", currency: "USD" }, create_time: "2026-11-04T10:00:06Z" });
    expect((await ctx()).state.periodKey).toBe(period0);

    paypal.handler = async () => sub({ plan_id: `P-STARTER-${tag}`, billing_info: { next_billing_time: "2027-01-04T10:00:00Z" } });
    const renewal = { id: `S2-${tag}`, billing_agreement_id: `I-${tag}`, amount: { total: "499.00", currency: "USD" }, create_time: "2026-12-04T10:00:03Z" };
    await billing.handleEnterpriseWebhook("PAYMENT.SALE.COMPLETED", renewal);
    await billing.handleEnterpriseWebhook("PAYMENT.SALE.COMPLETED", renewal); // duplicate delivery
    const c = await ctx();
    expect(c.state.periodKey).toBe("2026-12-04T10:00:03.000Z");
    expect(c.state.account!.introActive).toBe(false);
    expect(await prisma.enterpriseEvent.count({ where: { accountId: c.state.account!.id, type: "PAYMENT" } })).toBe(2);
    expect(await prisma.payment.count({ where: { paypalTransactionId: { in: [`S1-${tag}`, `S2-${tag}`] } } })).toBe(2);
  });

  it("webhook: suspension → PAST_DUE (premium off), payment → ACTIVE; events for other subscriptions are ignored", async () => {
    await billing.handleEnterpriseWebhook("BILLING.SUBSCRIPTION.SUSPENDED", { id: `I-${tag}`, custom_id: `ent:${company.id}` });
    expect((await ctx()).state.status).toBe("PAST_DUE");
    expect((await ctx()).state.entitlements.resumeFetching).toBe(false);
    await billing.handleEnterpriseWebhook("BILLING.SUBSCRIPTION.CANCELLED", { id: "I-OLD-REPLACED", custom_id: `ent:${company.id}` });
    expect((await ctx()).state.status).toBe("PAST_DUE");
    paypal.handler = async () => sub({ plan_id: `P-STARTER-${tag}`, billing_info: { next_billing_time: "2027-01-04T10:00:00Z" } });
    await billing.handleEnterpriseWebhook("PAYMENT.SALE.COMPLETED", { id: `S3-${tag}`, billing_agreement_id: `I-${tag}`, amount: { total: "499.00", currency: "USD" }, create_time: "2026-12-06T10:00:00Z" });
    expect((await ctx()).state.status).toBe("ACTIVE");
  });

  it("paid boost: created only on a COMPLETED capture of the exact amount, and only once", async () => {
    const c = await ctx();
    const post = await prisma.post.create({ data: { authorId: owner.id, content: "Hiring", kind: "JOB_ANNOUNCEMENT" } });
    let captures = 0;
    paypal.handler = async (path) => {
      if (path === "/v2/checkout/orders") return { id: `O1-${tag}`, status: "CREATED" };
      if (path.endsWith("/capture")) {
        captures += 1;
        if (captures > 1) throw new Error("PayPal request failed (422): ORDER_ALREADY_CAPTURED");
        return { id: `O1-${tag}`, status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: `C1-${tag}`, status: "COMPLETED", amount: { value: "19.00", currency_code: "USD" } }] } }] };
      }
      return { id: `O1-${tag}`, status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: `C1-${tag}`, status: "COMPLETED", amount: { value: "19.00", currency_code: "USD" } }] } }] };
    };
    const order = await billing.createBoostOrder(c, "POST", { postId: post.id });
    expect(order.amountCents).toBe(1900);
    expect(await prisma.boost.count({ where: { postId: post.id } })).toBe(0); // nothing before payment
    const b1 = await billing.captureBoostOrder(c, order.orderId);
    const b2 = await billing.captureBoostOrder(c, order.orderId);
    expect(b1.id).toBe(b2.id);
    expect(await prisma.boost.count({ where: { postId: post.id } })).toBe(1);
    expect(await boosts.activeBoostedPostIds()).toContain(post.id);
  });

  it("paid boost: a short or failed capture creates nothing", async () => {
    const c = await ctx();
    const jobs = await Promise.all([1, 2].map((i) => prisma.job.create({ data: { companyId: company.id, title: `Job ${i}`, description: "d" } })));
    paypal.handler = async (path) => {
      if (path === "/v2/checkout/orders") return { id: `O2-${tag}`, status: "CREATED" };
      return { id: `O2-${tag}`, status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: `C2-${tag}`, status: "COMPLETED", amount: { value: "1.00", currency_code: "USD" } }] } }] };
    };
    const order = await billing.createBoostOrder(c, "CAMPAIGN", { name: "Fall", jobIds: jobs.map((j) => j.id) });
    await expect(billing.captureBoostOrder(c, order.orderId)).rejects.toMatchObject({ code: "PROVIDER_FAILED" });
    expect(await prisma.boost.count({ where: { accountId: c.state.account!.id, kind: "CAMPAIGN" } })).toBe(0);
    expect((await prisma.boostOrder.findUnique({ where: { paypalOrderId: order.orderId } }))!.status).toBe("FAILED");
  });

  it("campaign boosts only accept the firm's own open jobs", async () => {
    const c = await ctx();
    await expect(boosts.validateBoostTarget(prisma, company.id, "CAMPAIGN", { name: "x", jobIds: ["not-mine"] })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(c.state.status).toBe("ACTIVE");
  });

  it("cancel keeps access until period end", async () => {
    paypal.handler = async () => undefined;
    await billing.cancelSubscription(await ctx(), "testing");
    const c = await ctx();
    expect(c.state.status).toBe("CANCELLED");
    expect(c.state.entitlements.resumeFetching).toBe(true);
  });
});
