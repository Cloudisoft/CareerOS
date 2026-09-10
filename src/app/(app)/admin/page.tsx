"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Building2, Briefcase, FileText, Bot, UserPlus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface SyncResult {
  query: string;
  fetched: number;
  created: number;
  updated: number;
  errors: string[];
}

function ExternalJobSyncCard() {
  const [queries, setQueries] = useState("software engineer, product manager");
  const [country, setCountry] = useState("us");
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/admin/jobs/sync-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: queries.split(",").map((q) => q.trim()).filter(Boolean),
          country,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Sync failed.");
      setResults(json.data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sync external job listings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">
          Pulls real listings from Adzuna and JSearch (whichever has API keys configured) and adds them to the
          marketplace as browsable, searchable jobs. Candidates apply on the original posting — Career OS isn&apos;t
          the employer of record for these.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
          <Input value={queries} onChange={(e) => setQueries(e.target.value)} placeholder="software engineer, product manager" />
          <Input value={country} onChange={(e) => setCountry(e.target.value.toLowerCase())} placeholder="us" maxLength={2} />
          <Button onClick={runSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {results && (
          <div className="space-y-1 text-sm">
            {results.map((r) => (
              <div key={r.query} className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                <span className="font-medium text-foreground">{r.query}:</span>
                <span>{r.fetched} fetched</span>
                <span>&middot; {r.created} new</span>
                <span>&middot; {r.updated} updated</span>
                {r.errors.map((err, i) => (
                  <span key={i} className="text-destructive">
                    {err}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Stats {
  usersByRole: { role: string; count: number }[];
  usersByStatus: { status: string; count: number }[];
  activeSubscriptionsByPlan: { plan: string; count: number }[];
  companyCount: number;
  openJobCount: number;
  applicationCount: number;
  applicationsBySource: { source: string; count: number }[];
  aiUsageLast7Days: { feature: string; count: number }[];
  newUsersLast7Days: number;
  interviewSessionCount: number;
  connectionCount: number;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json) => setStats(json.data?.stats ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Could not load platform stats.</p>;
  }

  const totalUsers = stats.usersByRole.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real, live counts across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={totalUsers} />
        <StatCard icon={UserPlus} label="New users (7 days)" value={stats.newUsersLast7Days} />
        <StatCard icon={Building2} label="Companies" value={stats.companyCount} />
        <StatCard icon={Briefcase} label="Open jobs" value={stats.openJobCount} />
        <StatCard icon={FileText} label="Applications" value={stats.applicationCount} />
        <StatCard icon={Bot} label="Interview sessions" value={stats.interviewSessionCount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by role</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.usersByRole}>
                <XAxis dataKey="role" tick={{ fontSize: 11 }} stroke="currentColor" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
                <Tooltip contentStyle={{ background: "#150B16", border: "1px solid #2A202B" }} />
                <Bar dataKey="count" fill="#EF862D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active subscriptions by plan</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-0">
            {stats.activeSubscriptionsByPlan.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No active subscriptions yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activeSubscriptionsByPlan}>
                  <XAxis dataKey="plan" tick={{ fontSize: 11 }} stroke="currentColor" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
                  <Tooltip contentStyle={{ background: "#150B16", border: "1px solid #2A202B" }} />
                  <Bar dataKey="count" fill="#DF4C2C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {stats.applicationsBySource.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.source}</span>
                <span className="font-medium text-foreground">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI usage (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {stats.aiUsageLast7Days.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI usage recorded in the last 7 days.</p>
            ) : (
              stats.aiUsageLast7Days.map((s) => (
                <div key={s.feature} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.feature}</span>
                  <span className="font-medium text-foreground">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ExternalJobSyncCard />
    </div>
  );
}
