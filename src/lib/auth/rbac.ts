import "server-only";
import type { User, UserRole } from "@prisma/client";

export class ForbiddenError extends Error {}

export function assertRole(user: User, allowed: UserRole[]) {
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Requires one of roles: ${allowed.join(", ")}`);
  }
}

export function isPlatformAdmin(user: User) {
  return user.role === "PLATFORM_ADMIN";
}

export function isEmployerSide(user: User) {
  return user.role === "EMPLOYER" || user.role === "COMPANY_ADMIN";
}

export function isCandidate(user: User) {
  return user.role === "CANDIDATE";
}
