import { NextRequest } from "next/server";
import { z } from "zod";
import { consumePairingCode } from "@/lib/extension/service";
import { extCatch, extOk } from "@/lib/extension/response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().length(6),
  label: z.string().trim().max(120).optional(),
  version: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(`ext-pair:${ipFromRequest(req)}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return extCatch({ code: "RATE_LIMITED", message: "Too many attempts. Please try again later." });
  }

  try {
    const { code, label } = schema.parse(await req.json());
    const result = await consumePairingCode(code, label);
    return extOk(result);
  } catch (error) {
    return extCatch(error);
  }
}
