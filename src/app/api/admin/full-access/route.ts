import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { grantFullAccess, revokeFullAccess, listFullAccess } from "@/lib/admin/full-access";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    await requirePlatformAdmin();
    return apiOk({ users: await listFullAccess() });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const input = z.object({ email: z.string().trim().email(), companyName: z.string().trim().max(120).optional() }).parse(await req.json());
    return apiOk(await grantFullAccess(user.id, input));
  } catch (error) {
    return apiCatch(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { userId } = z.object({ userId: z.string().min(1) }).parse(await req.json());
    await revokeFullAccess(user.id, userId);
    return apiOk({ revoked: true });
  } catch (error) {
    return apiCatch(error);
  }
}
