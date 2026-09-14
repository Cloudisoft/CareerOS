import { NextRequest, NextResponse } from "next/server";
import { paypalRequest } from "@/lib/paypal/client";

/**
 * One-time, secret-gated setup endpoint: creates the PayPal product +
 * billing plan for every pricing tier and add-on via PayPal's REST API,
 * and returns the resulting plan IDs. Exists only because this project's
 * sandbox has no outbound network access to paypal.com to run this from a
 * local script — Railway's runtime does, so the call happens here instead.
 *
 * Gated by PAYPAL_SETUP_TOKEN (a random value, not the PayPal credentials
 * themselves) rather than session auth, since it's meant to be hit once via
 * a plain link. Remove this route once the plan IDs it returns have been
 * copied into PAYPAL_PLAN_* env vars — it has no reason to keep existing
 * after that, and re-running it creates a second, unused set of plans.
 */

interface PlanSpec {
  key: string;
  name: string;
  description: string;
  price: string;
  interval: "MONTH" | "YEAR";
}

const SPECS: PlanSpec[] = [
  { key: "BASIC", name: "Career OS Basic", description: "Career OS Basic plan", price: "19.00", interval: "MONTH" },
  { key: "STANDARD", name: "Career OS Standard", description: "Career OS Standard plan", price: "49.00", interval: "MONTH" },
  { key: "PREMIUM", name: "Career OS Premium", description: "Career OS Premium plan", price: "99.00", interval: "MONTH" },
  { key: "ELITE", name: "Career OS Elite", description: "Career OS Elite plan", price: "149.00", interval: "MONTH" },
  {
    key: "RESUME_STUDIO",
    name: "Career OS Resume Studio add-on",
    description: "Unlimited Resume Studio, independent of plan",
    price: "2.99",
    interval: "MONTH",
  },
  {
    key: "INTERVIEW_AI",
    name: "Career OS Interview AI add-on",
    description: "Unlimited Interview AI sessions",
    price: "199.00",
    interval: "YEAR",
  },
];

async function createProduct(name: string, description: string): Promise<string> {
  const product = await paypalRequest<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({ name, description, type: "SERVICE", category: "SOFTWARE" }),
  });
  return product.id;
}

async function createPlan(productId: string, name: string, price: string, interval: "MONTH" | "YEAR"): Promise<string> {
  const plan = await paypalRequest<{ id: string }>("/v1/billing/plans", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      name,
      billing_cycles: [
        {
          frequency: { interval_unit: interval, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: price, currency_code: "USD" } },
        },
      ],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
    }),
  });
  return plan.id;
}

export async function GET(req: NextRequest) {
  const expected = process.env.PAYPAL_SETUP_TOKEN;
  const provided = req.nextUrl.searchParams.get("token");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const spec of SPECS) {
    try {
      const productId = await createProduct(spec.name, spec.description);
      results[spec.key] = await createPlan(productId, spec.name, spec.price, spec.interval);
    } catch (error) {
      errors[spec.key] = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return NextResponse.json({
    env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    railwayVariablesToSet: {
      PAYPAL_PLAN_BASIC: results.BASIC,
      PAYPAL_PLAN_STANDARD: results.STANDARD,
      PAYPAL_PLAN_PREMIUM: results.PREMIUM,
      PAYPAL_PLAN_ELITE: results.ELITE,
      PAYPAL_PLAN_RESUME_STUDIO: results.RESUME_STUDIO,
      PAYPAL_PLAN_INTERVIEW_AI: results.INTERVIEW_AI,
    },
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
