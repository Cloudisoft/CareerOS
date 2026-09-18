"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check, X, Mail, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UpgradeRequired } from "@/components/billing/upgrade-required";
import { cn } from "@/lib/utils";

interface JobSearchResult {
  id: string;
  title: string;
  company: { name: string };
}

interface DraftRow {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  contactName: string | null;
  contactRole: string | null;
  createdAt: string;
  job: { title: string; company: { name: string } } | null;
}

export default function OutreachPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [jobQuery, setJobQuery] = useState("");
  const [jobResults, setJobResults] = useState<JobSearchResult[]>([]);
  const [targetJob, setTargetJob] = useState<JobSearchResult | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DraftRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/outreach/drafts").then((r) => r.json()),
    ]).then(([billingJson, draftsJson]) => {
      setEntitled(Boolean(billingJson.data?.entitlements?.coverLetterStudio));
      setDrafts(draftsJson.data?.drafts ?? []);
      setLoading(false);
    });
  }, []);

  async function searchJobs(q: string) {
    setJobQuery(q);
    if (q.trim().length < 2) {
      setJobResults([]);
      return;
    }
    const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (res.ok) setJobResults(json.data.jobs.slice(0, 6));
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/outreach/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        jobId: targetJob?.id,
        contactName: contactName || undefined,
        contactRole: contactRole || undefined,
      }),
    });
    const json = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setResult(json.data.draft);
    setDrafts((prev) => [json.data.draft, ...prev]);
  }

  async function copyDraft(draft: DraftRow) {
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Outreach</h1>
        <UpgradeRequired feature="Outreach drafts" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Outreach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A drafted cold email or LinkedIn message — CareerOS never sends it, and never invents a contact. Fill in
          who you're reaching out to if you know it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft a message</CardTitle>
          <CardDescription>Pick a channel, optionally attach a job and the contact's details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2 text-sm",
                channel === "email" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              <Mail className="h-4 w-4" /> Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("linkedin")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2 text-sm",
                channel === "linkedin" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              <Share2 className="h-4 w-4" /> LinkedIn message
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>Job (optional)</Label>
            {targetJob ? (
              <div className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span>
                  {targetJob.title} · {targetJob.company.name}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setTargetJob(null)} aria-label="Clear job">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Input value={jobQuery} onChange={(e) => searchJobs(e.target.value)} placeholder="Search a job to ground the draft in…" />
                {jobResults.length > 0 && (
                  <div className="space-y-1">
                    {jobResults.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          setTargetJob(job);
                          setJobQuery("");
                          setJobResults([]);
                        }}
                        className="flex w-full items-center justify-between rounded-md border border-border p-2 text-left text-sm hover:bg-surface-raised"
                      >
                        {job.title} · {job.company.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contact name (optional)</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="If you know who you're reaching" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact role (optional)</Label>
              <Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="e.g. Engineering Manager" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Draft it
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Your draft</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => copyDraft(result)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {result.subject && <p className="text-sm font-medium text-foreground">Subject: {result.subject}</p>}
            <p className="whitespace-pre-line text-sm text-foreground">{result.body}</p>
          </CardContent>
        </Card>
      )}

      {drafts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Past drafts</h2>
          <div className="space-y-2">
            {drafts.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{d.channel === "email" ? "Email" : "LinkedIn"}</Badge>
                    {d.job && (
                      <span className="text-xs text-muted-foreground">
                        {d.job.title} @ {d.job.company.name}
                      </span>
                    )}
                  </div>
                  {d.subject && <p className="mt-1 text-sm font-medium text-foreground">{d.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{d.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
