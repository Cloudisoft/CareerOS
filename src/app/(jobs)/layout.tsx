import { getSessionUser } from "@/lib/auth/session";
import { getShellContext } from "@/lib/auth/shell";
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
    const { careersPublisher, viewRoles } = await getShellContext(user.id);
    return (
      <div className="flex min-h-screen bg-background">
        <IdleLogoutGuard />
        <Sidebar role={user.role} careersPublisher={careersPublisher} viewRoles={viewRoles} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} careersPublisher={careersPublisher} viewRoles={viewRoles} />
          <main className="min-w-0 flex-1 p-4 [--shell-pad:1rem] [--shell-top:3.5rem] sm:p-6 sm:[--shell-pad:1.5rem]">{children}</main>
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
