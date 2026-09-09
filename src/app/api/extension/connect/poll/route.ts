import { NextRequest } from "next/server";
import { z } from "zod";
import { pollConnectRequest } from "@/lib/extension/service";
import { extCatch, extOk } from "@/lib/extension/response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

const schema = z.object({ state: z.string().trim().min(16).max(200) });

export async function POST(req: NextRequest) {
  const limit = rateLimit(`ext-poll:${ipFromRequest(req)}`, 120, 5 * 60 * 1000);
  if (!limit.allowed) {
    return extCatch({ code: "RATE_LIMITED", message: "Too many requests." });
  }

  try {
    const { state } = schema.parse(await req.json());
    const result = await pollConnectRequest(state);
    return extOk(result);
  } catch (error) {
    return extCatch(error);
  }
}
