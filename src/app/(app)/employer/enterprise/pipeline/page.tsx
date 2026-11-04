"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, CATEGORY_LABEL, api, useEnterprise, UpgradeNotice, ErrorBanner, SuccessBanner, Spinner, Modal, fmtDate } from "@/components/enterprise/shared";

interface Row {
  applicationId: string;
  status: string;
  appliedAt: string;
  job: { id: string; title: string };
  candidate: { profileId: string; userId: string; name: string; currentTitle: string | null; location: string | null; totalExperienceYears: number | null };
  screening: { id: string; score: number; category: string } | null;
  engagement: "NOT_CONTACTED" | "CONTACTED" | "REPLIED";
}

const ENGAGEMENT_LABEL = { NOT_CONTACTED: "Not contacted", CONTACTED: "Contacted", REPLIED: "Replied" };

export default function PipelinePage() {
  const { overview } = useEnterprise();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<Row | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = overview?.entitlements.candidateEngagement;

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (jobId) params.set("jobId", jobId);
    if (status) params.set("status", status);
    const res = await api<{ applications: Row[]; stages: string[] }>(`/api/enterprise/pipeline?${params}`);
    if (!res.ok) return setError(res.error);
    setRows(res.data!.applications);
    setStages(res.data!.stages);
  }, [jobId, status]);

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed) return;
    api<{ jobs: { id: string; title: string }[] }>("/api/employer/jobs").then((r) => r.ok && setJobs(r.data!.jobs));
  }, [allowed]);

  if (!overview) return null;
  if (!allowed) {
    return <UpgradeNotice feature="Candidate engagement" description="Message applicants, shortlist or reject them, and move them through interview stages — with AI screening scores alongside." />;
  }

  async function move(row: Row, next: string) {
    setError(null);
    const res = await api(`/api/enterprise/pipeline/${row.applicationId}`, { method: "PATCH", json: { status: next } });
    if (!res.ok) return setError(res.error);
    setNotice(`${row.candidate.name} moved to ${STAGE_LABEL[next]}. They've been notified.`);
    load();
  }

  async function send() {
    if (!messaging || !msg.trim()) return;
    setBusy(true);
    const res = await api(`/api/enterprise/candidates/${messaging.candidate.profileId}/message`, { method: "POST", json: { content: msg } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`Message sent to ${messaging.candidate.name}.`);
    setMessaging(null);
    setMsg("");
    load();
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select aria-label="Job" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">All jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select aria-label="Stage" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All stages</option>
          {stages.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
      </div>

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No applicants here yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.applicationId}>
              <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{r.candidate.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[r.candidate.currentTitle, r.candidate.location].filter(Boolean).join(" · ")} · applied to {r.job.title} on {fmtDate(r.appliedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={r.status === "REJECTED" ? "destructive" : r.status === "OFFER" ? "success" : "default"}>{STAGE_LABEL[r.status] ?? r.status}</Badge>
                    <Badge variant={r.engagement === "REPLIED" ? "success" : "outline"}>{ENGAGEMENT_LABEL[r.engagement]}</Badge>
                    {r.screening ? (
                      <Badge variant={r.screening.category === "HIGHLY_QUALIFIED" ? "brand" : "outline"}>
                        AI {r.screening.score} · {CATEGORY_LABEL[r.screening.category]}
                      </Badge>
                    ) : overview.entitlements.atsScreening ? (
                      <Link className="text-xs text-primary hover:underline" href={`/employer/enterprise/screening?candidate=${r.candidate.profileId}&job=${r.job.id}`}>Screen with AI</Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMessaging(r)}>
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                  {r.status !== "SCREENING" && r.status !== "REJECTED" && (
                    <Button size="sm" variant="secondary" onClick={() => move(r, "SCREENING")}>Shortlist</Button>
                  )}
                  {r.status !== "REJECTED" && (
                    <Button size="sm" variant="outline" onClick={() => move(r, "REJECTED")}>Reject</Button>
                  )}
                  <select
                    aria-label={`Move ${r.candidate.name} to stage`}
                    className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground"
                    value=""
                    onChange={(e) => e.target.value && move(r, e.target.value)}
                  >
                    <option value="">Move to…</option>
                    {stages.filter((s) => s !== r.status).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(messaging)} onClose={() => setMessaging(null)} title={`Message ${messaging?.candidate.name ?? ""}`}>
        <Textarea rows={5} maxLength={4000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your message appears in their CareerOS inbox." />
        <Button className="mt-3" disabled={!msg.trim() || busy} onClick={send}>{busy ? "Sending…" : "Send"}</Button>
      </Modal>
    </div>
  );
}
