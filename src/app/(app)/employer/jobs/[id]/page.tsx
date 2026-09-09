"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, MapPin, DollarSign, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatSalaryRange, initials } from "@/lib/utils";
import { APPLICATION_STATUSES, JOB_STATUSES } from "@/lib/validations/employer";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string | null;
  workplaceType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  skills: { skill: { name: string } }[];
}

interface ApplicationRow {
  id: string;
  status: string;
  matchScoreAtApply: number | null;
  appliedAt: string;
  coverLetter: string | null;
  resume: { id: string; name: string } | null;
  profile: { user: { id: string; firstName: string; lastName: string; avatarUrl: string | null } };
}

const COLUMNS = ["APPLIED", "VIEWED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"] as const;
const COLUMN_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  VIEWED: "Viewed",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export default function EmployerJobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);

  async function load() {
    const [jobRes, appsRes] = await Promise.all([
      fetch(`/api/employer/jobs/${params.id}`),
      fetch(`/api/employer/jobs/${params.id}/applications`),
    ]);
    const jobJson = await jobRes.json();
    const appsJson = await appsRes.json();
    setJob(jobJson.data?.job ?? null);
    setApplications(appsJson.data?.applications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function changeJobStatus(status: string) {
    setStatusSaving(true);
    await fetch(`/api/employer/jobs/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusSaving(false);
    load();
  }

  async function changeApplicationStatus(applicationId: string, status: string) {
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    await fetch(`/api/employer/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Job not found.</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> {job.workplaceType}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <Badge key={s.skill.name}>{s.skill.name}</Badge>
                ))}
              </div>
            </div>
            <Select value={job.status} onValueChange={changeJobStatus} disabled={statusSaving}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">{job.description}</p>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Applicants ({applications.length})</h2>

      <div className="grid gap-4 lg:grid-cols-6">
        {COLUMNS.map((column) => {
          const items = applications.filter((a) => a.status === column);
          return (
            <div key={column} className="min-w-0">
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>{COLUMN_LABEL[column]}</span>
                <span>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {app.profile.user.avatarUrl && <AvatarImage src={app.profile.user.avatarUrl} />}
                          <AvatarFallback className="text-[10px]">
                            {initials(app.profile.user.firstName, app.profile.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="truncate text-xs font-medium text-foreground">
                          {app.profile.user.firstName} {app.profile.user.lastName}
                        </p>
                      </div>
                      {app.matchScoreAtApply != null && (
                        <p className="text-xs text-muted-foreground">Match: {app.matchScoreAtApply}</p>
                      )}
                      <Select value={app.status} onValueChange={(v) => changeApplicationStatus(app.id, v)}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {COLUMN_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
