import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getEntitlements, serializeEntitlements } from "@/lib/billing/entitlements";
import { getOrCreateSettings, updateSettings } from "@/lib/autoapply/service";
import { updateAutoApplySettingsSchema } from "@/lib/validations/autoapply";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, profile } = await requireCandidate();
    const [settings, entitlements] = await Promise.all([
      getOrCreateSettings(profile.id),
      getEntitlements(user.id),
    ]);
    const { monthlyApplicationLimit } = serializeEntitlements(entitlements);
    return apiOk({ settings, maxMonthlyLimit: monthlyApplicationLimit });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    const entitlements = await getEntitlements(user.id);
    const input = updateAutoApplySettingsSchema.parse(await req.json());
    const settings = await updateSettings(profile.id, input, entitlements);
    return apiOk({ settings });
  } catch (error) {
    return apiCatch(error);
  }
}
