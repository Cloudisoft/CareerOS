"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LayoutList, Kanban as KanbanIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((json) => setApplications(json.data?.applications ?? []))
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
      ) : (
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
      )}
    </div>
  );
}
