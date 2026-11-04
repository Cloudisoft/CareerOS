import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { grantComplimentaryPlan, revokeComplimentaryPlan, listComplimentary } from "@/lib/enterprise/complimentary";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({ accounts: await listComplimentary() });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const input = z
      .object({
        email: z.string().trim().email(),
        plan: z.enum(["STARTER", "PROFESSIONAL"]),
        convertToEmployer: z.boolean().optional(),
        companyName: z.string().trim().max(120).optional(),
      })
      .parse(await req.json());
    const result = await grantComplimentaryPlan(user.id, input);
    return apiOk({ company: result.company, email: result.user.email });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { companyId } = z.object({ companyId: z.string().min(1) }).parse(await req.json());
    await revokeComplimentaryPlan(user.id, companyId);
    return apiOk({ revoked: true });
  } catch (error) {
    return apiCatch(error);
  }
}
