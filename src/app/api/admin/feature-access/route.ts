import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { grantFeatureSchema, grantFeatures, listFeatureGrants, revokeFeature, revokeFeatureSchema } from "@/lib/admin/feature-access";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({ grants: await listFeatureGrants() });
  } catch (error) {
    return apiCatch(error);
  }
}

/** Give an account Interview AI and/or Learning Hub for 1, 3, 6 or 12 months. No charge. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    return apiOk(await grantFeatures(user.id, grantFeatureSchema.parse(await req.json())));
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    await revokeFeature(user.id, revokeFeatureSchema.parse(await req.json()));
    return apiOk({ revoked: true });
  } catch (error) {
    return apiCatch(error);
  }
}
