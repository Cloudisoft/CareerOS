"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSalaryRange } from "@/lib/utils";

interface JobRow {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  createdAt: string;
  _count: { applications: number };
}

const STATUS_VARIANT: Record<string, "default" | "outline" | "brand"> = {
  OPEN: "brand",
  DRAFT: "outline",
  CLOSED: "outline",
  ARCHIVED: "outline",
};

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsCompany, setNeedsCompany] = useState(false);

  useEffect(() => {
    fetch("/api/employer/jobs")
      .then(async (r) => {
        const json = await r.json();
        if (r.status === 409) {
          setNeedsCompany(true);
          return;
        }
        setJobs(json.data?.jobs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (needsCompany) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Set up your company profile before posting jobs.</p>
          <Button asChild className="mt-4">
            <Link href="/employer/company">Set up your company</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
        <Button asChild>
          <Link href="/employer/jobs/new">
            <Plus className="h-4 w-4" /> Post a job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            You haven't posted any jobs yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/employer/jobs/${job.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{job.title}</p>
                      <Badge variant={STATUS_VARIANT[job.status] ?? "outline"}>{job.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.location ?? "Remote"} · {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {job._count.applications}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
