"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, ThumbsUp, TrendingUp, Mic, Square, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";

/** The Web Speech API has no official TS lib types; this is the minimal
    shape this component actually uses. Free, native, no server round trip. */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function useVoiceInput(onFinalText: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  function start() {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) text += result[0].transcript;
      }
      if (text.trim()) onFinalText(text.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, start, stop };
}

/** Speaks the interviewer's questions aloud with the browser's native speech
    synthesis — free, no server round trip, same pattern as voice input above. */
function useVoiceOutput() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function speak(text: string) {
    if (!supported || muted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return { supported, speaking, muted, setMuted, speak, stop };
}

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
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
