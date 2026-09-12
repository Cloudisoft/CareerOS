"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeRequired } from "@/components/billing/upgrade-required";
import { cn } from "@/lib/utils";

interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  lessonCount: number;
  completedCount: number;
  progressPercent: number;
}

function CourseCard({ course }: { course: CourseSummary }) {
  const started = course.completedCount > 0;
  const complete = course.progressPercent === 100;

  return (
    <Link href={`/learning/courses/${course.slug}`} className="group block h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(239,134,45,0.08)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: "linear-gradient(90deg, transparent, #EF862D, #DF4C2C, transparent)" }}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          {complete ? (
            <Badge variant="success">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
            </Badge>
          ) : (
            <Badge variant="outline">{course.level}</Badge>
          )}
        </div>
        <h3 className="mt-3 text-base font-semibold text-foreground">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline" className="shrink-0">
            {course.category}
          </Badge>
          <span className="text-xs text-muted-foreground">{course.lessonCount} lessons</span>
        </div>
        {started && (
          <div className="mt-3 flex items-center gap-2">
            <Progress value={course.progressPercent} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {course.completedCount}/{course.lessonCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function LearningHubPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [recommended, setRecommended] = useState<CourseSummary[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const billingRes = await fetch("/api/billing/status");
      const billingJson = await billingRes.json();
      const isEntitled = Boolean(billingJson.data?.entitlements?.learning);
      setEntitled(isEntitled);
      if (!isEntitled) {
        setLoading(false);
        return;
      }

      const [coursesRes, recRes] = await Promise.all([
        fetch("/api/learning/courses"),
        fetch("/api/learning/recommended"),
      ]);
      const coursesJson = await coursesRes.json();
      const recJson = await recRes.json();
      setCourses(coursesJson.data?.courses ?? []);
      setRecommended(recJson.data?.courses ?? []);
      setMissingSkills(recJson.data?.missingSkills ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category));
    return Array.from(set).sort();
  }, [courses]);

  const visibleCourses = activeCategory ? courses.filter((c) => c.category === activeCategory) : courses;

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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Learning Hub</h1>
        <UpgradeRequired feature="The Learning Hub" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Learning Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Original Career OS courses — real written lessons and slides you work through here, not links out to
          someone else's site.
        </p>
      </div>

      {recommended.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recommended for you</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Based on skills that come up as missing across your job matches: {missingSkills.join(", ")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === null
                ? "border-transparent bg-brand-gradient text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All courses
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "border-transparent bg-brand-gradient text-white"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
