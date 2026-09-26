"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Building2, HelpCircle, BookOpen, MessageCircleQuestion, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradeRequired } from "@/components/billing/upgrade-required";

interface PrepQuestion {
  category: string;
  question: string;
}

interface PrepStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface PrepPack {
  id: string;
  jobId: string;
  companyBrief: string;
  questions: PrepQuestion[];
  stories: PrepStory[];
  questionsToAsk: string[];
  readinessScore: number;
  readinessUpdatedAt: string | null;
}

export default function InterviewPrepPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  const [pack, setPack] = useState<PrepPack | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/interview/prep-packs/${params.applicationId}`).then(async (r) => ({ res: r, json: await r.json() })),
      fetch(`/api/applications/${params.applicationId}`).then((r) => r.json()),
    ]).then(([{ res, json }, appJson]) => {
      if (res.status === 402) {
        setUpgrade(true);
      } else if (!res.ok) {
        setError(json.error?.message ?? "Couldn't build your prep pack yet.");
      } else {
        setPack(json.data?.prepPack ?? null);
      }
      const app = appJson.data?.application;
      if (app) {
        setJobTitle(app.job.title);
        setCompanyName(app.job.company.name);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.applicationId]);

  async function startPractice() {
    if (!pack) return;
    setStarting(true);
    const res = await fetch("/api/interview/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "MIXED", jobId: pack.jobId }),
    });
    const json = await res.json();
    setStarting(false);
    if (res.ok) router.push(`/interview-ai/${json.data.session.id}`);
    else setError(json.error?.message ?? "Couldn't start practice.");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (upgrade) {
    return (
      <div className="mx-auto max-w-2xl">
        <UpgradeRequired feature="Company Interview Preparation" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/applications" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Your interview with {companyName || "this company"} — let&apos;s get you ready
        </h1>
        {jobTitle && <p className="mt-1 text-sm text-muted-foreground">{jobTitle}</p>}
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {pack && (
        <>
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-medium text-foreground">Readiness for this job</p>
                <p className="text-xs text-muted-foreground">
                  {pack.readinessUpdatedAt
                    ? "Updates as you practice for this specific job."
                    : "Practice a session for this job to start building your readiness score."}
                </p>
              </div>
              <div className="text-3xl font-bold text-foreground">{pack.readinessScore}%</div>
            </CardContent>
          </Card>

          <Button onClick={startPractice} disabled={starting} size="lg">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Practice for this job
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Company brief
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{pack.companyBrief}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="h-4 w-4" /> Likely questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pack.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {q.category}
                  </Badge>
                  <p className="text-sm text-foreground">{q.question}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" /> Your STAR stories for this role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pack.stories.map((s, i) => (
                <div key={i} className="space-y-1 border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Situation:</span> {s.situation}
                  </p>
                  {s.task && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Task:</span> {s.task}
                    </p>
                  )}
                  {s.action && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Action:</span> {s.action}
                    </p>
                  )}
                  {s.result && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Result:</span> {s.result}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircleQuestion className="h-4 w-4" /> Questions to ask them
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pack.questionsToAsk.map((q, i) => (
                <p key={i} className="text-sm text-foreground">
                  · {q}
                </p>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
