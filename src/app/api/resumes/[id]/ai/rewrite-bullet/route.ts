import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { getResume } from "@/lib/resume/service";
import { rewriteResumeBullet } from "@/lib/resume/ai";
import { rewriteBulletSchema } from "@/lib/validations/resume";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireCandidate();
    await getResume(profile.id, params.id); // ownership check
    const input = rewriteBulletSchema.parse(await req.json());
    const result = await rewriteResumeBullet(input);
    return apiOk(result);
  } catch (error) {
    return apiCatch(error);
  }
}
