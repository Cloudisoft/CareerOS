import { NextRequest } from "next/server";
import { z } from "zod";
import { startConnectRequest } from "@/lib/extension/service";
import { extCatch, extError, extOk } from "@/lib/extension/response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

const schema = z.object({
  state: z.string().trim().min(16).max(200),
  label: z.string().trim().max(120).optional(),
  version: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`ext-connect-start:${ipFromRequest(req)}`, 20, 10 * 60 * 1000);
    if (!limit.allowed) return extError("Too many sign-in attempts. Please wait a few minutes.", 429);
    const { state, label, version } = schema.parse(await req.json());
    await startConnectRequest(state, label, version);
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
