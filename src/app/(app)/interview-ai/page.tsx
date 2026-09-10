"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UpgradeRequired } from "@/components/billing/upgrade-required";
import { INTERVIEW_TYPES } from "@/lib/validations/interview";

interface SessionRow {
  id: string;
  type: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  job: { title: string; company: { name: string } } | null;
  _count: { questions: number };
}

interface TargetJob {
  job: { id: string; title: string; company: { name: string } };
}

export default function InterviewAiPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [jobs, setJobs] = useState<TargetJob[]>([]);
  const [type, setType] = useState<string>("MIXED");
  const [jobId, setJobId] = useState<string>("none");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [companyPrepEntitled, setCompanyPrepEntitled] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/interview/sessions").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/billing/status").then((r) => r.json()),
    ]).then(([sessionsJson, appsJson, billingJson]) => {
      setSessions(sessionsJson.data?.sessions ?? []);
      setJobs(appsJson.data?.applications ?? []);
      setEntitled(Boolean(billingJson.data?.entitlements?.interviewAi));
      setCompanyPrepEntitled(Boolean(billingJson.data?.entitlements?.companyInterviewPrep));
      setLoading(false);
    });
  }, []);

  async function startSession() {
    setStarting(true);
    setError(null);
    const res = await fetch("/api/interview/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, jobId: jobId === "none" ? "" : jobId }),
    });
    const json = await res.json();
    setStarting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    window.location.href = `/interview-ai/${json.data.session.id}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Interview AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice with adaptive mock interviews, scored question-by-question.
        </p>
      </div>

      {entitled === false ? (
        <UpgradeRequired feature="Interview AI" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a new session</CardTitle>
            <CardDescription>5 questions, tailored to your background and (optionally) a target job.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Interview type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Target job (optional)</label>
                <Select value={jobId} onValueChange={setJobId} disabled={!companyPrepEntitled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General practice</SelectItem>
                    {jobs.map((a) => (
                      <SelectItem key={a.job.id} value={a.job.id}>
                        {a.job.title} @ {a.job.company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!companyPrepEntitled && (
                  <p className="text-xs text-muted-foreground">
                    Company Interview Preparation requires Premium or higher.
                  </p>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={startSession} disabled={starting}>
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start interview
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Past sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link key={s.id} href={`/interview-ai/${s.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {s.job ? `${s.job.title} @ ${s.job.company.name}` : "General practice"}
                        </p>
                        <Badge variant="outline">{s.type}</Badge>
                        <Badge variant={s.status === "COMPLETED" ? "brand" : "outline"}>{s.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()} · {s._count.questions} questions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.overallScore != null && (
                        <span className="text-sm font-semibold text-foreground">{s.overallScore}%</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
