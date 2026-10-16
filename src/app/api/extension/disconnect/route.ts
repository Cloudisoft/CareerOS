import { NextRequest } from "next/server";
import { revokeExtensionToken } from "@/lib/extension/service";
import { extCatch, extOk } from "@/lib/extension/response";

/** The extension's "Disconnect": end this browser's session on the server, not just locally. */
export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (token) await revokeExtensionToken(token);
    return extOk({ ok: true });
  } catch (error) {
    return extCatch(error);
  }
}
