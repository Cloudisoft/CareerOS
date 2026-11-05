import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { aiWorkRoleSchema, createRole, getReferralUrl, listRoles } from "@/lib/ai-work/service";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const [roles, referralUrl] = await Promise.all([listRoles({ includeClosed: true }), getReferralUrl()]);
    return apiOk({ roles, referralUrl });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const input = aiWorkRoleSchema.parse(await req.json());
    const role = await createRole(input, user.id);
    await writeAuditLog({ userId: user.id, action: "admin.aiwork.create", targetType: "AiWorkRole", targetId: role.id, metadata: { title: role.title } });
    return apiOk({ role });
  } catch (error) {
    return apiCatch(error);
  }
}
