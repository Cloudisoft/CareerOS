"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Ban, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline"> = {
  ACTIVE: "success",
  SUSPENDED: "destructive",
  DEACTIVATED: "outline",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const json = await res.json();
    setUsers(json.data?.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleStatus(user: UserRow) {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUpdatingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setUpdatingId(null);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Users</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {users.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No users found.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {u.firstName} {u.lastName}
                      </p>
                      <Badge variant="outline">{u.role}</Badge>
                      <Badge variant={STATUS_VARIANT[u.status] ?? "outline"}>{u.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {u.status !== "DEACTIVATED" && (
                    <Button
                      size="sm"
                      variant={u.status === "ACTIVE" ? "outline" : "secondary"}
                      disabled={updatingId === u.id}
                      onClick={() => toggleStatus(u)}
                    >
                      {updatingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.status === "ACTIVE" ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
