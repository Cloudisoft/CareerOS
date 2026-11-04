import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { deleteAnnouncement } from "@/lib/enterprise/boosts";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireRecruiter();
    await deleteAnnouncement(ctx, params.id);
    await writeAuditLog({ userId: ctx.user.id, action: "enterprise.announcement.deleted", targetType: "post", targetId: params.id });
    return apiOk({ deleted: true });
  } catch (error) {
    return apiCatch(error);
  }
}
