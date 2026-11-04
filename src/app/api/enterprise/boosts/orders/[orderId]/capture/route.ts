import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { captureBoostOrder } from "@/lib/enterprise/billing";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const ctx = await requireRecruiter();
    const boost = await captureBoostOrder(ctx, params.orderId);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.boost.paid", targetType: "boost", targetId: boost.id, metadata: { paypalOrderId: params.orderId } });
    return apiOk({ boost });
  } catch (error) {
    return apiCatch(error);
  }
}
