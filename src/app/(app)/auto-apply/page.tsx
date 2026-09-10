"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Laptop, CheckCircle2, XCircle, SkipForward, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UpgradeRequired } from "@/components/billing/upgrade-required";

interface Settings {
  minMatchScore: number;
  monthlyLimit: number;
  pacingSeconds: number;
  concurrency: number;
  autoSubmit: boolean;
}

interface Run {
  id: string;
  runId: string;
  status: "running" | "finished";
  queued: number;
  submitted: number;
  assisted: number;
  skipped: number;
  failed: number;
  lastError: string | null;
  updatedAt: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  appliedAt: string;
  matchScoreAtApply: number | null;
  job: { title: string; company: { name: string } };
}

interface DeviceSession {
  id: string;
  deviceLabel: string | null;
  lastSeenAt: string;
}

export default function AutoApplyPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [maxMonthlyLimit, setMaxMonthlyLimit] = useState<number | null>(0);
  const [runs, setRuns] = useState<Run[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function loadAll() {
    const billingRes = await fetch("/api/billing/status");
    const billingJson = await billingRes.json();
    const isEntitled = Boolean(billingJson.data?.entitlements?.autoApply);
    setEntitled(isEntitled);
    if (!isEntitled) {
      setLoading(false);
      return;
    }

    const [settingsRes, runsRes, appsRes, devicesRes] = await Promise.all([
      fetch("/api/auto-apply/settings"),
      fetch("/api/auto-apply/runs"),
      fetch("/api/applications?source=EXTENSION&limit=10"),
      fetch("/api/extension/sessions"),
    ]);
    const settingsJson = await settingsRes.json();
    const runsJson = await runsRes.json();
    const appsJson = await appsRes.json();
    const devicesJson = await devicesRes.json();

    setSettings(settingsJson.data?.settings ?? null);
    setMaxMonthlyLimit(settingsJson.data?.maxMonthlyLimit ?? 0);
    setRuns(runsJson.data?.runs ?? []);
    setApplications(appsJson.data?.applications ?? []);
    setDevices(devicesJson.data?.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/auto-apply/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok) {
      setSettings(json.data.settings);
      setSavedAt(Date.now());
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!entitled) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Auto Apply</h1>
        <UpgradeRequired feature="Auto Apply" />
      </div>
    );
  }

  const latestRun = runs[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Auto Apply</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control Center for the Career OS browser extension's automation engine.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Browser extension</CardTitle>
            <CardDescription>
              {devices.length > 0
                ? `${devices.length} browser${devices.length === 1 ? "" : "s"} paired.`
                : "No browser paired yet — Auto Apply runs from the extension, not this page."}
            </CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href="/settings/devices">
              <Laptop className="h-4 w-4" /> Manage devices
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {latestRun && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Latest run</CardTitle>
              <Badge variant={latestRun.status === "running" ? "brand" : "outline"}>{latestRun.status}</Badge>
            </div>
            <CardDescription>Updated {new Date(latestRun.updatedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 text-center text-sm">
              <div>
                <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 font-semibold text-foreground">{latestRun.queued}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
              <div>
                <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                <p className="mt-1 font-semibold text-foreground">{latestRun.submitted}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
              <div>
                <Send className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 font-semibold text-foreground">{latestRun.assisted}</p>
                <p className="text-xs text-muted-foreground">Assisted</p>
              </div>
              <div>
                <SkipForward className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 font-semibold text-foreground">{latestRun.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div>
                <XCircle className="mx-auto h-4 w-4 text-destructive" />
                <p className="mt-1 font-semibold text-foreground">{latestRun.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
            {latestRun.lastError && (
              <p className="mt-3 text-sm text-destructive">{latestRun.lastError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>Synced to the extension the next time it runs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="minMatchScore">Minimum match score</Label>
                <Input
                  id="minMatchScore"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.minMatchScore}
                  onChange={(e) => setSettings({ ...settings, minMatchScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyLimit">
                  Monthly application limit (max {maxMonthlyLimit == null ? "Unlimited" : maxMonthlyLimit} on your plan)
                </Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  min={0}
                  max={maxMonthlyLimit ?? undefined}
                  value={settings.monthlyLimit}
                  onChange={(e) => setSettings({ ...settings, monthlyLimit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pacingSeconds">Pacing between applications (seconds)</Label>
                <Input
                  id="pacingSeconds"
                  type="number"
                  min={10}
                  max={600}
                  value={settings.pacingSeconds}
                  onChange={(e) => setSettings({ ...settings, pacingSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="concurrency">Concurrent tabs</Label>
                <Input
                  id="concurrency"
                  type="number"
                  min={1}
                  max={3}
                  value={settings.concurrency}
                  onChange={(e) => setSettings({ ...settings, concurrency: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="autoSubmit"
                checked={settings.autoSubmit}
                onCheckedChange={(checked) => setSettings({ ...settings, autoSubmit: checked === true })}
              />
              <Label htmlFor="autoSubmit" className="cursor-pointer">
                Allow fully-automated submission where the platform permits it (otherwise the extension fills the
                form and leaves the final submit to you)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={saveSettings} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save settings
              </Button>
              {savedAt && Date.now() - savedAt < 4000 && <p className="text-sm text-success">Saved.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Auto Apply activity</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applications submitted by the extension yet. Pair a browser and start a run to see activity here.
          </p>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.job.title} @ {a.job.company.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.appliedAt).toLocaleString()}
                      {a.matchScoreAtApply != null ? ` · matched ${a.matchScoreAtApply}%` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
