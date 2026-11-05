import "server-only";
import { requestCache as cache } from "@/lib/request-cache";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * Accounts that can switch between the job seeker, employer and admin
 * areas of the app ("full access"), granted by a platform admin. Stored as
 * one AppSetting: { [userId]: UserRole[] }. Every other account keeps its
 * single role, and the account's own role is always one of its views.
 */
const KEY = "access.multiRole";
export const SWITCHABLE_ROLES: UserRole[] = ["CANDIDATE", "EMPLOYER", "PLATFORM_ADMIN"];

// One read per render (cache is a no-op outside React rendering, e.g. in route handlers).
const readMap = cache(readMapUncached);

async function readMapUncached(): Promise<Record<string, UserRole[]>> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, UserRole[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** The views this account may use. A single-role account gets just its own role. */
export async function allowedRolesFor(user: { id: string; role: UserRole }): Promise<UserRole[]> {
  const extra = (await readMap())[user.id] ?? [];
  const roles = new Set<UserRole>([user.role, ...extra.filter((r) => SWITCHABLE_ROLES.includes(r))]);
  // COMPANY_ADMIN is the employer view under another name.
  if (roles.has("COMPANY_ADMIN")) roles.add("EMPLOYER");
  return SWITCHABLE_ROLES.filter((r) => roles.has(r));
}

export async function setFullAccess(userId: string, enabled: boolean) {
  const map = await readMap();
  if (enabled) map[userId] = [...SWITCHABLE_ROLES];
  else delete map[userId];
  const value = JSON.stringify(map);
  await prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}

export async function fullAccessUserIds() {
  return Object.keys(await readMap());
}
