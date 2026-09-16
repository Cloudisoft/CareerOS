import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
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
    return <AppShell user={user}>{children}</AppShell>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar user={null} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
