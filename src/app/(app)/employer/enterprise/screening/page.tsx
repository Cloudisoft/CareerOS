"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_LABEL, api, useEnterprise, UpgradeNotice, ErrorBanner, Spinner, Modal, fmtDate } from "@/components/enterprise/shared";

interface Screening {
  id: string;
  candidateName: string | null;
  candidateProfileId: string | null;
  score: number;
  category: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendations: string[];
  breakdown: Record<string, number>;
  createdAt: string;
  job: { id: string; title: string };
}

const CRITERIA: Record<string, string> = {
  skills: "Skills match",
  experience: "Experience",
  education: "Education",
  employment: "Employment history",
  technical: "Technical depth",
  location: "Location fit",
  salary: "Salary fit",
  relevance: "Overall relevance",
};

const CATEGORY_VARIANT: Record<string, "brand" | "success" | "warning" | "destructive"> = {
  HIGHLY_QUALIFIED: "brand",
  QUALIFIED: "success",
  POTENTIAL_MATCH: "warning",
  NOT_SUITABLE: "destructive",
};

function ScreeningInner() {
  const params = useSearchParams();
  const { overview } = useEnterprise();
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobId, setJobId] = useState(params.get("job") ?? "");
  const [candidates, setCandidates] = useState<{ profileId: string; name: string }[]>([]);
  const [candidateId, setCandidateId] = useState(params.get("candidate") ?? "");
  const [mode, setMode] = useState<"candidate" | "paste">("candidate");
  const [resumeText, setResumeText] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [list, setList] = useState<Screening[] | null>(null);
  const [category, setCategory] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Screening | null>(null);
  const allowed = overview?.entitlements.atsScreening;

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    const res = await api<{ screenings: Screening[] }>(`/api/enterprise/screenings?${q}`);
    if (res.ok) setList(res.data!.screenings);
    else setError(res.error);
  }, [category]);

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed) return;
    api<{ jobs: { id: string; title: string; status: string }[] }>("/api/employer/jobs").then((r) => {
      if (!r.ok) return;
      setJobs(r.data!.jobs);
      if (!jobId && r.data!.jobs[0]) setJobId(r.data!.jobs[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  // Candidates the firm can screen: its applicants (and the one passed in from Resume search).
  useEffect(() => {
    if (!allowed || !jobId) return;
    api<{ applications: { candidate: { profileId: string; name: string } }[] }>(`/api/enterprise/pipeline?jobId=${jobId}`).then((r) => {
      if (!r.ok) return;
      const seen = new Map<string, string>();
      r.data!.applications.forEach((a) => seen.set(a.candidate.profileId, a.candidate.name));
      setCandidates(Array.from(seen, ([profileId, name]) => ({ profileId, name })));
    });
  }, [allowed, jobId]);

  if (!overview) return null;
  if (!allowed) {
    return <UpgradeNotice feature="AI ATS screening" description="Score resumes against your job descriptions across skills, experience, education, employment history, location and salary — with strengths, gaps and next steps." />;
  }

  async function run() {
    setRunning(true);
    setError(null);
    const body =
      mode === "candidate" ? { jobId, candidateProfileId: candidateId } : { jobId, resumeText, candidateName: candidateName || undefined };
    const res = await api<{ screening: Screening }>("/api/enterprise/screenings", { method: "POST", json: body });
    setRunning(false);
    if (!res.ok) return setError(res.error);
    await load();
    const created = res.data!.screening;
    setOpen({ ...created, job: jobs.find((j) => j.id === jobId) ?? { id: jobId, title: "" } });
  }

  const canRun = jobId && (mode === "candidate" ? candidateId : resumeText.trim().length >= 80);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screen a resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select aria-label="Job" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Choose a job…</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <div className="flex gap-2 text-sm">
            <Button size="sm" variant={mode === "candidate" ? "secondary" : "ghost"} onClick={() => setMode("candidate")}>CareerOS candidate</Button>
            <Button size="sm" variant={mode === "paste" ? "secondary" : "ghost"} onClick={() => setMode("paste")}>Paste a resume</Button>
          </div>
          {mode === "candidate" ? (
            <select aria-label="Candidate" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
              <option value="">Choose an applicant…</option>
              {candidateId && !candidates.some((c) => c.profileId === candidateId) && <option value={candidateId}>Unlocked candidate</option>}
              {candidates.map((c) => <option key={c.profileId} value={c.profileId}>{c.name}</option>)}
            </select>
          ) : (
            <>
              <Input placeholder="Candidate name (optional)" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} maxLength={120} />
              <Textarea rows={8} placeholder="Paste the full resume text" value={resumeText} onChange={(e) => setResumeText(e.target.value)} maxLength={40000} />
            </>
          )}
          <Button onClick={run} disabled={!canRun || running}>
            <Sparkles className="h-4 w-4" /> {running ? "Screening… this takes a few seconds" : "Run AI screening"}
          </Button>
          <p className="text-xs text-muted-foreground">Scores come from the AI model reading the resume against the job description. If the AI is unavailable you'll see an error — we never show an estimated score.</p>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-foreground">Results</h2>
          <select aria-label="Category" className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-foreground" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {!list ? (
          <Spinner />
        ) : list.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No screenings yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {list.map((s) => (
              <button key={s.id} type="button" onClick={() => setOpen(s)} className="block w-full text-left">
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{s.candidateName ?? "Candidate"}</p>
                      <p className="truncate text-sm text-muted-foreground">{s.job.title} · {fmtDate(s.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-lg font-semibold tabular-nums text-foreground">{s.score}</span>
                      <Badge variant={CATEGORY_VARIANT[s.category]}>{CATEGORY_LABEL[s.category]}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.candidateName ?? "Candidate"} · ${open.score}/100` : ""} wide>
        {open && (
          <div className="space-y-4 text-sm">
            <Badge variant={CATEGORY_VARIANT[open.category]}>{CATEGORY_LABEL[open.category]}</Badge>
            <p className="text-foreground">{open.summary}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(CRITERIA).map(([k, label]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{open.breakdown?.[k] ?? "—"}</span></div>
                  <Progress value={open.breakdown?.[k] ?? 0} />
                </div>
              ))}
            </div>
            {([["Strengths", open.strengths], ["Weaknesses", open.weaknesses], ["Missing skills", open.missingSkills], ["Recommended next steps", open.recommendations]] as const).map(([title, items]) =>
              items.length ? (
                <div key={title}>
                  <p className="font-medium text-foreground">{title}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">{items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ) : null
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ScreeningPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ScreeningInner />
    </Suspense>
  );
}
