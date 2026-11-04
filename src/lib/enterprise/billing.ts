import "server-only";
import { prisma } from "@/lib/prisma";
import { paypalRequest, isPayPalConfigured, PayPalNotConfiguredError } from "@/lib/paypal/client";
import type { EnterpriseAccount, EnterprisePlanKey, BoostKind } from "@prisma/client";
import {
  EnterpriseError,
  recordEvent,
  requireBillingManager,
  requireFeature,
  type RecruiterContext,
} from "./account";
import { ENTERPRISE_PLANS, INTRO_PRICE_CENTS, BOOST_PRICES_CENTS, BOOST_DAYS, getEnterprisePlan } from "./plans";
import { validateBoostTarget, createPaidBoost, type BoostPayload } from "./boosts";

/**
 * Enterprise billing on the existing PayPal integration (no new gateway).
 *
 * Plans: the app creates its own PayPal product and four billing plans
 * (Starter, Professional, and an "intro" variant of each whose first cycle
 * is $199 and then renews at the regular price) from Admin → Enterprise
 * billing, and keeps their ids in AppSetting — namespaced by PAYPAL_ENV so
 * sandbox and live ids can never mix.
 *
 * The account only becomes ACTIVE after the server reads the subscription
 * back from PayPal and it is ACTIVE there; boosts are only created after a
 * PayPal capture is COMPLETED for the exact amount.
 */

const ENV = () => (process.env.PAYPAL_ENV === "live" ? "live" : "sandbox");
type PlanVariant = EnterprisePlanKey | `${EnterprisePlanKey}_INTRO`;
const settingKey = (name: string) => `paypal.${ENV()}.enterprise.${name}`;

async function getSetting(key: string) {
  return (await prisma.appSetting.findUnique({ where: { key } }))?.value ?? null;
}
async function setSetting(key: string, value: string) {
  await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

export async function enterprisePlanIds(): Promise<Partial<Record<PlanVariant, string>>> {
  const rows = await prisma.appSetting.findMany({ where: { key: { startsWith: settingKey("plan.") } } });
  const out: Partial<Record<PlanVariant, string>> = {};
  for (const r of rows) out[r.key.slice(settingKey("plan.").length) as PlanVariant] = r.value;
  return out;
}

function planFromPayPalPlanId(ids: Partial<Record<PlanVariant, string>>, planId: string) {
  for (const [variant, id] of Object.entries(ids)) {
    if (id === planId) {
      const intro = variant.endsWith("_INTRO");
      return { plan: variant.replace("_INTRO", "") as EnterprisePlanKey, intro };
    }
  }
  return null;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

/**
 * Creates the PayPal product and the four plans, skipping any that already
 * exist. Safe to run more than once. Platform admins only (checked by the route).
 */
export async function setupEnterprisePlans() {
  if (!isPayPalConfigured()) throw new PayPalNotConfiguredError();
  let productId = await getSetting(settingKey("product"));
  if (!productId) {
    const product = await paypalRequest<{ id: string }>("/v1/catalogs/products", {
      method: "POST",
      headers: { "PayPal-Request-Id": `careeros-enterprise-product-${ENV()}` },
      body: JSON.stringify({
        name: "Career OS Enterprise Recruiter Suite",
        description: "Recruiter and recruitment firm subscription",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    });
    productId = product.id;
    await setSetting(settingKey("product"), productId);
  }

  const existing = await enterprisePlanIds();
  const created: string[] = [];
  for (const plan of ENTERPRISE_PLANS) {
    for (const intro of [false, true]) {
      const variant: PlanVariant = intro ? `${plan.key}_INTRO` : plan.key;
      if (existing[variant]) continue;
      const regular = {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: intro ? 2 : 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: dollars(plan.priceCents), currency_code: "USD" } },
      };
      const cycles = intro
        ? [
            {
              frequency: { interval_unit: "MONTH", interval_count: 1 },
              tenure_type: "TRIAL",
              sequence: 1,
              total_cycles: 1,
              pricing_scheme: { fixed_price: { value: dollars(INTRO_PRICE_CENTS), currency_code: "USD" } },
            },
            regular,
          ]
        : [regular];
      const res = await paypalRequest<{ id: string }>("/v1/billing/plans", {
        method: "POST",
        headers: { "PayPal-Request-Id": `careeros-enterprise-${variant}-${ENV()}`, Prefer: "return=representation" },
        body: JSON.stringify({
          product_id: productId,
          name: intro ? `${plan.name} (first month $${dollars(INTRO_PRICE_CENTS)})` : plan.name,
          description: intro
            ? `$${dollars(INTRO_PRICE_CENTS)} for the first month, then $${dollars(plan.priceCents)}/month`
            : `$${dollars(plan.priceCents)}/month`,
          status: "ACTIVE",
          billing_cycles: cycles,
          payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: "CANCEL", payment_failure_threshold: 2 },
        }),
      });
      await setSetting(settingKey(`plan.${variant}`), res.id);
      created.push(variant);
    }
  }
  return { productId, env: ENV(), created, plans: await enterprisePlanIds() };
}

// ------------------------------------------------------------ subscriptions

interface EntSubscription {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  custom_id?: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount: { value: string; currency_code: string }; time: string };
  };
}

