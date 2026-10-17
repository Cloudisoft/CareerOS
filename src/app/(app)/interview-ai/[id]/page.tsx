"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, ThumbsUp, TrendingUp, Mic, Square, Volume2, VolumeX, RotateCcw, RefreshCw, Mail, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useVoiceOutput } from "@/hooks/use-voice-output";

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

interface Recap {
  jobTitle: string | null;
  companyName: string | null;
  overallScore: number | null;
  questionsCovered: { category: string; question: string; score: number | null }[];
  wentWell: string[];
  toImprove: string[];
}

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryDraft, setRetryDraft] = useState("");
  const [retrySubmitting, setRetrySubmitting] = useState(false);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [thankYou, setThankYou] = useState<string | null>(null);
  const [draftingThankYou, setDraftingThankYou] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [stageConfirmed, setStageConfirmed] = useState(false);
  const [confirmingStage, setConfirmingStage] = useState(false);
  const voice = useVoiceInput((text) => setDraft((prev) => (prev ? `${prev} ${text}` : text)));
  const voiceOut = useVoiceOutput();
  const lastSpokenIdRef = useRef<string | null>(null);

  async function load() {
    const res = await fetch(`/api/interview/sessions/${params.id}`);
    const json = await res.json();
    setSession(json.data?.session ?? null);
    if (json.data?.totalQuestions) setTotalQuestions(json.data.totalQuestions);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    return () => voiceOut.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.status === "COMPLETED") {
      fetch(`/api/interview/sessions/${params.id}/recap`)
        .then((r) => r.json())
        .then((json) => setRecap(json.data?.recap ?? null));
      fetch(`/api/interview/sessions/${params.id}/application`)
        .then((r) => r.json())
        .then((json) => setApplicationId(json.data?.application?.id ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status]);

  useEffect(() => {
    if (!session) return;
    const currentQ = session.questions.find((q) => q.answer == null);
    if (currentQ && lastSpokenIdRef.current !== currentQ.id) {
      lastSpokenIdRef.current = currentQ.id;
      voiceOut.speak(currentQ.question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
    voiceOut.stop();
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

  async function submitRetry(questionId: string) {
    if (!retryDraft.trim()) return;
    setRetrySubmitting(true);
    setError(null);
    const res = await fetch(`/api/interview/sessions/${params.id}/questions/${questionId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: retryDraft }),
    });
    const json = await res.json();
    setRetrySubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    setRetryingId(null);
    setRetryDraft("");
    load();
  }

  async function draftThankYou() {
    setDraftingThankYou(true);
    const res = await fetch(`/api/interview/sessions/${params.id}/thank-you`, { method: "POST" });
    const json = await res.json();
    setDraftingThankYou(false);
    if (res.ok) setThankYou(json.data?.draft ?? null);
  }

  async function confirmStage(status: string) {
    if (!applicationId) return;
    setConfirmingStage(true);
    const res = await fetch(`/api/applications/${applicationId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setConfirmingStage(false);
    if (res.ok) setStageConfirmed(true);
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

          {recap && (session.job || applicationId) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(recap.wentWell.length > 0 || recap.toImprove.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {recap.wentWell.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-success">Went well</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {recap.wentWell.map((s) => (
                            <li key={s}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recap.toImprove.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-primary">To improve</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {recap.toImprove.map((s) => (
                            <li key={s}>· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {session.job && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <Button variant="secondary" size="sm" onClick={draftThankYou} disabled={draftingThankYou}>
                      {draftingThankYou ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Draft thank-you email
                    </Button>
                    {thankYou && (
                      <div className="relative rounded-md border border-border bg-muted/40 p-3">
                        <p className="whitespace-pre-line text-sm text-foreground">{thankYou}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2"
                          onClick={() => navigator.clipboard.writeText(thankYou)}
                          aria-label="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {applicationId && (
                  <div className="space-y-2 border-t border-border pt-4">
                    {stageConfirmed ? (
                      <p className="text-sm text-success">Thanks — your application stage is updated.</p>
                    ) : (
                      <>
                        <p className="text-sm text-foreground">How did the real interview go? Confirm your application's stage:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" disabled={confirmingStage} onClick={() => confirmStage("SCREENING")}>
                            Still in progress
                          </Button>
                          <Button size="sm" variant="secondary" disabled={confirmingStage} onClick={() => confirmStage("OFFER")}>
                            Got an offer
                          </Button>
                          <Button size="sm" variant="secondary" disabled={confirmingStage} onClick={() => confirmStage("REJECTED")}>
                            Didn't move forward
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Question {(currentIndex === -1 ? session.questions.length : currentIndex) + 1} of {totalQuestions}
          </p>

          {current ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="outline">{current.category}</Badge>
                  {voiceOut.supported && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={voiceOut.muted}
                        onClick={() => voiceOut.speak(current.question)}
                        aria-label="Replay question"
                        title="Replay question"
                      >
                        <RotateCcw className={voiceOut.speaking ? "h-4 w-4 animate-pulse text-primary" : "h-4 w-4"} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (!voiceOut.muted) voiceOut.stop();
                          voiceOut.setMuted((m) => !m);
                        }}
                        aria-label={voiceOut.muted ? "Unmute interviewer" : "Mute interviewer"}
                        title={voiceOut.muted ? "Unmute interviewer" : "Mute interviewer"}
                      >
                        {voiceOut.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium text-foreground">{current.question}</p>
                <div className="relative">
                  <Textarea
                    rows={8}
                    placeholder="Type your answer, or use the mic to speak it…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className={voice.supported ? "pb-12" : undefined}
                  />
                  {voice.supported && (
                    <Button
                      type="button"
                      variant={voice.listening ? "secondary" : "ghost"}
                      size="icon"
                      className="absolute bottom-2 right-2"
                      onClick={voice.listening ? voice.stop : voice.start}
                      aria-label={voice.listening ? "Stop recording" : "Answer by voice"}
                    >
                      {voice.listening ? <Square className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                {voice.listening && (
                  <p className="text-xs text-muted-foreground">Listening… speak your answer, then stop when done.</p>
                )}
                {voice.error && <p className="text-xs text-destructive">{voice.error}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={submitAnswer} disabled={submitting || !draft.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Scoring your answer…" : "Submit answer"}
                </Button>
                {submitting && (
                  <p className="text-xs text-muted-foreground">
                    The interviewer is reviewing your answer and preparing the next question.
                  </p>
                )}
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
                  {retryingId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={4}
                        placeholder="Try answering this question again…"
                        value={retryDraft}
                        onChange={(e) => setRetryDraft(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitRetry(q.id)} disabled={retrySubmitting || !retryDraft.trim()}>
                          {retrySubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                          Rescore this answer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRetryingId(null);
                            setRetryDraft("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRetryingId(q.id);
                        setRetryDraft(q.answer ?? "");
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retry this answer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
