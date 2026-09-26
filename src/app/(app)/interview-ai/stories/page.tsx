"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, LockOpen, Sparkles, ThumbsUp, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UpgradeRequired } from "@/components/billing/upgrade-required";

interface Story {
  question: string;
  answer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  lockedAt: string | null;
}

export default function MyStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [storiesRes, billingRes] = await Promise.all([
      fetch("/api/interview/stories").then((r) => r.json()),
      fetch("/api/billing/status").then((r) => r.json()),
    ]);
    const rows: Story[] = storiesRes.data?.stories ?? [];
    setStories(rows);
    setDrafts(Object.fromEntries(rows.map((s) => [s.question, s.answer ?? ""])));
    setEntitled(Boolean(billingRes.data?.entitlements?.interviewAi));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function practice(question: string) {
    setBusy(question);
    setError(null);
    const res = await fetch("/api/interview/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer: drafts[question] ?? "" }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    load();
  }

  async function lock(question: string) {
    setBusy(question);
    setError(null);
    const res = await fetch("/api/interview/stories/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer: drafts[question] ?? "" }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong.");
      return;
    }
    load();
  }

  async function unlock(question: string) {
    setBusy(question);
    await fetch("/api/interview/stories/lock", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    setBusy(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/interview-ai" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Interview AI
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Stories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice the 6 questions almost every interview asks, get AI feedback, then lock the exact wording you want
          to use. A locked story is surfaced automatically instead of a generated hint whenever Live Interview Hints
          detects a close match.
        </p>
      </div>

      {entitled === false ? (
        <UpgradeRequired feature="Interview AI" />
      ) : (
        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {stories.map((story) => {
            const locked = Boolean(story.lockedAt);
            const draft = drafts[story.question] ?? "";
            const isBusy = busy === story.question;
            return (
              <Card key={story.question} className={locked ? "border-success/40" : undefined}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{story.question}</p>
                    {locked ? (
                      <Badge variant="brand" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    ) : story.score != null ? (
                      <span className="text-sm font-semibold text-foreground">{story.score}%</span>
                    ) : null}
                  </div>

                  <Textarea
                    rows={4}
                    value={draft}
                    disabled={locked}
                    placeholder="Write your answer…"
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [story.question]: e.target.value }))}
                  />

                  {story.feedback && <p className="text-sm text-foreground">{story.feedback}</p>}
                  {(story.strengths.length > 0 || story.improvements.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {story.strengths.length > 0 && (
                        <div>
                          <p className="flex items-center gap-1 text-xs font-medium text-success">
                            <ThumbsUp className="h-3.5 w-3.5" /> Strengths
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {story.strengths.map((s) => (
                              <li key={s}>· {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {story.improvements.length > 0 && (
                        <div>
                          <p className="flex items-center gap-1 text-xs font-medium text-primary">
                            <TrendingUp className="h-3.5 w-3.5" /> Improve
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {story.improvements.map((s) => (
                              <li key={s}>· {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {locked ? (
                      <Button variant="outline" size="sm" onClick={() => unlock(story.question)} disabled={isBusy}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
                        Unlock to edit
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => practice(story.question)} disabled={isBusy || !draft.trim()}>
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Score this answer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lock(story.question)}
                          disabled={isBusy || !draft.trim()}
                        >
                          <Lock className="h-4 w-4" /> Lock final answer
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
