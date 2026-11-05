import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { createAccount, createAccountSchema, resendInvite } from "@/lib/admin/plans";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Create a Career OS account and invite the person to set a password. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const input = createAccountSchema.parse(await req.json());
    return apiOk(await createAccount(user.id, input));
  } catch (error) {
    return apiCatch(error);
  }
}

/** Send a fresh set-password link. */
export async function PUT(req: NextRequest) {
  try {
    const { user } = await requirePlatformAdmin();
    const { email } = z.object({ email: z.string().trim().email() }).parse(await req.json());
    return apiOk(await resendInvite(user.id, email));
  } catch (error) {
    return apiCatch(error);
  }
}
