import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { sendMessage } from "@/lib/ai/job-gpt/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ text: z.string().trim().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    await requireEntitlement(user.id, "jobGpt");

    const limit = rateLimit(`job-gpt:${user.id}`, 30, 60 * 1000);
    if (!limit.allowed) return apiError("You're sending messages too quickly. Please slow down.", 429, "RATE_LIMITED");

    const { text } = schema.parse(await req.json());
    const message = await sendMessage(user.id, params.id, text);
    return apiOk({ message });
  } catch (error) {
    return apiCatch(error);
  }
}
