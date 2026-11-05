import { getSessionUser } from "@/lib/auth/session";
import { isCareersPublisher } from "@/lib/careers/service";
import { allowedRolesFor } from "@/lib/auth/multi-role";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { IdleLogoutGuard } from "@/components/auth/idle-logout-guard";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

/**
 * The job marketplace is browsable without an account (only applying/saving
 * requires one), so this layout can't simply redirect like (app)'s does.
 * Signed-in users get the same app shell as the rest of the product;
 * everyone else gets the marketing shell.
 */
export default async function JobsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (user) {
    const [careersPublisher, base] = await Promise.all([
      isCareersPublisher(user.id),
      prisma.user.findUnique({ where: { id: user.id }, select: { id: true, role: true } }),
    ]);
    const viewRoles = base ? await allowedRolesFor(base) : [];
    return (
      <div className="flex min-h-screen bg-background">
        <IdleLogoutGuard />
        <Sidebar role={user.role} careersPublisher={careersPublisher} viewRoles={viewRoles} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} careersPublisher={careersPublisher} viewRoles={viewRoles} />
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
