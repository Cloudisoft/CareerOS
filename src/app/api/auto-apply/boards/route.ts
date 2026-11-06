import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { getEntitlements } from "@/lib/billing/entitlements";
import { AutoApplyError, setBoardsAddon } from "@/lib/autoapply/service";
import { writeAuditLog } from "@/lib/audit/log";
import { ipFromRequest } from "@/lib/rate-limit";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ enabled: z.boolean(), acknowledge: z.boolean().optional() });

/** Turns the LinkedIn & Indeed add-on on or off (paid plans; the warning is acknowledged once). */
export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    const input = schema.parse(await req.json());
    const entitlements = await getEntitlements(user.id);
    const settings = await setBoardsAddon(profile.id, input, entitlements);
    await writeAuditLog({
      userId: user.id,
      action: input.enabled ? "autoapply.boards_addon.enabled" : "autoapply.boards_addon.disabled",
      metadata: { acknowledged: Boolean(input.acknowledge) },
      ipAddress: ipFromRequest(req),
    });
    return apiOk({ settings });
  } catch (error) {
    if (error instanceof AutoApplyError) return apiError(error.message, error.code === "UPGRADE_REQUIRED" ? 402 : 409, error.code);
    return apiCatch(error);
  }
}
