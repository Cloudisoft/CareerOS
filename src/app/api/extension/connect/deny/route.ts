import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { denyConnectRequest } from "@/lib/extension/service";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ state: z.string().trim().min(16).max(200) });

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { state } = schema.parse(await req.json());
    await denyConnectRequest(state);
    return apiOk({ ok: true });
  } catch (error) {
    return apiCatch(error);
  }
}
