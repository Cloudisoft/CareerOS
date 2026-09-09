import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listProgress, startResource } from "@/lib/learning/service";
import { apiCatch, apiOk } from "@/lib/api-response";

const schema = z.object({ resourceId: z.string().min(1) });

export async function GET() {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const progress = await listProgress(profile.id);
    return apiOk({ progress });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const { resourceId } = schema.parse(await req.json());
    const progress = await startResource(profile.id, resourceId);
    return apiOk({ progress });
  } catch (error) {
    return apiCatch(error);
  }
}
