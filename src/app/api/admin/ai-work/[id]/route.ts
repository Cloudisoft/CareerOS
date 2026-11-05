import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { aiWorkRoleSchema, deleteRole, updateRole } from "@/lib/ai-work/service";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

async function exists(id: string) {
  return Boolean(await prisma.aiWorkRole.findUnique({ where: { id }, select: { id: true } }));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requirePlatformAdmin();
    if (!(await exists(params.id))) return apiError("This role no longer exists.", 404, "NOT_FOUND");
    const role = await updateRole(params.id, aiWorkRoleSchema.parse(await req.json()));
    await writeAuditLog({ userId: user.id, action: "admin.aiwork.update", targetType: "AiWorkRole", targetId: role.id, metadata: { title: role.title, status: role.status } });
    return apiOk({ role });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requirePlatformAdmin();
    if (!(await exists(params.id))) return apiError("This role no longer exists.", 404, "NOT_FOUND");
    await deleteRole(params.id);
    await writeAuditLog({ userId: user.id, action: "admin.aiwork.delete", targetType: "AiWorkRole", targetId: params.id });
    return apiOk({ deleted: true });
  } catch (error) {
    return apiCatch(error);
  }
}
