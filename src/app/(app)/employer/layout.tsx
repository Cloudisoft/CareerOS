import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "EMPLOYER" && user.role !== "COMPANY_ADMIN")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
