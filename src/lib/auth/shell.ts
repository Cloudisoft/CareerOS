import "server-only";
import { requestCache as cache } from "@/lib/request-cache";
import { prisma } from "@/lib/prisma";
import { isCareersPublisher } from "@/lib/careers/service";
import { allowedRolesFor } from "@/lib/auth/multi-role";
import type { UserRole } from "@prisma/client";

/**
 * What the app shell (sidebar, top bar) needs for the signed-in user, read
 * once per render. The account's own role comes from the database because
 * the session user's role may be the view a full-access account switched to.
 */
export const getShellContext = cache(async (userId: string): Promise<{ careersPublisher: boolean; viewRoles: UserRole[] }> => {
  const [careersPublisher, base] = await Promise.all([
    isCareersPublisher(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
  ]);
  return { careersPublisher, viewRoles: base ? await allowedRolesFor(base) : [] };
});
