import { requireCandidate } from "@/lib/auth/guards";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { getCourse } from "@/lib/learning/courses";
import { apiCatch, apiOk } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const { user, profile } = await requireCandidate();
    await requireEntitlement(user.id, "learning");
    const course = await getCourse(profile.id, params.slug);
    return apiOk({ course });
  } catch (error) {
    return apiCatch(error);
  }
}
