"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink, Search, CheckCircle2, Circle, Clock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface Resource {
  id: string;
  title: string;
  provider: string;
  url: string;
  type: string;
  level: string;
  durationMinutes: number | null;
  description: string;
  skill: { name: string } | null;
}

interface ProgressRow {
  resourceId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  resource: Resource;
}

function ResourceCard({
  resource,
  progressStatus,
  onStart,
  onComplete,
}: {
  resource: Resource;
  progressStatus?: "IN_PROGRESS" | "COMPLETED";
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{resource.title}</p>
              {resource.skill && <Badge variant="outline">{resource.skill.name}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {resource.provider} · {resource.type} · {resource.level}
              {resource.durationMinutes ? (
                <>
                  {" · "}
                  <Clock className="inline h-3 w-3" /> ~{Math.round(resource.durationMinutes / 60)}h
                </>
              ) : null}
            </p>
          </div>
          <a href={resource.url} target="_blank" rel="noreferrer">
            <Button size="icon" variant="ghost" aria-label="Open resource">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
        <p className="text-sm text-muted-foreground">{resource.description}</p>
        <div className="flex items-center gap-2">
          {!progressStatus ? (
            <Button size="sm" variant="secondary" onClick={() => onStart(resource.id)}>
              <Circle className="h-4 w-4" /> Start
            </Button>
          ) : progressStatus === "IN_PROGRESS" ? (
            <Button size="sm" variant="secondary" onClick={() => onComplete(resource.id)}>
              <CheckCircle2 className="h-4 w-4" /> Mark complete
            </Button>
          ) : (
            <Badge variant="success">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearningHubPage() {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Resource[]>([]);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<Record<string, "IN_PROGRESS" | "COMPLETED">>({});
  const [courses, setCourses] = useState<CourseSummary[]>([]);

  async function loadProgress() {
    const res = await fetch("/api/learning/progress");
    const json = await res.json();
    const rows: ProgressRow[] = json.data?.progress ?? [];
    const map: Record<string, "IN_PROGRESS" | "COMPLETED"> = {};
    for (const row of rows) map[row.resourceId] = row.status;
    setProgress(map);
  }

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

      const [recRes, catalogRes, coursesRes] = await Promise.all([
        fetch("/api/learning/recommended"),
        fetch("/api/learning/resources"),
        fetch("/api/learning/courses"),
      ]);
      const recJson = await recRes.json();
      const catalogJson = await catalogRes.json();
      const coursesJson = await coursesRes.json();
      setRecommended(recJson.data?.resources ?? []);
      setMissingSkills(recJson.data?.missingSkills ?? []);
      setCatalog(catalogJson.data?.resources ?? []);
      setCourses(coursesJson.data?.courses ?? []);
      await loadProgress();
      setLoading(false);
    })();
  }, []);

  async function search() {
    const res = await fetch(`/api/learning/resources?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setCatalog(json.data?.resources ?? []);
  }

  async function startResource(resourceId: string) {
    setProgress((prev) => ({ ...prev, [resourceId]: "IN_PROGRESS" }));
    await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
  }

  async function completeResource(resourceId: string) {
    setProgress((prev) => ({ ...prev, [resourceId]: "COMPLETED" }));
    await fetch(`/api/learning/progress/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Learning Hub</h1>
        <UpgradeRequired feature="The Learning Hub" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Learning Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A curated catalog of real, external courses and docs — recommended from the skills your
          own job matches say you're missing.
        </p>
      </div>

      <Tabs defaultValue="recommended">
        <TabsList>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="browse">Browse all</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <p className="mb-3 text-sm text-muted-foreground">
            Original Career OS courses on the job-search process itself — resumes, interviews, negotiation, and strategy.
          </p>
          <div className="space-y-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/learning/courses/${c.slug}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">{c.title}</p>
                          <Badge variant="outline">{c.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                      </div>
                      {c.progressPercent === 100 && (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={c.progressPercent} className="h-1.5 flex-1" />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.completedCount}/{c.lessonCount} lessons
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommended">
          {missingSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              We don't have any missing-skill signal yet — browse jobs to get matched, or explore the full
              catalog below.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Based on skills that come up as missing across your job matches: {missingSkills.join(", ")}
              </p>
              {recommended.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No catalog resources for those skills yet — try Browse all.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommended.map((r) => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      progressStatus={progress[r.id]}
                      onStart={startResource}
                      onComplete={completeResource}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="browse">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="mb-4 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9")}
                placeholder="Search by title, provider, or skill"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <div className="space-y-3">
            {catalog.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                progressStatus={progress[r.id]}
                onStart={startResource}
                onComplete={completeResource}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
