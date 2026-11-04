import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { enterpriseActivity } from "@/lib/admin/insights";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { companyId: string } }) {
  try {
    const { user } = await requirePlatformAdmin();
    const data = await enterpriseActivity(params.companyId);
    if (!data) return apiError("This company could not be found.", 404, "NOT_FOUND");
    await writeAuditLog({ userId: user.id, action: "admin.insights.company_viewed", targetType: "company", targetId: params.companyId });
    return apiOk(data);
  } catch (error) {
    return apiCatch(error);
  }
}
