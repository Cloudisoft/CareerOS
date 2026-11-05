"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Copy, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpgradeRequired } from "@/components/billing/upgrade-required";

const SCENARIOS = [
  { value: "counter-offer", label: "Counter an initial offer" },
  { value: "competing-offer", label: "Use a competing offer as leverage" },
  { value: "geographic-discount-pushback", label: "Push back on a location-based discount" },
  { value: "asking-for-more-time", label: "Ask for more time to decide" },
] as const;

interface JobSearchResult {
  id: string;
  title: string;
  company: { name: string };
}

interface ScriptRow {
  id: string;
  scenario: string;
  script: string;
  offeredSalary: number | null;
  currency: string;
  createdAt: string;
  job: { title: string; company: { name: string } } | null;
}

interface SalaryGap {
  desiredMin: number | null;
  desiredMax: number | null;
  advertisedMin: number | null;
  advertisedMax: number | null;
  offered: number | null;
  offeredVsDesiredPercent: number | null;
}

export default function NegotiationPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [scenario, setScenario] = useState<string>(SCENARIOS[0].value);
  const [jobQuery, setJobQuery] = useState("");
  const [jobResults, setJobResults] = useState<JobSearchResult[]>([]);
  const [targetJob, setTargetJob] = useState<JobSearchResult | null>(null);
  const [offeredSalary, setOfferedSalary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ script: string; gap: SalaryGap } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/negotiation/scripts").then((r) => r.json()),
    ]).then(([billingJson, scriptsJson]) => {
      setEntitled(Boolean(billingJson.data?.entitlements?.interviewAi));
      setScripts(scriptsJson.data?.scripts ?? []);
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
    const res = await fetch("/api/negotiation/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario,
        jobId: targetJob?.id,
        offeredSalary: offeredSalary ? Number(offeredSalary) : undefined,
      }),
    });
    const json = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setResult({ script: json.data.script.script, gap: json.data.gap });
    setScripts((prev) => [json.data.script, ...prev]);
  }

  async function copyScript(text: string) {
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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Negotiation</h1>
        <UpgradeRequired feature="Negotiation scripts" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Negotiation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A ready-to-use script grounded in your real desired range, the job's posted range, and the offer on the
          table — plus how the offer stacks up against what you're looking for.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate a script</CardTitle>
          <CardDescription>Pick a scenario, optionally attach a job and the offer amount.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Scenario</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <Input value={jobQuery} onChange={(e) => searchJobs(e.target.value)} placeholder="Search a job to ground the script in its posted range…" />
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

          <div className="space-y-1.5">
            <Label>Offer amount (optional)</Label>
            <Input
              type="number"
              min={0}
              value={offeredSalary}
              onChange={(e) => setOfferedSalary(e.target.value)}
              placeholder="e.g. 145000"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate script
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Salary gap</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Your desired range</p>
                <p className="font-medium text-foreground">
                  {result.gap.desiredMin ?? "?"}-{result.gap.desiredMax ?? "?"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Posted range</p>
                <p className="font-medium text-foreground">
                  {result.gap.advertisedMin ?? "unstated"}-{result.gap.advertisedMax ?? "unstated"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Offer vs. desired</p>
                <p className="font-medium text-foreground">
                  {result.gap.offeredVsDesiredPercent != null ? `${result.gap.offeredVsDesiredPercent > 0 ? "+" : ""}${result.gap.offeredVsDesiredPercent}%` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Your script</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => copyScript(result.script)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="whitespace-pre-line text-sm text-foreground">{result.script}</p>
            </CardContent>
          </Card>
        </>
      )}

      {scripts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Past scripts</h2>
          <div className="space-y-2">
            {scripts.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">
                    {SCENARIOS.find((sc) => sc.value === s.scenario)?.label ?? s.scenario}
                    {s.job ? ` · ${s.job.title} @ ${s.job.company.name}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.script}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
