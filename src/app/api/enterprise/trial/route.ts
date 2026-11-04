import { NextRequest } from "next/server";
import { requireRecruiter, startTrial } from "@/lib/enterprise/account";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const account = await startTrial(ctx);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.trial.started", targetType: "company", targetId: ctx.company.id, ipAddress: ipFromRequest(req) });
    return apiOk({ status: account.status, trialEndsAt: account.trialEndsAt });
  } catch (error) {
    return apiCatch(error);
  }
}
