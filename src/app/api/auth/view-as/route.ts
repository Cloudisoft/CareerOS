import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { allowedRolesFor } from "@/lib/auth/multi-role";
import { VIEW_AS_COOKIE } from "@/lib/auth/constants";
import { writeAuditLog } from "@/lib/audit/log";
import { apiCatch, apiError, apiOk } from "@/lib/api-response";

const schema = z.object({ role: z.enum(["CANDIDATE", "EMPLOYER", "PLATFORM_ADMIN"]) });

/** Switches the area of the app a full-access account is using. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Not authenticated", 401, "UNAUTHENTICATED");
    const base = await prisma.user.findUniqueOrThrow({ where: { id: session.id }, select: { id: true, role: true } });
    const { role } = schema.parse(await req.json());
    const allowed = await allowedRolesFor(base);
    if (!allowed.includes(role)) return apiError("Your account can't switch to that view.", 403, "FORBIDDEN");

    const store = await cookies();
    if (role === base.role || (role === "EMPLOYER" && base.role === "COMPANY_ADMIN")) store.delete(VIEW_AS_COOKIE);
    else {
      store.set(VIEW_AS_COOKIE, role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    await writeAuditLog({ userId: base.id, action: "auth.view_switched", metadata: { to: role } });
    return apiOk({ role, home: role === "PLATFORM_ADMIN" ? "/admin" : role === "EMPLOYER" ? "/employer/enterprise" : "/dashboard" });
  } catch (error) {
    return apiCatch(error);
  }
}
