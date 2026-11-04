import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { createFreeBoost, listBoosts } from "@/lib/enterprise/boosts";
import { boostCheckoutInfo } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";
import { boostSchema } from "@/lib/validations/enterprise";


export async function GET() {
  try {
    const ctx = await requireRecruiter();
    return apiOk({ boosts: await listBoosts(ctx), checkout: boostCheckoutInfo() });
  } catch (error) {
    return apiCatch(error);
  }
}

/** Uses a free boost from the plan's allowance. Paid boosts go through /boosts/orders. */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const json = await req.json();
    const requestId = z.string().uuid().parse(json.requestId);
    const input = boostSchema.parse(json);
    const payload = input.kind === "POST" ? { postId: input.postId } : { name: input.name, jobIds: input.jobIds };
    const boost = await createFreeBoost(ctx, input.kind, payload, requestId);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.boost.free", targetType: "boost", targetId: boost.id, metadata: { kind: input.kind } });
    return apiOk({ boost });
  } catch (error) {
    return apiCatch(error);
  }
}
