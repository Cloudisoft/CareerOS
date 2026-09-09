import { getSessionUser } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listConversations, createConversation } from "@/lib/ai/job-gpt/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    await requireEntitlement(user.id, "jobGpt");

    const conversations = await listConversations(user.id);
    return apiOk({ conversations });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    await requireEntitlement(user.id, "jobGpt");

    const conversation = await createConversation(user.id);
    return apiOk({ conversation });
  } catch (error) {
    return apiCatch(error);
  }
}
