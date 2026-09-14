import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MessengerWidget } from "@/components/messaging/messenger-widget";
import { IdleLogoutGuard } from "@/components/auth/idle-logout-guard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <IdleLogoutGuard />
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      {user.role === "CANDIDATE" && <MessengerWidget />}
    </div>
  );
}
