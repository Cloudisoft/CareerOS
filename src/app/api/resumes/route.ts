import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { createResumeSchema } from "@/lib/validations/resume";
import { listResumes, createResume } from "@/lib/resume/service";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { profile } = await requireCandidate();
    const resumes = await listResumes(profile.id);
    return apiOk({ resumes });
  } catch (error) {
    return apiCatch(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireCandidate();
    const { name, fromProfile } = createResumeSchema.parse(await req.json());
    const resume = await createResume(profile.id, name, Boolean(fromProfile));
    return apiOk({ resume });
  } catch (error) {
    return apiCatch(error);
  }
}
