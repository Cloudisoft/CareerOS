import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import type { AccountStatus, UserRole } from "@prisma/client";

export class AdminError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function getPlatformStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersByRole,
    usersByStatus,
    activeSubscriptionsByPlan,
    companyCount,
    openJobCount,
    applicationCount,
    applicationsBySource,
    aiUsageLast7Days,
    newUsersLast7Days,
    interviewSessionCount,
    connectionCount,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.subscription.groupBy({ by: ["plan"], where: { status: { in: ["ACTIVE", "TRIALING"] } }, _count: { _all: true } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.job.count({ where: { status: "OPEN", deletedAt: null } }),
    prisma.application.count(),
    prisma.application.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.aiUsage.groupBy({ by: ["feature"], where: { createdAt: { gte: sevenDaysAgo } }, _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.interviewSession.count(),
    prisma.connection.count({ where: { status: "ACCEPTED" } }),
  ]);

  return {
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
    usersByStatus: usersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    activeSubscriptionsByPlan: activeSubscriptionsByPlan.map((r) => ({ plan: r.plan, count: r._count._all })),
    companyCount,
    openJobCount,
    applicationCount,
    applicationsBySource: applicationsBySource.map((r) => ({ source: r.source, count: r._count._all })),
    aiUsageLast7Days: aiUsageLast7Days.map((r) => ({ feature: r.feature, count: r._count._all })),
    newUsersLast7Days,
    interviewSessionCount,
    connectionCount,
  };
}

export async function listUsers(filters: { q?: string; role?: UserRole; status?: AccountStatus }, page: number) {
  const pageSize = 20;
  const where = {
    ...(filters.q
      ? {
          OR: [
            { email: { contains: filters.q, mode: "insensitive" as const } },
            { firstName: { contains: filters.q, mode: "insensitive" as const } },
            { lastName: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function setUserStatus(adminUserId: string, targetUserId: string, status: AccountStatus, ipAddress?: string) {
  if (adminUserId === targetUserId) {
    throw new AdminError("You can't change your own account status.", "INVALID_TARGET");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { status: true } });
  if (!target) throw new AdminError("This user could not be found.", "NOT_FOUND");

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true },
  });

  await writeAuditLog({
    userId: adminUserId,
    action: "USER_STATUS_CHANGED",
    targetType: "User",
    targetId: targetUserId,
    metadata: { from: target.status, to: status },
    ipAddress,
  });

  return updated;
}
