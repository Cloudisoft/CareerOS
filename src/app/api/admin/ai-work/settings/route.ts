import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { setReferralUrl } from "@/lib/ai-work/service";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Sets the micro1 referral link used by every Apply button that has no role-specific link. */
export async function PUT(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { referralUrl } = z.object({ referralUrl: z.string().trim().max(1000).nullable() }).parse(await req.json());
    const saved = await setReferralUrl(referralUrl || null);
    await writeAuditLog({ userId: user.id, action: "admin.aiwork.referral", metadata: { set: Boolean(saved) } });
    return apiOk({ referralUrl: saved });
  } catch (error) {
    return apiCatch(error);
  }
}
