import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="bg-grid-pattern pointer-events-none fixed inset-0 opacity-[0.12]" />
      <div
        className="pointer-events-none fixed -left-32 top-0 h-96 w-96 animate-float rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(239,134,45,0.16), transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed -right-32 bottom-0 h-96 w-96 animate-float rounded-full blur-3xl"
        style={{ animationDelay: "3s", background: "radial-gradient(circle, rgba(223,76,44,0.14), transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo priority />
        </div>
        <div className="brand-glow rounded-lg">{children}</div>
      </div>
    </div>
  );
}
