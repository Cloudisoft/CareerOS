import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listUsers } from "@/lib/admin/service";
import { apiCatch, apiOk } from "@/lib/api-response";
import type { AccountStatus, UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const result = await listUsers(
      {
        q: params.get("q")?.trim() || undefined,
        role: (params.get("role") as UserRole) || undefined,
        status: (params.get("status") as AccountStatus) || undefined,
      },
      page
    );
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
