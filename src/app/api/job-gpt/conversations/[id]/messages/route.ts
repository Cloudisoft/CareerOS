import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { sendMessage, countMonthlyUserMessages } from "@/lib/ai/job-gpt/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitForTier } from "@/lib/billing/priority";

const schema = z.object({ text: z.string().trim().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    const entitlements = await requireEntitlement(user.id, "jobGpt");

    if (entitlements.jobGptMonthlyMessageLimit !== Infinity) {
      const sentThisMonth = await countMonthlyUserMessages(user.id);
      if (sentThisMonth >= entitlements.jobGptMonthlyMessageLimit) {
        return apiError(
          "You've reached this month's Basic AI Career Assistant message limit. Upgrade to Basic for unlimited messages.",
          402,
          "UPGRADE_REQUIRED"
        );
      }
    }

    const { limit: perMinute } = rateLimitForTier(entitlements.aiPriorityTier);
    const limit = rateLimit(`job-gpt:${user.id}`, perMinute, 60 * 1000);
    if (!limit.allowed) return apiError("You're sending messages too quickly. Please slow down.", 429, "RATE_LIMITED");

    const { text } = schema.parse(await req.json());
    const message = await sendMessage(user.id, params.id, text, entitlements.executiveMode);
    return apiOk({ message });
  } catch (error) {
    return apiCatch(error);
  }
}
