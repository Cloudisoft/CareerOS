import { getSessionUser } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listConversations, createConversation } from "@/lib/ai/job-gpt/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    const entitlements = await requireEntitlement(user.id, "jobGpt");

    // "Basic AI Career Assistant" (no Career Memory) only ever sees its one active thread.
    const conversations = await listConversations(user.id, entitlements.careerMemory ? undefined : 1);
    return apiOk({ conversations });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    const entitlements = await requireEntitlement(user.id, "jobGpt");

    if (!entitlements.careerMemory) {
      const existing = await listConversations(user.id, 1);
      if (existing.length > 0) {
        return apiError(
          "Basic AI Career Assistant keeps one active conversation. Upgrade to Basic for Career Memory and unlimited threads.",
          402,
          "UPGRADE_REQUIRED"
        );
      }
    }

    const conversation = await createConversation(user.id);
    return apiOk({ conversation });
  } catch (error) {
    return apiCatch(error);
  }
}
