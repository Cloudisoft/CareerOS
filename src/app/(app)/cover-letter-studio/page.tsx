"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check, Printer, Pencil, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpgradeRequired } from "@/components/billing/upgrade-required";
import { MicButton } from "@/components/voice/mic-button";
import { SpeakButton } from "@/components/voice/speak-button";

interface TargetJob {
  job: { id: string; title: string; company: { name: string } };
}

const TONES = ["professional", "enthusiastic", "concise"] as const;

export default function CoverLetterStudioPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<TargetJob[]>([]);
  const [jobId, setJobId] = useState<string>("none");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [candidateName, setCandidateName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([billingJson, appsJson, meJson]) => {
      setEntitled(Boolean(billingJson.data?.entitlements?.coverLetterStudio));
      setJobs(appsJson.data?.applications ?? []);
      const me = meJson.data?.user;
      if (me) setCandidateName(`${me.firstName} ${me.lastName}`.trim());
      setLoading(false);
    });
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    setLetter("");
    const res = await fetch("/api/resumes/cover-letter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        jobId !== "none"
          ? { jobId, tone }
          : { jobTitle, companyName, jobDescription, tone }
      ),
    });
    const json = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setLetter(json.data.text);
    setView("preview");
  }

  const selectedJob = jobId !== "none" ? jobs.find((a) => a.job.id === jobId) : null;
  const letterCompanyName = selectedJob?.job.company.name || companyName;
  const letterJobTitle = selectedJob?.job.title || jobTitle;

  async function copyLetter() {
    await navigator.clipboard.writeText(letter);
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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Cover Letter Studio</h1>
        <UpgradeRequired feature="Cover Letter Studio" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cover Letter Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated, grounded in your real Career Profile — pick a job you've applied to, or paste a
          new one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target role</CardTitle>
          <CardDescription>Choose from your applications, or fill in the details manually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length > 0 && (
            <div className="space-y-1.5">
              <Label>From your applications</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Enter manually</SelectItem>
                  {jobs.map((a) => (
                    <SelectItem key={a.job.id} value={a.job.id}>
                      {a.job.title} @ {a.job.company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {jobId === "none" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobDescription">Job description</Label>
                <div className="relative">
                  <Textarea
                    id="jobDescription"
                    rows={6}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here, or dictate it with the mic."
                    className="pb-12"
                  />
                  <MicButton
                    className="absolute bottom-2 right-2"
                    onFinalText={(text) => setJobDescription((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as (typeof TONES)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={generate}
            disabled={generating || (jobId === "none" && (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()))}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate cover letter
          </Button>
        </CardContent>
      </Card>

      {letter && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Your cover letter</CardTitle>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView((v) => (v === "edit" ? "preview" : "edit"))}
              >
                {view === "edit" ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {view === "edit" ? "Preview" : "Edit"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setView("preview");
                  requestAnimationFrame(() => window.print());
                }}
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </Button>
              <SpeakButton text={letter} />
              <Button size="sm" variant="secondary" onClick={copyLetter}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {view === "preview" ? (
              <div
                id="cover-letter-print-area"
                className="mx-auto max-w-[8.5in] whitespace-pre-wrap rounded-lg border border-border bg-white p-10 text-sm leading-relaxed text-neutral-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
              >
                <div className="mb-6 flex items-baseline justify-between text-xs text-neutral-500">
                  <span>{candidateName}</span>
                  <span>{new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                {(letterJobTitle || letterCompanyName) && (
                  <p className="mb-4 text-xs text-neutral-500">
                    Re: {letterJobTitle || "the open role"}
                    {letterCompanyName ? ` at ${letterCompanyName}` : ""}
                  </p>
                )}
                {letter}
              </div>
            ) : (
              <div className="relative">
                <Textarea rows={14} value={letter} onChange={(e) => setLetter(e.target.value)} className="pb-12" />
                <MicButton
                  className="absolute bottom-2 right-2"
                  onFinalText={(text) => setLetter((prev) => (prev ? `${prev} ${text}` : text))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
