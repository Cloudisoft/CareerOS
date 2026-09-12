"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SlideDeck } from "@/components/learning/slide-deck";
import type { Slide } from "@/lib/learning/slide-types";

interface Lesson {
  id: string;
  title: string;
  slides: Slide[];
  order: number;
  durationMinutes: number;
  completed: boolean;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  lessons: Lesson[];
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/learning/courses/${params.slug}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      const data: CourseDetail = json.data.course;
      setCourse(data);
      setActiveLessonId(data.lessons[0]?.id ?? null);
      setLoading(false);
    })();
  }, [params.slug]);

  async function toggleLesson(lessonId: string, completed: boolean) {
    if (!course) return;
    setCourse({
      ...course,
      lessons: course.lessons.map((l) => (l.id === lessonId ? { ...l, completed } : l)),
    });
    await fetch(`/api/learning/courses/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">This course could not be found.</p>
        <Button variant="ghost" className="mt-3" onClick={() => router.push("/learning")}>
          <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
        </Button>
      </div>
    );
  }

  const activeLesson = course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0];
  const completedCount = course.lessons.filter((l) => l.completed).length;
  const progressPercent = course.lessons.length === 0 ? 0 : Math.round((completedCount / course.lessons.length) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/learning" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Learning Hub
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{course.title}</h1>
          <Badge variant="outline">{course.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progressPercent} className="h-1.5 w-48" />
          <span className="text-xs text-muted-foreground">
            {completedCount}/{course.lessons.length} lessons complete
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          {course.lessons.map((lesson, i) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => setActiveLessonId(lesson.id)}
              className={`flex w-full items-start gap-2 rounded-md border p-2.5 text-left text-sm transition-colors ${
                activeLesson?.id === lesson.id
                  ? "border-primary/40 bg-surface-raised text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-surface-raised"
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {lesson.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center text-xs">{i + 1}</span>
                )}
              </span>
              <span>{lesson.title}</span>
            </button>
          ))}
        </div>

        {activeLesson && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{activeLesson.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> ~{activeLesson.durationMinutes} min
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={activeLesson.completed}
                    onCheckedChange={(checked) => toggleLesson(activeLesson.id, checked === true)}
                  />
                  Mark complete
                </label>
              </div>

              <SlideDeck key={activeLesson.id} slides={activeLesson.slides} />

              <div className="flex items-center justify-between border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeLesson.order === 0}
                  onClick={() => {
                    const prev = course.lessons.find((l) => l.order === activeLesson.order - 1);
                    if (prev) setActiveLessonId(prev.id);
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={activeLesson.order === course.lessons.length - 1}
                  onClick={() => {
                    const next = course.lessons.find((l) => l.order === activeLesson.order + 1);
                    if (next) setActiveLessonId(next.id);
                  }}
                >
                  Next lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
