import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { authenticateUser } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { apiCatch, apiOk } from "@/lib/api-response";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`login:${ipFromRequest(req)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return apiCatch({ code: "RATE_LIMITED", message: "Too many attempts. Please try again in a few minutes." });
  }

  try {
    const body = await req.json();
    const input = loginSchema.parse(body);
    const user = await authenticateUser(input);
    await createSession(user.id);

    return apiOk({
      user: { id: user.id, firstName: user.firstName, role: user.role },
    });
  } catch (error) {
    return apiCatch(error);
  }
}
