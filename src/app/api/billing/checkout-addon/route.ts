import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createAddOnCheckoutSession } from "@/lib/stripe/checkout";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ addOn: z.enum(["RESUME_STUDIO", "INTERVIEW_AI"]) });

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return apiError("Not authenticated", 401, "UNAUTHENTICATED");

    const { addOn } = schema.parse(await req.json());
    const url = await createAddOnCheckoutSession(user, addOn);
    return apiOk({ url });
  } catch (error) {
    return apiCatch(error);
  }
}
