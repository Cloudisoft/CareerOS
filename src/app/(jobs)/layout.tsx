import { getSessionUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role={user.role} />
        <div className="flex flex-1 flex-col">
          <Topbar user={user} />
          <main className="flex-1 p-6">{children}</main>
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
