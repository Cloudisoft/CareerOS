import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { listConversations, getOrCreateConversation } from "@/lib/messaging/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ userId: z.string().min(1) });

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const conversations = await listConversations(user.id);
    return apiOk({ conversations });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { userId } = schema.parse(await req.json());
    const conversation = await getOrCreateConversation(user.id, userId);
    return apiOk({ conversation });
  } catch (error) {
    return apiCatch(error);
  }
}
