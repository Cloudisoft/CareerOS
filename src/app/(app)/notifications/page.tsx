"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Bell, UserPlus, MessageSquare, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICONS: Record<string, typeof Bell> = {
  CONNECTION_REQUEST: UserPlus,
  CONNECTION_ACCEPTED: UserPlus,
  MESSAGE: MessageSquare,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    const json = await res.json();
    setNotifications(json.data?.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAll}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">You're all caught up.</p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const body = (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4",
                    !n.readAt && "bg-surface-raised"
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className={cn("text-sm text-foreground", !n.readAt && "font-medium")}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.readAt && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        markOne(n.id);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
              return n.linkUrl ? (
                <Link key={n.id} href={n.linkUrl} onClick={() => !n.readAt && markOne(n.id)}>
                  {body}
                </Link>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
