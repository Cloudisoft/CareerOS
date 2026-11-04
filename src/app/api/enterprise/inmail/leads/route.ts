import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { searchLeads } from "@/lib/enterprise/outreach";
import { apiCatch, apiOk } from "@/lib/api-response";

const str = (v: string | null) => v?.trim().slice(0, 100) || undefined;

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const p = req.nextUrl.searchParams;
    const type = p.get("type");
    const minYears = p.get("minYears");
    return apiOk(
      await searchLeads(ctx, {
        q: str(p.get("q")),
        title: str(p.get("title")),
        company: str(p.get("company")),
        location: str(p.get("location")),
        industry: str(p.get("industry")),
        minYears: minYears && !Number.isNaN(Number(minYears)) ? Number(minYears) : undefined,
        type: type === "company" || type === "candidate" ? type : "all",
        page: Number(p.get("page")) || 1,
      })
    );
  } catch (error) {
    return apiCatch(error);
  }
}
