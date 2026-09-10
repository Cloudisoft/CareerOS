import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { listCourses } from "@/lib/learning/courses";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const courses = await listCourses(profile.id);
    return apiOk({ courses });
  } catch (error) {
    return apiCatch(error);
  }
}
