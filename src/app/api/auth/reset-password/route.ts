import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPasswordWithToken } from "@/lib/auth/service";
import { apiCatch, apiOk } from "@/lib/api-response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`reset-password:${ipFromRequest(req)}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiCatch({ code: "RATE_LIMITED", message: "Too many attempts. Please try again later." });
  }

  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);
    await resetPasswordWithToken(token, password);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
