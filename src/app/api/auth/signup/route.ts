import { NextRequest } from "next/server";
import { signupSchema } from "@/lib/validations/auth";
import { signupUser } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { apiCatch, apiOk } from "@/lib/api-response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`signup:${ipFromRequest(req)}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiCatch({ code: "RATE_LIMITED", message: "Too many attempts. Please try again later." });
  }

  try {
    const body = await req.json();
    const input = signupSchema.parse(body);
    const user = await signupUser(input);
    await createSession(user.id);

    return apiOk({
      user: { id: user.id, firstName: user.firstName, role: user.role },
      needsOnboarding: user.role === "CANDIDATE",
    });
  } catch (error) {
    return apiCatch(error);
  }
}
