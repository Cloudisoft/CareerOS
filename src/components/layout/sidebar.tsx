"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { CANDIDATE_NAV, EMPLOYER_NAV, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: "CANDIDATE" | "EMPLOYER" | "COMPANY_ADMIN" | "PLATFORM_ADMIN";
}

export function Sidebar({ role = "CANDIDATE" }: SidebarProps) {
  const pathname = usePathname();
  const items: NavItem[] = role === "EMPLOYER" || role === "COMPANY_ADMIN" ? EMPLOYER_NAV : CANDIDATE_NAV;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href;
          if (!item.available) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground/50"
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-gradient text-white"
                  : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
