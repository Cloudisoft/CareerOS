"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpgradeRequired } from "@/components/billing/upgrade-required";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ]).then(([billingJson, appsJson]) => {
      setEntitled(Boolean(billingJson.data?.entitlements?.coverLetterStudio));
      setJobs(appsJson.data?.applications ?? []);
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
  }

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
                <Textarea
                  id="jobDescription"
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here."
                />
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
            <Button size="sm" variant="secondary" onClick={copyLetter}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea rows={14} value={letter} onChange={(e) => setLetter(e.target.value)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