const getSubscription = (id: string) => paypalRequest<EntSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(id)}`);
const customIdFor = (companyId: string) => `ent:${companyId}`;

/** What the browser needs to render a PayPal subscribe button for `plan`. Picks the intro plan when the firm is eligible. */
export async function subscriptionCheckout(ctx: RecruiterContext, plan: EnterprisePlanKey) {
  requireBillingManager(ctx);
  if (ctx.state.account && ctx.state.status === "ACTIVE" && !ctx.state.account.paypalSubscriptionId) {
    throw new EnterpriseError("Your company has a complimentary plan, so there's nothing to pay.", "CONFLICT");
  }
  if (!isPayPalConfigured()) throw new PayPalNotConfiguredError();
  getEnterprisePlan(plan);
  const ids = await enterprisePlanIds();
  const intro = ctx.state.introEligible;
  const planId = intro ? ids[`${plan}_INTRO`] : ids[plan];
  if (!planId) {
    throw new EnterpriseError("Enterprise billing plans haven't been set up yet. A platform admin needs to create them first.", "PRICE_NOT_CONFIGURED");
  }
  if (ctx.state.plan === plan && (ctx.state.status === "ACTIVE" || ctx.state.status === "PAST_DUE")) {
    throw new EnterpriseError("You're already on this plan.", "CONFLICT");
  }
  return { clientId: process.env.PAYPAL_CLIENT_ID!, planId, customId: customIdFor(ctx.company.id), intro };
}

function periodFrom(details: EntSubscription) {
  const start = details.billing_info?.last_payment?.time ?? details.start_time ?? new Date().toISOString();
  const end = details.billing_info?.next_billing_time;
  return { start: new Date(start), end: end ? new Date(end) : null };
}

/**
 * Called after the PayPal button approves. Reads the subscription back
 * from PayPal and activates only if it's ACTIVE, belongs to this firm, and
 * is one of our enterprise plans. Replacing an existing subscription (an
 * upgrade) cancels the old one in PayPal.
 */
export async function confirmSubscription(ctx: RecruiterContext, subscriptionId: string) {
  requireBillingManager(ctx);
  const details = await getSubscription(subscriptionId);
  if (details.custom_id !== customIdFor(ctx.company.id)) {
    throw new EnterpriseError("This subscription doesn't belong to your company.", "FORBIDDEN");
  }
  const match = planFromPayPalPlanId(await enterprisePlanIds(), details.plan_id);
  if (!match) throw new EnterpriseError("This subscription isn't for an Enterprise plan.", "VALIDATION_ERROR");
  if (details.status !== "ACTIVE") {
    throw new EnterpriseError(`PayPal reports this subscription as ${details.status.toLowerCase()}, not active yet. Refresh in a minute.`, "CONFLICT");
  }

  const { start, end } = periodFrom(details);
  const previous = ctx.state.account;
  const replacing = previous?.paypalSubscriptionId && previous.paypalSubscriptionId !== subscriptionId ? previous.paypalSubscriptionId : null;

  const account = await prisma.$transaction(async (tx) => {
    const existing = await tx.enterpriseAccount.findUnique({ where: { companyId: ctx.company.id } });
    if (existing?.paypalSubscriptionId === subscriptionId && existing.status === "ACTIVE") return existing;
    const data = {
      plan: match.plan,
      status: "ACTIVE" as const,
      paypalSubscriptionId: subscriptionId,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      introActive: match.intro,
      ...(match.intro ? { introUsedAt: existing?.introUsedAt ?? new Date() } : {}),
    };
    const acc = existing
      ? await tx.enterpriseAccount.update({ where: { id: existing.id }, data })
      : await tx.enterpriseAccount.create({ data: { companyId: ctx.company.id, ...data } });
    await recordEvent(tx, acc.id, {
      type: "SUBSCRIBED",
      fromStatus: existing?.status ?? null,
      toStatus: "ACTIVE",
      plan: match.plan,
      amountCents: match.intro ? INTRO_PRICE_CENTS : getEnterprisePlan(match.plan).priceCents,
      detail: `${match.intro ? "Intro first month. " : ""}PayPal subscription ${subscriptionId}${replacing ? `, replaces ${replacing}` : ""}`,
      actorUserId: ctx.user.id,
    });
    return acc;
  });

  if (replacing) {
    await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(replacing)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: "Replaced by a new Career OS Enterprise plan" }),
    }).catch((e) => console.error(`Could not cancel replaced PayPal subscription ${replacing}`, e));
  }
  return account;
}

/**
 * Downgrade (Professional → Starter) through PayPal's revise flow: the
 * firm keeps Professional until the paid-up period ends, and the next
 * renewal bills — and grants — Starter. Returns PayPal's approval link.
 */
export async function scheduleDowngrade(ctx: RecruiterContext, plan: EnterprisePlanKey, returnUrl: string) {
  requireBillingManager(ctx);
  const account = ctx.state.account;
  if (!account?.paypalSubscriptionId || ctx.state.status !== "ACTIVE" || !account.plan) {
    throw new EnterpriseError("You need an active subscription to change plans.", "CONFLICT");
  }
  if (getEnterprisePlan(plan).priceCents >= getEnterprisePlan(account.plan).priceCents) {
    throw new EnterpriseError("That's an upgrade — subscribe to the new plan instead.", "VALIDATION_ERROR");
  }
  const planId = (await enterprisePlanIds())[plan];
  if (!planId) throw new EnterpriseError("Enterprise billing plans haven't been set up yet.", "PRICE_NOT_CONFIGURED");
  const res = await paypalRequest<{ links?: { rel: string; href: string }[] }>(
    `/v1/billing/subscriptions/${encodeURIComponent(account.paypalSubscriptionId)}/revise`,
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        application_context: { brand_name: "Career OS", return_url: returnUrl, cancel_url: returnUrl, user_action: "CONTINUE" },
      }),
    }
  );
  await recordEvent(prisma, account.id, {
    type: "DOWNGRADE_REQUESTED",
    plan,
    actorUserId: ctx.user.id,
    detail: `Takes effect at renewal${account.currentPeriodEnd ? ` on ${account.currentPeriodEnd.toISOString().slice(0, 10)}` : ""}`,
  });
  const approve = res.links?.find((l) => l.rel === "approve")?.href ?? null;
  return { approveUrl: approve };
}

/** Cancels at PayPal; access continues until the end of the paid-up period, then the firm drops to EXPIRED (data kept). */
export async function cancelSubscription(ctx: RecruiterContext, reason?: string) {
  requireBillingManager(ctx);
  const account = ctx.state.account;
  if (!account?.paypalSubscriptionId || !["ACTIVE", "PAST_DUE"].includes(account.status)) {
    throw new EnterpriseError("There's no active subscription to cancel.", "CONFLICT");
  }
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(account.paypalSubscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: (reason || "Cancelled by customer").slice(0, 120) }),
  });
  const updated = await prisma.enterpriseAccount.update({
    where: { id: account.id },
    data: { status: "CANCELLED", cancelAtPeriodEnd: true },
  });
  await recordEvent(prisma, account.id, {
    type: "CANCELLED",
    fromStatus: account.status,
    toStatus: "CANCELLED",
    plan: account.plan,
    actorUserId: ctx.user.id,
    detail: account.currentPeriodEnd ? `Access until ${account.currentPeriodEnd.toISOString().slice(0, 10)}` : null,
  });
  return updated;
}

// ------------------------------------------------------------ webhooks

const MIN_PERIOD_GAP_MS = 20 * 24 * 60 * 60 * 1000;

async function ownerUserId(companyId: string) {
  const owner = await prisma.companyMember.findFirst({ where: { companyId }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
  return owner?.userId ?? null;
}

async function accountForSubscription(subscriptionId: string | undefined): Promise<EnterpriseAccount | null> {
  if (!subscriptionId) return null;
  return prisma.enterpriseAccount.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
}

/** True when the event is about an enterprise subscription (handled here, not by the candidate billing code). */
export async function isEnterpriseWebhook(eventType: string, resource: Record<string, unknown>) {
  if (typeof resource.custom_id === "string" && resource.custom_id.startsWith("ent:")) return true;
  const subId = eventType.startsWith("PAYMENT.SALE") ? (resource.billing_agreement_id as string | undefined) : (resource.id as string | undefined);
  return Boolean(await accountForSubscription(subId));
}

export async function handleEnterpriseWebhook(eventType: string, resource: Record<string, unknown>) {
  if (eventType.startsWith("PAYMENT.SALE")) {
    const account = await accountForSubscription(resource.billing_agreement_id as string | undefined);
    if (!account) return;
    if (eventType !== "PAYMENT.SALE.COMPLETED") return;
    const amount = resource.amount as { total: string; currency: string };
    const amountCents = Math.round(parseFloat(amount.total) * 100);
    const saleId = resource.id as string;
    const saleTime = new Date((resource.create_time as string) ?? Date.now());

    // Payment row for the firm's owner, so it appears with their other receipts.
    const userId = await ownerUserId(account.companyId);
    if (userId) {
      await prisma.payment.upsert({
        where: { paypalTransactionId: saleId },
        create: { userId, paypalTransactionId: saleId, amount: amountCents, currency: amount.currency.toLowerCase(), status: "completed", description: "Career OS Enterprise subscription" },
        update: { status: "completed" },
      });
    }
    const already = await prisma.enterpriseEvent.findFirst({ where: { accountId: account.id, type: "PAYMENT", detail: { startsWith: saleId } } });
    if (already) return;

    // A renewal starts a new period (and a fresh credit allowance); the first
    // payment of a subscription we just confirmed does not.
    const details = await getSubscription(account.paypalSubscriptionId!);
    const match = planFromPayPalPlanId(await enterprisePlanIds(), details.plan_id);
    const newPeriod = !account.currentPeriodStart || saleTime.getTime() - account.currentPeriodStart.getTime() > MIN_PERIOD_GAP_MS;
    const plan = newPeriod && match ? match.plan : account.plan;
    await prisma.enterpriseAccount.update({
      where: { id: account.id },
      data: {
        status: account.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
        plan,
        introActive: amountCents === INTRO_PRICE_CENTS,
        ...(newPeriod ? { currentPeriodStart: saleTime } : {}),
        currentPeriodEnd: details.billing_info?.next_billing_time ? new Date(details.billing_info.next_billing_time) : account.currentPeriodEnd,
      },
    });
    await recordEvent(prisma, account.id, {
      type: "PAYMENT",
      fromStatus: account.status,
      toStatus: account.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
      plan,
      amountCents,
      detail: `${saleId} · ${amount.currency}`,
    });
    if (plan !== account.plan) {
      await recordEvent(prisma, account.id, { type: "PLAN_CHANGED", plan, detail: `${account.plan} → ${plan} at renewal` });
    }
    return;
  }

  const account = await accountForSubscription(resource.id as string | undefined);
  // Events for a subscription the firm already replaced (e.g. the old plan
  // after an upgrade) are ignored — they must not touch the new one.
  if (!account) return;
  const next: Record<string, EnterpriseAccount["status"]> = {
    "BILLING.SUBSCRIPTION.SUSPENDED": "PAST_DUE",
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "PAST_DUE",
    "BILLING.SUBSCRIPTION.CANCELLED": "CANCELLED",
    "BILLING.SUBSCRIPTION.EXPIRED": "EXPIRED",
    "BILLING.SUBSCRIPTION.ACTIVATED": "ACTIVE",
    "BILLING.SUBSCRIPTION.RE-ACTIVATED": "ACTIVE",
  };
  let status = next[eventType];
  if (!status) return; // UPDATED etc.: plan/price changes are applied at the next payment
  if (status === "ACTIVE" && account.status === "CANCELLED") status = "CANCELLED";
  if (status === account.status) return;
  await prisma.enterpriseAccount.update({
    where: { id: account.id },
    data: { status, ...(status === "CANCELLED" ? { cancelAtPeriodEnd: true } : {}) },
  });
  await recordEvent(prisma, account.id, {
    type: eventType.replace("BILLING.SUBSCRIPTION.", "PAYPAL_"),
    fromStatus: account.status,
    toStatus: status,
    plan: account.plan,
  });
}

// ------------------------------------------------------------ boost orders

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units?: { payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] } }[];
}

/** Creates a PayPal order at the published price. Nothing is charged until the buyer approves and we capture. */
export async function createBoostOrder(ctx: RecruiterContext, kind: BoostKind, payload: BoostPayload) {
  requireFeature(ctx.state, "paidBoosts", "Paid boosts");
  if (!isPayPalConfigured()) throw new PayPalNotConfiguredError();
  const target = await validateBoostTarget(prisma, ctx.company.id, kind, payload);
  const amountCents = BOOST_PRICES_CENTS[kind];
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: dollars(amountCents) },
          description: kind === "POST" ? `Career OS post boost (${BOOST_DAYS.POST} days)` : `Career OS campaign boost (${BOOST_DAYS.CAMPAIGN} days)`,
          custom_id: `boost:${ctx.state.account!.id}`,
        },
      ],
      application_context: { brand_name: "Career OS", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
    }),
  });
  await prisma.boostOrder.create({
    data: {
      accountId: ctx.state.account!.id,
      kind,
      amountCents,
      paypalOrderId: order.id,
      status: "CREATED",
      payload: target as object,
      createdById: ctx.user.id,
    },
  });
  return { orderId: order.id, amountCents };
}

/**
 * Captures an approved order and creates the boost — once. The status flip
 * CREATED → CAPTURED is conditional, so a double submit or a retry can
 * never create two boosts or charge twice (PayPal refuses a second capture).
 */
export async function captureBoostOrder(ctx: RecruiterContext, paypalOrderId: string) {
  const order = await prisma.boostOrder.findUnique({ where: { paypalOrderId } });
  if (!order || order.accountId !== ctx.state.account?.id) throw new EnterpriseError("This order could not be found.", "NOT_FOUND");
  if (order.status === "CAPTURED" && order.boostId) return prisma.boost.findUniqueOrThrow({ where: { id: order.boostId } });

  let result: PayPalOrder;
  try {
    result = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `capture-${order.id}` },
    });
  } catch (error) {
    // Already captured (e.g. a retry after a dropped response) — read the truth back.
    if (error instanceof Error && error.message.includes("ORDER_ALREADY_CAPTURED")) {
      result = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
    } else {
      console.error("Boost capture failed", error);
      await prisma.boostOrder.updateMany({ where: { id: order.id, status: "CREATED" }, data: { status: "FAILED" } });
      throw new EnterpriseError("PayPal didn't complete the payment, so you weren't charged and no boost was created.", "PROVIDER_FAILED");
    }
  }

  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  const paid =
    result.status === "COMPLETED" &&
    capture?.status === "COMPLETED" &&
    capture.amount.currency_code === "USD" &&
    Math.round(parseFloat(capture.amount.value) * 100) === order.amountCents;
  if (!paid) {
    await prisma.boostOrder.updateMany({ where: { id: order.id, status: "CREATED" }, data: { status: "FAILED" } });
    throw new EnterpriseError("PayPal hasn't confirmed this payment, so no boost was created.", "PROVIDER_FAILED");
  }

  const boost = await prisma.$transaction(async (tx) => {
    const flipped = await tx.boostOrder.updateMany({ where: { id: order.id, status: { in: ["CREATED", "FAILED"] } }, data: { status: "CAPTURED" } });
    if (!flipped.count) {
      const current = await tx.boostOrder.findUniqueOrThrow({ where: { id: order.id } });
      return current.boostId ? tx.boost.findUniqueOrThrow({ where: { id: current.boostId } }) : null;
    }
    const created = await createPaidBoost(tx, order);
    await tx.boostOrder.update({ where: { id: order.id }, data: { boostId: created.id } });
    await tx.payment.upsert({
      where: { paypalTransactionId: capture!.id },
      create: {
        userId: order.createdById,
        paypalTransactionId: capture!.id,
        amount: order.amountCents,
        currency: "usd",
        status: "completed",
        description: order.kind === "POST" ? "Career OS post boost" : "Career OS campaign boost",
      },
      update: {},
    });
    await recordEvent(tx, order.accountId, {
      type: "BOOST_PURCHASED",
      amountCents: order.amountCents,
      actorUserId: ctx.user.id,
      detail: `${capture!.id} · ${order.kind}`,
    });
    return created;
  });
  if (!boost) throw new EnterpriseError("This order is still being processed. Refresh in a moment.", "CONFLICT");
  return boost;
}

export function boostCheckoutInfo() {
  return { clientId: isPayPalConfigured() ? process.env.PAYPAL_CLIENT_ID! : null, prices: BOOST_PRICES_CENTS, days: BOOST_DAYS };
}
