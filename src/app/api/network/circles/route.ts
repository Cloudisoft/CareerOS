import { requireCandidate } from "@/lib/auth/guards";
import { listCircles } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user } = await requireCandidate();
    const circles = await listCircles(user.id);
    return apiOk({ circles });
  } catch (error) {
    return apiCatch(error);
  }
}
