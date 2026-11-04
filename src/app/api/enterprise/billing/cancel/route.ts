import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { cancelSubscription } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ reason: z.string().trim().max(120).optional() });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const { reason } = schema.parse(await req.json().catch(() => ({})));
    const account = await cancelSubscription(ctx, reason);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.subscription.cancelled", targetType: "company", targetId: ctx.company.id, ipAddress: ipFromRequest(req) });
    return apiOk({ status: account.status, accessUntil: account.currentPeriodEnd });
  } catch (error) {
    return apiCatch(error);
  }
}
