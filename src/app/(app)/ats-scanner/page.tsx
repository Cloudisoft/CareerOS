"use client";

import { useEffect, useState } from "react";
import { Loader2, ScanSearch, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Badge } from "@/components/ui/badge";

interface ResumeOption {
  id: string;
  name: string;
}

interface AtsResult {
  score: number;
  keywordScore: number;
  formatScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export default function AtsScannerPage() {
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumeId, setResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((json) => {
        const list = json.data?.resumes ?? [];
        setResumes(list);
        if (list.length) setResumeId(list[0].id);
      });
  }, []);

  async function scan() {
    setScanning(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/ats/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, jobDescription }),
    });
    const json = await res.json();
    setScanning(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setResult(json.data.result);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">ATS Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimate how well a resume matches a job description, using Career OS's keyword and
          structure analysis. This is an estimate, not a guarantee of any specific vendor's ATS.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan</CardTitle>
          <CardDescription>Choose a resume and paste the job description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Resume</Label>
            {resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don't have any resumes yet. Build one in Resume Studio first.
              </p>
            ) : (
              <Select value={resumeId} onValueChange={setResumeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Job description</Label>
            <Textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={scan} disabled={scanning || !resumeId || !jobDescription.trim()}>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Scan
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between">
              <CircularProgress value={result.score} size={130} label="ATS Score" />
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Keyword coverage</span>
                  <span className="font-medium text-foreground">{result.keywordScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Structure & completeness</span>
                  <span className="font-medium text-foreground">{result.formatScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.matchedKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Matched keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 pt-0">
                {result.matchedKeywords.map((k) => (
                  <Badge key={k} variant="success">
                    {k}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {result.missingKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" /> Missing keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 pt-0">
                {result.missingKeywords.map((k) => (
                  <Badge key={k} variant="outline">
                    {k}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {result.recommendations.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
