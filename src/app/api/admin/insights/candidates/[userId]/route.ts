import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { candidateActivity } from "@/lib/admin/insights";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requirePlatformAdmin();
    const data = await candidateActivity(params.userId);
    if (!data) return apiError("This user could not be found.", 404, "NOT_FOUND");
    await writeAuditLog({ userId: user.id, action: "admin.insights.user_viewed", targetType: "user", targetId: params.userId });
    return apiOk(data);
  } catch (error) {
    return apiCatch(error);
  }
}
