import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createPlanCheckoutSession } from "@/lib/stripe/checkout";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ plan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ELITE"]) });

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { plan } = schema.parse(await req.json());
    const url = await createPlanCheckoutSession(user, plan);
    return apiOk({ url });
  } catch (error) {
    return apiCatch(error);
  }
}
