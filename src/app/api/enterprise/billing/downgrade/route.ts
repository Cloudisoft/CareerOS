import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { scheduleDowngrade } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ plan: z.enum(["STARTER", "PROFESSIONAL"]) });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const { plan } = schema.parse(await req.json());
    const returnUrl = `${req.nextUrl.origin}/employer/enterprise/billing?downgrade=1`;
    const result = await scheduleDowngrade(ctx, plan, returnUrl);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.subscription.downgrade_requested", targetType: "company", targetId: ctx.company.id, metadata: { plan } });
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
