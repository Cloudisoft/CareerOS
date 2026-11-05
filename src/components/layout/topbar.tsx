"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, LogOut, CreditCard, Laptop, User as UserIcon, Repeat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { UserRole } from "@prisma/client";

interface TopbarProps {
  user: { firstName: string; lastName: string; email: string; avatarUrl: string | null; role?: UserRole };
  careersPublisher?: boolean;
  /** Views a full-access account can switch between; one entry (or none) hides the switcher. */
  viewRoles?: UserRole[];
}

const VIEW_LABEL: Partial<Record<UserRole, string>> = {
  CANDIDATE: "Job seeker",
  EMPLOYER: "Recruiter",
  PLATFORM_ADMIN: "Platform admin",
};

export function Topbar({ user, careersPublisher, viewRoles = [] }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (!cancelled) setUnread(json.data?.unread ?? 0);
      } catch {
        // ignore transient failures; next poll will retry
      }
    }
    poll();
    const interval = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function switchView(role: UserRole) {
    const res = await fetch("/api/auth/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) window.location.href = json?.data?.home ?? "/dashboard";
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNav role={user.role} careersPublisher={careersPublisher} viewRoles={viewRoles} />
        <Logo />
      </div>
      {(user.role ?? "CANDIDATE") === "CANDIDATE" && !pathname.startsWith("/jobs") && (
        <form
          role="search"
          className="hidden max-w-md flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q")?.toString().trim();
            router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              placeholder="Search jobs, companies or skills"
              className="h-9 w-full rounded-full border border-border bg-surface-raised/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </form>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-primary" />
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
              <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing">
                <CreditCard className="h-4 w-4" /> Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/devices">
                <Laptop className="h-4 w-4" /> Connected browsers
              </Link>
            </DropdownMenuItem>
            {viewRoles.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Switch view</DropdownMenuLabel>
                {(["CANDIDATE", "EMPLOYER", "PLATFORM_ADMIN"] as UserRole[]).filter((r) => viewRoles.includes(r)).map((r) => {
                  const current = r === user.role || (r === "EMPLOYER" && user.role === "COMPANY_ADMIN");
                  return (
                    <DropdownMenuItem key={r} disabled={current} onSelect={() => switchView(r)}>
                      <Repeat className="h-4 w-4" /> {VIEW_LABEL[r]}
                      {current ? " (current)" : ""}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
