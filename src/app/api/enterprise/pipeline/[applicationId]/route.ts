import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRecruiter } from "@/lib/enterprise/account";
import { moveCandidate } from "@/lib/enterprise/engagement";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({
  status: z.enum(["APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { applicationId: string } }) {
  try {
    const ctx = await requireRecruiter();
    const { status, note } = schema.parse(await req.json());
    const updated = await moveCandidate(ctx, params.applicationId, status, note);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.candidate.stage", targetType: "application", targetId: params.applicationId, metadata: { status } });
    return apiOk({ status: updated.status });
  } catch (error) {
    return apiCatch(error);
  }
}
