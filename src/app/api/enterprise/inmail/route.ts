import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { sendInMail, listInMail } from "@/lib/enterprise/outreach";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  requestId: z.string().uuid(),
  recipientUserId: z.string().min(1),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
});

export async function GET() {
  try {
    const ctx = await requireRecruiter();
    return apiOk({ messages: await listInMail(ctx) });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const input = schema.parse(await req.json());
    const message = await sendInMail(ctx, input);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.inmail.sent", targetType: "user", targetId: input.recipientUserId, metadata: { outreachId: message.id, companyId: ctx.company.id }, ipAddress: ipFromRequest(req) });
    return apiOk({ id: message.id, status: message.status, conversationId: message.conversationId });
  } catch (error) {
    return apiCatch(error);
  }
}
