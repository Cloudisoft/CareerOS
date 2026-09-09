import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { getConversation, deleteConversation } from "@/lib/ai/job-gpt/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    await requireEntitlement(user.id, "jobGpt");

    const conversation = await getConversation(user.id, params.id);
    return apiOk({ conversation });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    await deleteConversation(user.id, params.id);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
