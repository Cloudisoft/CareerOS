import { NextRequest } from "next/server";
import { z } from "zod";
import { startConnectRequest } from "@/lib/extension/service";
import { extCatch, extOk } from "@/lib/extension/response";

const schema = z.object({
  state: z.string().trim().min(16).max(200),
  label: z.string().trim().max(120).optional(),
  version: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { state, label, version } = schema.parse(await req.json());
    await startConnectRequest(state, label, version);
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
