"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalaryRange, cn } from "@/lib/utils";

interface JobListItem {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  careerLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  company: { name: string; slug: string; logoUrl: string | null };
  skills: string[];
  matchScore: number | null;
  source: string;
}

const WORKPLACE_OPTIONS = ["ONSITE", "HYBRID", "REMOTE"];

function matchBadgeVariant(score: number) {
  if (score >= 80) return "brand" as const;
  if (score >= 60) return "default" as const;
  return "outline" as const;
}

function JobsContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [workplaceType, setWorkplaceType] = useState<string[]>(
    searchParams.get("workplaceType")?.split(",").filter(Boolean) ?? []
  );
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (workplaceType.length) params.set("workplaceType", workplaceType.join(","));
    const res = await fetch(`/api/jobs?${params.toString()}`);
    const json = await res.json();
    setJobs(json.data?.jobs ?? []);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }, [q, location, workplaceType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function toggleWorkplace(type: string) {
    setWorkplaceType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchJobs();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Searching…" : `${total} open role${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Title or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative sm:w-56">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {WORKPLACE_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleWorkplace(type)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              workplaceType.includes(type)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {type === "ONSITE" ? "On-site" : type === "HYBRID" ? "Hybrid" : "Remote"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No jobs match your filters right now. Try widening your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold text-foreground">
                      {job.title}
                      {job.source !== "careeros" && (
                        <Badge variant="outline" className="ml-2 align-middle text-xs font-normal">
                          via {job.source === "adzuna" ? "Adzuna" : job.source === "jsearch" ? "JSearch" : job.source}
                        </Badge>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.company.name}
                      {job.location ? ` · ${job.location}` : ""} ·{" "}
                      {job.workplaceType === "REMOTE" ? "Remote" : job.workplaceType === "HYBRID" ? "Hybrid" : "On-site"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {job.matchScore != null && (
                    <Badge variant={matchBadgeVariant(job.matchScore)} className="shrink-0">
                      {job.matchScore}% match
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}
