import { getSessionUser } from "@/lib/auth/session";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar user={user} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
