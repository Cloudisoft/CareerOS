import { NextRequest } from "next/server";
import { requireRecruiter } from "@/lib/enterprise/account";
import { candidatePackage } from "@/lib/enterprise/candidates";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireRecruiter();
    return apiOk(await candidatePackage(ctx, params.id));
  } catch (error) {
    return apiCatch(error);
  }
}
