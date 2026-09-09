import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getMessages, sendMessage } from "@/lib/messaging/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ content: z.string().trim().min(1).max(4000) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const messages = await getMessages(user.id, params.id);
    return apiOk({ messages });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { content } = schema.parse(await req.json());
    const message = await sendMessage(user.id, params.id, content);
    return apiOk({ message });
  } catch (error) {
    return apiCatch(error);
  }
}
