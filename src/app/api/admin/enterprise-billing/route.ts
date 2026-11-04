import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { enterprisePlanIds, setupEnterprisePlans } from "@/lib/enterprise/billing";
import { isPayPalConfigured } from "@/lib/paypal/client";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({
      configured: isPayPalConfigured(),
      env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
      webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
      plans: await enterprisePlanIds(),
    });
  } catch (error) {
    return apiCatch(error);
  }
}

/** Creates the PayPal product + 4 Enterprise plans (skips any that exist). */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const result = await setupEnterprisePlans();
    await writeAuditLog({ userId: user.id, action: "admin.enterprise.paypal_plans_created", metadata: { env: result.env, created: result.created }, ipAddress: ipFromRequest(req) });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
