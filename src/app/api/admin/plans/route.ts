import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { grantPlan, grantPlanSchema, listGrants, revokePlan } from "@/lib/admin/plans";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({ grants: await listGrants() });
  } catch (error) {
    return apiCatch(error);
  }
}

/** Give an account a job seeker or company plan for 1, 3, 6 or 12 months. No charge. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    return apiOk(await grantPlan(user.id, grantPlanSchema.parse(await req.json())));
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const input = z
      .discriminatedUnion("kind", [z.object({ kind: z.literal("CANDIDATE"), userId: z.string().min(1) }), z.object({ kind: z.literal("ENTERPRISE"), companyId: z.string().min(1) })])
      .parse(await req.json());
    await revokePlan(user.id, input);
    return apiOk({ revoked: true });
  } catch (error) {
    return apiCatch(error);
  }
}
