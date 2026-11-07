import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { companionAccess, type CompanionAccess } from "@/lib/companion/access";

/** A view-as cookie must never turn an employer into a candidate for downloads. */
export async function getCompanionDownloadAccess(): Promise<CompanionAccess> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return "login";
  // Read the canonical account role, not an admin/employer's view-as selection.
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
  if (!user || user.role !== "CANDIDATE") return "candidate-only";
  const { interviewAi } = await getEntitlements(sessionUser.id);
  return companionAccess(user.role, interviewAi === true);
}
