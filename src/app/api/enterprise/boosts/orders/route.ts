import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { createBoostOrder } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { rateLimit } from "@/lib/rate-limit";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";
import { boostSchema } from "@/lib/validations/enterprise";

/** Creates a PayPal order at the published price. The boost exists only after /capture confirms payment. */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    if (!rateLimit(`boost-order:${ctx.user.id}`, 20, 60 * 60 * 1000).allowed) {
      return apiError("Too many checkout attempts. Try again shortly.", 429, "RATE_LIMITED");
    }
    const input = boostSchema.parse(await req.json());
    const payload = input.kind === "POST" ? { postId: input.postId } : { name: input.name, jobIds: input.jobIds };
    const order = await createBoostOrder(ctx, input.kind, payload);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.boost.order_created", targetType: "paypal_order", targetId: order.orderId, metadata: { kind: input.kind, amountCents: order.amountCents } });
    return apiOk(order);
  } catch (error) {
    return apiCatch(error);
  }
}
