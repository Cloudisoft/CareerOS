import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getShellContext } from "@/lib/auth/shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { IdleLogoutGuard } from "@/components/auth/idle-logout-guard";
import { MessengerWidget } from "@/components/messaging/messenger-widget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { careersPublisher, viewRoles } = await getShellContext(user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <IdleLogoutGuard />
      <Sidebar role={user.role} careersPublisher={careersPublisher} viewRoles={viewRoles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} careersPublisher={careersPublisher} viewRoles={viewRoles} />
        <main className="min-w-0 flex-1 p-4 [--shell-pad:1rem] [--shell-top:3.5rem] sm:p-6 sm:[--shell-pad:1.5rem]">{children}</main>
      </div>
      {user.role === "CANDIDATE" && <MessengerWidget />}
    </div>
  );
}
