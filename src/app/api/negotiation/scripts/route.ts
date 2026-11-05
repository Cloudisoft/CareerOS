import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listScripts, generateScript, computeSalaryGap, NEGOTIATION_SCENARIOS } from "@/lib/negotiation/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const generateSchema = z.object({
  scenario: z.enum(NEGOTIATION_SCENARIOS),
  jobId: z.string().trim().min(1).optional(),
  offeredSalary: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(10).optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const scripts = await listScripts(profile.id);
    return apiOk({ scripts });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "interviewAi");
    const input = generateSchema.parse(await req.json());
    const [script, gap] = await Promise.all([
      generateScript(user.id, profile.id, input),
      computeSalaryGap(profile.id, input.jobId, input.offeredSalary),
    ]);
    return apiOk({ script, gap });
  } catch (error) {
    return apiCatch(error);
  }
}
