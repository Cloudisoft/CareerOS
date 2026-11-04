import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { searchAccounts } from "@/lib/enterprise/outreach";
import { apiCatch, apiOk } from "@/lib/api-response";

const str = (v: string | null) => v?.trim().slice(0, 100) || undefined;

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const p = req.nextUrl.searchParams;
    return apiOk({ accounts: await searchAccounts(ctx, str(p.get("q")), str(p.get("industry")), str(p.get("location"))) });
  } catch (error) {
    return apiCatch(error);
  }
}
