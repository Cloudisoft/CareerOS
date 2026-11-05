"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2, MapPin, Briefcase, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalaryRange } from "@/lib/utils";

interface SwipeJob {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  company: { name: string; logoUrl: string | null };
  skills: string[];
  matchScore: number | null;
  source: string;
  externalUrl: string | null;
}

interface ResumeOption {
  id: string;
  isPrimary: boolean;
}

const SWIPE_THRESHOLD = 120;

export function SwipeDeck({ authed }: { authed: boolean }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<SwipeJob[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resumeId, setResumeId] = useState<string | undefined>(undefined);
  const [lastAction, setLastAction] = useState<{ job: SwipeJob; direction: "left" | "right" } | null>(null);
  const loadingMore = useRef(false);

  const loadPage = useCallback(async (pageNum: number) => {
    const res = await fetch(`/api/jobs?sort=match&page=${pageNum}`);
    const json = await res.json();
    setJobs((prev) => (pageNum === 1 ? json.data?.jobs ?? [] : [...prev, ...(json.data?.jobs ?? [])]));
    setTotalPages(json.data?.totalPages ?? 1);
  }, []);

  useEffect(() => {
    (async () => {
      await loadPage(1);
      if (authed) {
        const res = await fetch("/api/resumes");
        const json = await res.json();
        const list: ResumeOption[] = json.data?.resumes ?? [];
        setResumeId((list.find((r) => r.isPrimary) ?? list[0])?.id);
      }
      setLoading(false);
    })();
  }, [loadPage, authed]);

  useEffect(() => {
    if (index >= jobs.length - 3 && page < totalPages && !loadingMore.current) {
      loadingMore.current = true;
      loadPage(page + 1).then(() => {
        setPage((p) => p + 1);
        loadingMore.current = false;
      });
    }
  }, [index, jobs.length, page, totalPages, loadPage]);

  async function commitSwipe(job: SwipeJob, direction: "left" | "right") {
    setLastAction({ job, direction });
    setIndex((i) => i + 1);

    if (direction !== "right") return;

    if (!authed) {
      router.push(`/login?next=${encodeURIComponent("/jobs/swipe")}`);
      return;
    }

    if (job.source === "careeros") {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, resumeId }),
      }).catch(() => {});
    } else {
      fetch(`/api/jobs/${job.id}/save`, { method: "POST" }).catch(() => {});
      if (job.externalUrl) window.open(job.externalUrl, "_blank", "noopener,noreferrer");
    }
  }

  const current = jobs[index];
  const next = jobs[index + 1];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center">
      <div className="relative h-[480px] w-full">
        {!current ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="font-medium text-foreground">You're all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later for new matches, or browse the full list.</p>
            <Link href="/jobs" className="mt-4 text-sm text-primary hover:underline">
              Browse jobs list
            </Link>
          </div>
        ) : (
          <>
            {next && <JobCard job={next} stacked />}
            <AnimatePresence>
              <SwipeCard key={current.id} job={current} onSwipe={(dir) => commitSwipe(current, dir)} />
            </AnimatePresence>
          </>
        )}
      </div>

      {current && (
        <div className="mt-6 flex items-center gap-6">
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            aria-label="Skip"
            onClick={() => commitSwipe(current, "left")}
          >
            <X className="h-6 w-6" />
          </Button>
          {lastAction && lastAction.direction === "left" && index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              aria-label="Undo skip"
              onClick={() => {
                setIndex((i) => Math.max(0, i - 1));
                setLastAction(null);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-brand-gradient"
            aria-label="Apply"
            onClick={() => commitSwipe(current, "right")}
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Swipe right to apply (or save, for jobs from other boards) · swipe left to skip
      </p>
    </div>
  );
}

function JobCard({ job, stacked }: { job: SwipeJob; stacked?: boolean }) {
  return (
    <div
      className={
        "absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg" +
        (stacked ? " scale-[0.96] opacity-70" : "")
      }
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{job.company.name}</p>
          {job.matchScore != null && (
            <Badge variant={job.matchScore >= 80 ? "brand" : job.matchScore >= 60 ? "default" : "outline"}>
              {job.matchScore}% match
            </Badge>
          )}
        </div>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{job.title}</h2>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {job.workplaceType === "REMOTE" ? "Remote" : job.workplaceType === "HYBRID" ? "Hybrid" : "On-site"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
        </p>
        {job.source !== "careeros" && (
          <Badge variant="outline" className="mt-3">
            via {job.source}
          </Badge>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 8).map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      <Link
        href={`/jobs/${job.id}`}
        className="border-t border-border p-3 text-center text-xs text-muted-foreground hover:text-foreground"
      >
        View full posting
      </Link>
    </div>
  );
}

function SwipeCard({ job, onSwipe }: { job: SwipeJob; onSwipe: (direction: "left" | "right") => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const applyOpacity = useTransform(x, [20, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_e, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
        else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
      }}
      exit={{ x: x.get() > 0 ? 400 : x.get() < 0 ? -400 : 0, opacity: 0, transition: { duration: 0.2 } }}
    >
      <JobCard job={job} />
      <motion.div
        style={{ opacity: applyOpacity }}
        className="pointer-events-none absolute right-6 top-6 rounded-md border-2 border-success px-3 py-1 text-sm font-bold text-success"
      >
        APPLY
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute left-6 top-6 rounded-md border-2 border-destructive px-3 py-1 text-sm font-bold text-destructive"
      >
        SKIP
      </motion.div>
    </motion.div>
  );
}
