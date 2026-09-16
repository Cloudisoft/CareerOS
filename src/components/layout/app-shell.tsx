"use client";

import { useState } from "react";
import type { User } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MessengerWidget } from "@/components/messaging/messenger-widget";
import { IdleLogoutGuard } from "@/components/auth/idle-logout-guard";

interface AppShellProps {
  user: User;
  showMessenger?: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, showMessenger = false, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <IdleLogoutGuard />
      <Sidebar role={user.role} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Topbar user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      {showMessenger && user.role === "CANDIDATE" && <MessengerWidget />}
    </div>
  );
}
