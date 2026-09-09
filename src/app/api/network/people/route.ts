import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { searchPeople } from "@/lib/network/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireCandidate();
    const query = req.nextUrl.searchParams.get("q") ?? undefined;
    const people = await searchPeople(user.id, query);
    return apiOk({ people });
  } catch (error) {
    return apiCatch(error);
  }
}
