"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LayoutList, Kanban as KanbanIcon, BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sourceLabel } from "@/lib/jobs/source-labels";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ApplicationItem {
  id: string;
  status: string;
  source: string;
  appliedAt: string;
  matchScoreAtApply: number | null;
  job: {
    id: string;
    title: string;
    location: string | null;
    workplaceType: string;
    company: { name: string; slug: string };
  };
}

const STAGES = ["SAVED", "APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];
const STAGE_LABELS: Record<string, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  VIEWED: "Viewed",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function statusVariant(status: string) {
  if (status === "OFFER") return "success" as const;
  if (status === "REJECTED" || status === "WITHDRAWN") return "destructive" as const;
  if (status === "INTERVIEW" || status === "SCREENING") return "brand" as const;
  return "default" as const;
}

interface Analytics {
  total: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  weeklyTrend: { weekStart: string; count: number }[];
  sinceApplications: number;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban" | "analytics">("list");

  useEffect(() => {
    Promise.all([
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/applications/analytics").then((r) => r.json()),
    ])
      .then(([appsJson, analyticsJson]) => {
        setApplications(appsJson.data?.applications ?? []);
        setAnalytics(analyticsJson.data?.analytics ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${applications.length} application${applications.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <a href="/api/applications/export" download>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
          <div className="flex gap-1 rounded-md bg-muted p-1">
            <button
              onClick={() => setView("list")}
              className={cn("rounded-md p-2", view === "list" ? "bg-surface-raised text-foreground" : "text-muted-foreground")}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("rounded-md p-2", view === "kanban" ? "bg-surface-raised text-foreground" : "text-muted-foreground")}
              aria-label="Kanban view"
            >
              <KanbanIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("analytics")}
              className={cn("rounded-md p-2", view === "analytics" ? "bg-surface-raised text-foreground" : "text-muted-foreground")}
              aria-label="Analytics view"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven't applied to any jobs yet.</p>
            <Link href="/jobs" className="mt-2 inline-block text-sm text-primary hover:underline">
              Browse jobs
            </Link>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <Link href={`/jobs/${app.job.id}`} className="font-medium text-foreground hover:underline">
                    {app.job.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {app.job.company.name}
                    {app.job.location ? ` · ${app.job.location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                    {app.matchScoreAtApply != null ? ` · ${app.matchScoreAtApply}% match at apply` : ""}
                  </p>
                </div>
                <Badge variant={statusVariant(app.status)}>{STAGE_LABELS[app.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = applications.filter((a) => a.status === stage);
            if (items.length === 0) return null;
            return (
              <div key={stage} className="w-64 shrink-0">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {STAGE_LABELS[stage]} ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-3">
                        <Link href={`/jobs/${app.job.id}`} className="text-sm font-medium text-foreground hover:underline">
                          {app.job.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{app.job.company.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AnalyticsView analytics={analytics} />
      )}
    </div>
  );
}

function AnalyticsView({ analytics }: { analytics: Analytics | null }) {
  if (!analytics || analytics.total === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No applications yet — analytics will show up once you've applied to a few jobs.
        </CardContent>
      </Card>
    );
  }

  const statusData = analytics.byStatus.map((s) => ({ status: STAGE_LABELS[s.status] ?? s.status, count: s.count }));
  const sourceData = analytics.bySource.map((s) => ({ source: sourceLabel(s.source), count: s.count }));
  const trendData = analytics.weeklyTrend.map((w) => ({
    week: new Date(w.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: w.count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold text-foreground">{analytics.total}</p>
            <p className="text-sm text-muted-foreground">Total applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold text-foreground">{analytics.sinceApplications}</p>
            <p className="text-sm text-muted-foreground">In the last 10 weeks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications per week</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="currentColor" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
              <Tooltip contentStyle={{ background: "#150B16", border: "1px solid #2A202B" }} />
              <Line type="monotone" dataKey="count" stroke="#EF862D" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="currentColor" interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
                <Tooltip contentStyle={{ background: "#150B16", border: "1px solid #2A202B" }} />
                <Bar dataKey="count" fill="#EF862D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By platform</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <XAxis dataKey="source" tick={{ fontSize: 10 }} stroke="currentColor" interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
                <Tooltip contentStyle={{ background: "#150B16", border: "1px solid #2A202B" }} />
                <Bar dataKey="count" fill="#DF4C2C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
