#!/usr/bin/env node
/**
 * One-time setup: creates the PayPal product + billing plan for each Career
 * OS pricing tier and add-on, and prints the exact Railway env vars to set.
 *
 * Usage:
 *   PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_ENV=sandbox node scripts/paypal-setup.mjs
 *
 * PAYPAL_ENV defaults to "sandbox" — run it there first, confirm checkout
 * works end to end, then re-run with PAYPAL_ENV=live and your live app's
 * credentials to create the real plans. Safe to re-run: it always creates
 * new products/plans rather than mutating existing ones, so a repeat run
 * just gives you a second set of plan IDs (PayPal has no "does this already
 * exist" check for subscription plans by name).
 */

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const apiBase = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

if (!clientId || !clientSecret) {
  console.error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET before running this script.");
  process.exit(1);
}

// [planKey, product name, description, monthly price USD]
const PLANS = [
  ["BASIC", "Career OS Basic", "Career OS Basic plan", "19.00", "MONTH"],
  ["STANDARD", "Career OS Standard", "Career OS Standard plan", "49.00", "MONTH"],
  ["PREMIUM", "Career OS Premium", "Career OS Premium plan", "99.00", "MONTH"],
  ["ELITE", "Career OS Elite", "Career OS Elite plan", "149.00", "MONTH"],
];
const ADD_ONS = [
  ["RESUME_STUDIO", "Career OS Resume Studio add-on", "Unlimited Resume Studio, independent of plan", "2.99", "MONTH"],
  ["INTERVIEW_AI", "Career OS Interview AI add-on", "Unlimited Interview AI sessions", "199.00", "YEAR"],
];

async function getAccessToken() {
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`OAuth token request failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function paypal(token, path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function createProduct(token, name, description) {
  const product = await paypal(token, "/v1/catalogs/products", {
    name,
    description,
    type: "SERVICE",
    category: "SOFTWARE",
  });
  return product.id;
}

async function createPlan(token, productId, name, price, interval) {
  const plan = await paypal(token, "/v1/billing/plans", {
    product_id: productId,
    name,
    billing_cycles: [
      {
        frequency: { interval_unit: interval, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // runs until cancelled
        pricing_scheme: { fixed_price: { value: price, currency_code: "USD" } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 2,
    },
  });
  return plan.id;
}

async function main() {
  console.log(`Creating PayPal products/plans in ${env.toUpperCase()} (${apiBase})...\n`);
  const token = await getAccessToken();
  const results = {};

  for (const [key, name, description, price, interval] of [...PLANS, ...ADD_ONS]) {
    process.stdout.write(`  ${name}... `);
    const productId = await createProduct(token, name, description);
    const planId = await createPlan(token, productId, name, price, interval);
    results[key] = planId;
    console.log(planId);
  }

  console.log("\nSet these on Railway (Variables tab, web service):\n");
  console.log(`PAYPAL_CLIENT_ID=${clientId}`);
  console.log(`PAYPAL_CLIENT_SECRET=${clientSecret}`);
  console.log(`PAYPAL_ENV=${env}`);
  console.log(`PAYPAL_PLAN_BASIC=${results.BASIC}`);
  console.log(`PAYPAL_PLAN_STANDARD=${results.STANDARD}`);
  console.log(`PAYPAL_PLAN_PREMIUM=${results.PREMIUM}`);
  console.log(`PAYPAL_PLAN_ELITE=${results.ELITE}`);
  console.log(`PAYPAL_PLAN_RESUME_STUDIO=${results.RESUME_STUDIO}`);
  console.log(`PAYPAL_PLAN_INTERVIEW_AI=${results.INTERVIEW_AI}`);
  console.log(
    "\nOne more step after this: in the PayPal developer dashboard, add a webhook pointing at\n" +
      "https://careeros.silverspringstaffing.com/api/webhooks/paypal subscribed to the\n" +
      "BILLING.SUBSCRIPTION.* and PAYMENT.SALE.COMPLETED events, then set PAYPAL_WEBHOOK_ID\n" +
      "from that webhook's details page."
  );
}

main().catch((err) => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
