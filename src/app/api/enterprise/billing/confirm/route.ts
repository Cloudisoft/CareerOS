import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { confirmSubscription } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ subscriptionID: z.string().min(3).max(64) });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const { subscriptionID } = schema.parse(await req.json());
    const account = await confirmSubscription(ctx, subscriptionID);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.subscription.confirmed", targetType: "company", targetId: ctx.company.id, metadata: { plan: account.plan, subscriptionID }, ipAddress: ipFromRequest(req) });
    return apiOk({ plan: account.plan, status: account.status });
  } catch (error) {
    return apiCatch(error);
  }
}
