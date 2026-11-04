import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isCareersPublisher } from "@/lib/careers/service";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const careersPublisher = await isCareersPublisher(user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={user.role} careersPublisher={careersPublisher} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} careersPublisher={careersPublisher} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
