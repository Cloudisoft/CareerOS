"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, ThumbsUp, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";

interface Question {
  id: string;
  order: number;
  category: string;
  question: string;
  answer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
}

interface SessionDetail {
  id: string;
  type: string;
  status: string;
  overallScore: number | null;
  questions: Question[];
  job: { title: string; company: { name: string } } | null;
}

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/interview/sessions/${params.id}`);
    const json = await res.json();
    setSession(json.data?.session ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Session not found.</CardContent>
      </Card>
    );
  }

  const currentIndex = session.questions.findIndex((q) => q.answer == null);
  const current = currentIndex === -1 ? null : session.questions[currentIndex];
  const allAnswered = session.questions.every((q) => q.score != null);

  async function submitAnswer() {
    if (!current || !draft.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/interview/sessions/${params.id}/questions/${current.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: draft }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setDraft("");
    load();
  }

  async function finishSession() {
    setCompleting(true);
    const res = await fetch(`/api/interview/sessions/${params.id}/complete`, { method: "POST" });
    setCompleting(false);
    if (res.ok) load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/interview-ai" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {session.job ? `${session.job.title} @ ${session.job.company.name}` : "General practice"}
        </h1>
        <Badge variant="outline">{session.type}</Badge>
      </div>

      {session.status === "COMPLETED" ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8">
              <CircularProgress value={session.overallScore ?? 0} size={120} label="Overall" />
              <p className="text-sm text-muted-foreground">
                Average across {session.questions.filter((q) => q.score != null).length} scored answers.
              </p>
            </CardContent>
          </Card>

          {session.questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{q.category}</Badge>
                  {q.score != null && <span className="text-sm font-semibold text-foreground">{q.score}%</span>}
                </div>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                {q.answer && <p className="whitespace-pre-line text-sm text-muted-foreground">{q.answer}</p>}
                {q.feedback && <p className="text-sm text-foreground">{q.feedback}</p>}
                {(q.strengths.length > 0 || q.improvements.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {q.strengths.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 text-xs font-medium text-success">
                          <ThumbsUp className="h-3.5 w-3.5" /> Strengths
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {q.strengths.map((s) => (
                            <li key={s}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.improvements.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 text-xs font-medium text-primary">
                          <TrendingUp className="h-3.5 w-3.5" /> Improve
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {q.improvements.map((s) => (
                            <li key={s}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Question {(currentIndex === -1 ? session.questions.length : currentIndex) + 1} of {session.questions.length}
          </p>

          {current ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <Badge variant="outline">{current.category}</Badge>
                <p className="text-lg font-medium text-foreground">{current.question}</p>
                <Textarea
                  rows={8}
                  placeholder="Type your answer…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={submitAnswer} disabled={submitting || !draft.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit answer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-success/40">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm text-foreground">All questions answered. Finish to see your overall score.</p>
                <Button onClick={finishSession} disabled={completing || !allAnswered}>
                  {completing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finish session
                </Button>
              </CardContent>
            </Card>
          )}

          {session.questions
            .filter((q) => q.answer != null)
            .map((q) => (
              <Card key={q.id}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{q.category}</Badge>
                    {q.score != null && <span className="text-sm font-semibold text-foreground">{q.score}%</span>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  {q.feedback && <p className="text-sm text-muted-foreground">{q.feedback}</p>}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
