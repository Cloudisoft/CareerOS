import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
