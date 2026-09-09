import "server-only";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCandidateProfile } from "@/lib/profile/service";

export class UnauthenticatedError extends Error {
  code = "UNAUTHENTICATED";
}
export class ForbiddenRoleError extends Error {
  code = "FORBIDDEN";
}

export async function requireCandidate() {
  const user = await getSessionUser();
  if (!user) throw new UnauthenticatedError("Not authenticated");
  if (user.role !== "CANDIDATE") throw new ForbiddenRoleError("This action requires a candidate account");

  const profile = await getOrCreateCandidateProfile(user.id);
  return { user, profile };
}
