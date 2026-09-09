"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Laptop } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeviceSession {
  id: string;
  deviceLabel: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/extension/sessions");
    const json = await res.json();
    setSessions(json.data?.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function generateCode() {
    setGenerating(true);
    const res = await fetch("/api/extension/pairing-codes", { method: "POST" });
    const json = await res.json();
    setGenerating(false);
    if (res.ok) {
      setCode(json.data.code);
      setExpiresAt(json.data.expiresAt);
    }
  }

  async function revoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/extension/sessions/${id}`, { method: "DELETE" });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Connected browsers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pair the Career OS Chrome extension with your account for Auto Apply.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Laptop className="h-4 w-4" /> Pair a browser
          </CardTitle>
          <CardDescription>
            Generate a one-time code, then enter it in the extension's Account tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {code ? (
            <div className="rounded-md border border-border bg-surface-raised p-4 text-center">
              <p className="text-3xl font-bold tracking-[0.3em] text-foreground">{code}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Expires {expiresAt ? new Date(expiresAt).toLocaleTimeString() : ""}
              </p>
            </div>
          ) : (
            <Button onClick={generateCode} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate pairing code
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paired browsers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No browsers paired yet.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.deviceLabel || "Unknown browser"}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {new Date(s.lastSeenAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => revoke(s.id)} aria-label="Revoke">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
