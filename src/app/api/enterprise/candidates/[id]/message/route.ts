import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { messageCandidate } from "@/lib/enterprise/engagement";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireRecruiter();
    const { content } = schema.parse(await req.json());
    const result = await messageCandidate(ctx, params.id, content);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.candidate.messaged", targetType: "candidate_profile", targetId: params.id, metadata: { companyId: ctx.company.id } });
    return apiOk({ conversationId: result.conversationId });
  } catch (error) {
    return apiCatch(error);
  }
}
