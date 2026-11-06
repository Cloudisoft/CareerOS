import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { searchAccounts } from "@/lib/admin/feature-access";
import { apiCatch, apiOk } from "@/lib/api-response";

/** Accounts by name or email, for picking who to give access to. */
export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
    return apiOk({ accounts: await searchAccounts(q) });
  } catch (error) {
    return apiCatch(error);
  }
}
