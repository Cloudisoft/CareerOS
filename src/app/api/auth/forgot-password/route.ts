import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/lib/auth/service";
import { apiCatch, apiOk } from "@/lib/api-response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`forgot:${ipFromRequest(req)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiCatch({ code: "RATE_LIMITED", message: "Too many attempts. Please try again later." });
  }

  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    await requestPasswordReset(email);
    // Always return success so we never reveal whether an email is registered.
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
