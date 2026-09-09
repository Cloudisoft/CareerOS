import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { Logo } from "@/components/brand/logo";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "CANDIDATE") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </header>
      <main className="px-6 py-12">{children}</main>
    </div>
  );
}
