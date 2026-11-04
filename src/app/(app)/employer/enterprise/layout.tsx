import { EnterpriseShell } from "@/components/enterprise/shared";

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <EnterpriseShell>{children}</EnterpriseShell>;
}
