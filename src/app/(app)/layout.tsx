import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isCareersPublisher } from "@/lib/careers/service";
import { allowedRolesFor } from "@/lib/auth/multi-role";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { IdleLogoutGuard } from "@/components/auth/idle-logout-guard";
import { MessengerWidget } from "@/components/messaging/messenger-widget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [careersPublisher, base] = await Promise.all([
      isCareersPublisher(user.id),
      prisma.user.findUnique({ where: { id: user.id }, select: { id: true, role: true } }),
    ]);
    const viewRoles = base ? await allowedRolesFor(base) : [];

  return (
    <div className="flex min-h-screen bg-background">
      <IdleLogoutGuard />
      <Sidebar role={user.role} careersPublisher={careersPublisher} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} careersPublisher={careersPublisher} viewRoles={viewRoles} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
      {user.role === "CANDIDATE" && <MessengerWidget />}
    </div>
  );
}
