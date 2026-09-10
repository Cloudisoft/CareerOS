import { NextRequest } from "next/server";
import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { setLessonComplete } from "@/lib/learning/courses";
import { setLessonCompleteSchema } from "@/lib/validations/learning";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const { completed } = setLessonCompleteSchema.parse(await req.json());
    await setLessonComplete(profile.id, params.lessonId, completed);
    return apiOk({ success: true });
  } catch (error) {
    return apiCatch(error);
  }
}
