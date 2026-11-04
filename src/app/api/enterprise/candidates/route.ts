import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { searchCandidates } from "@/lib/enterprise/candidates";
import { apiCatch, apiOk } from "@/lib/api-response";

const num = (v: string | null) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const str = (v: string | null) => v?.trim().slice(0, 100) || undefined;

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRecruiter();
    const p = req.nextUrl.searchParams;
    return apiOk(
      await searchCandidates(ctx, {
        q: str(p.get("q")),
        location: str(p.get("location")),
        maxSalary: num(p.get("maxSalary")),
        minYears: num(p.get("minYears")),
        maxYears: num(p.get("maxYears")),
        skills: p.get("skills")?.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
        industry: str(p.get("industry")),
        education: str(p.get("education")),
        employer: str(p.get("employer")),
        careerLevel: str(p.get("careerLevel")),
        jobId: str(p.get("jobId")),
        page: num(p.get("page")),
      })
    );
  } catch (error) {
    return apiCatch(error);
  }
}
