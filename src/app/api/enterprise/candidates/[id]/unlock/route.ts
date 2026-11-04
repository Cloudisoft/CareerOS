import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { unlockCandidate } from "@/lib/enterprise/candidates";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireRecruiter();
    const result = await unlockCandidate(ctx, params.id);
    if (result.charged) {
      await writeAuditLog({ userId: ctx.user.id, action: "enterprise.resume.unlocked", targetType: "candidate_profile", targetId: params.id, metadata: { companyId: ctx.company.id }, ipAddress: ipFromRequest(req) });
    }
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
