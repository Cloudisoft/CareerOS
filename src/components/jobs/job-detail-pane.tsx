"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileBadge,
  GraduationCap,
  Loader2,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { careerLevelLabel, employmentLabel, payLabel, postedLabel, workplaceLabel } from "@/lib/jobs/display";
import { cn } from "@/lib/utils";

export interface JobDetailData {
  job: {
    id: string;
    title: string;
    description: string;
    location: string | null;
    workplaceType: string;
    employmentType: string;
    careerLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    createdAt: string;
    expiresAt: string | null;
    source: string;
    externalUrl: string | null;
    company: { name: string; slug: string; logoUrl: string | null; industry: string | null; size: string | null };
    skills: { name: string; required: boolean }[];
  };
  match: { score: number; matchedSkills: string[]; missingSkills: string[]; reasons: string[] } | null;
  saved: boolean;
  alreadyApplied: boolean;
  signals: {
    visa: "SPONSORS" | "NO_SPONSORSHIP" | "NOT_STATED";
    workAuthorization: boolean;
    regions: string[];
    citizensOnly: boolean;
    studentFriendly: boolean;
    yearsRequired: number | null;
    closingInDays: number | null;
  };
}

// Detail responses kept for the visit, so going back to a job is instant.
const detailCache = new Map<string, Promise<JobDetailData | null>>();

export function loadJobDetail(id: string, fresh = false) {
  if (!fresh && detailCache.has(id)) return detailCache.get(id)!;
  const p = fetch(`/api/jobs/${id}`)
    .then(async (r) => (r.ok ? ((await r.json()).data as JobDetailData) : null))
    .catch(() => null);
  detailCache.set(id, p);
  p.then((d) => {
    if (!d) detailCache.delete(id);
  });
  return p;
}

const REGION_NAMES: Record<string, string> = { US: "the US", UK: "the UK", AU: "Australia", NZ: "New Zealand", CA: "Canada", IN: "India", AE: "the UAE", EU: "the EU" };

/** Work rights in plain words, for visa holders, PR/GC, citizens and students anywhere. */
function authTitle(s: JobDetailData["signals"]) {
  const where = s.regions.map((r) => REGION_NAMES[r] ?? r).join(" or ");
  if (s.citizensOnly) return `Citizens or permanent residents${where ? ` of ${where}` : ""} only`;
  if (s.visa === "SPONSORS") return "Open to visa sponsorship";
  if (where) return `Right to work in ${where} required`;
  if (s.studentFriendly) return "Open to students (OPT / CPT)";
  return "Open to all work authorizations";
}

function authDetail(s: JobDetailData["signals"]) {
  const parts: string[] = [];
  if (s.citizensOnly) parts.push("Visa holders and students aren't eligible");
  else if (s.visa === "SPONSORS") parts.push("Visa holders welcome; the employer can sponsor");
  else if (s.visa === "NO_SPONSORSHIP") parts.push("Doesn't sponsor visas; citizens, PR / Green Card holders and existing work visas welcome");
  else parts.push("No visa or citizenship limits stated in the posting");
  if (s.studentFriendly && !s.citizensOnly && s.visa !== "SPONSORS") parts.push("open to students on OPT / CPT");
  else if (s.studentFriendly && s.visa === "SPONSORS") parts.push("students on OPT / CPT welcome");
  return parts.join("; ");
}

const SOURCE_NAMES: Record<string, string> = { adzuna: "Adzuna", jsearch: "JSearch", greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", workday: "Workday" };

function Glance({ icon: Icon, title, sub }: { icon: typeof MapPin; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/80" strokeWidth={1.75} />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
    </li>
  );
}

export function JobDetailPane({
  jobId,
  onSavedChange,
  onApplied,
}: {
  jobId: string;
  onSavedChange?: (id: string, saved: boolean) => void;
  onApplied?: (id: string) => void;
}) {
  const [data, setData] = useState<JobDetailData | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let live = true;
    setData(undefined);
    setApplyError(null);
    setExpanded(false);
    loadJobDetail(jobId).then((d) => {
      if (!live) return;
      setData(d);
      setSaved(Boolean(d?.saved));
      setApplied(Boolean(d?.alreadyApplied));
    });
    return () => {
      live = false;
    };
  }, [jobId]);

  if (data === undefined) {
    return (
      <div className="animate-pulse p-8" aria-busy="true">
        <div className="h-14 w-14 rounded-xl bg-surface-raised" />
        <div className="mt-5 h-7 w-2/3 rounded bg-surface-raised" />
        <div className="mt-3 h-4 w-1/3 rounded bg-surface-raised" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-1/2 rounded bg-surface-raised" />
          ))}
        </div>
      </div>
    );
  }
  if (data === null) {
    return <p className="p-10 text-center text-sm text-muted-foreground">This job is no longer available.</p>;
  }

  const { job, match, signals } = data;
  const external = job.source !== "careeros" && job.externalUrl;
  const pay = payLabel(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const level = careerLevelLabel(job.careerLevel);
  const posted = postedLabel(job.createdAt);
  const applyBy = job.expiresAt ? new Date(job.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    const res = await fetch(`/api/jobs/${job.id}/save`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    if (res?.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(`/jobs?job=${job.id}`)}`;
      return;
    }
    if (!res?.ok) return setSaved(!next);
    detailCache.delete(job.id);
    onSavedChange?.(job.id, next);
  }

  async function quickApply() {
    setApplying(true);
    setApplyError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => null);
    setApplying(false);
    if (res?.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(`/jobs?job=${job.id}`)}`;
      return;
    }
    const json = await res?.json().catch(() => null);
    if (!res?.ok) {
      setApplyError(json?.error?.message ?? "Couldn't apply. Please try again.");
      return;
    }
    setApplied(true);
    detailCache.delete(job.id);
    onApplied?.(job.id);
  }

  async function share() {
    const url = `${window.location.origin}/jobs/${job.id}`;
    try {
      if (navigator.share) await navigator.share({ title: job.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  }

  const description = job.description ?? "";
  const longDescription = description.length > 1400;

  return (
    <article className="px-6 py-7 sm:px-10">
      <Link href={`/company/${job.company.slug}`} className="group inline-flex items-center gap-3">
        <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={56} />
        <span>
          <span className="block text-lg font-semibold text-foreground group-hover:underline">{job.company.name}</span>
          {job.company.industry && <span className="block text-sm text-muted-foreground">{job.company.industry}</span>}
        </span>
      </Link>

      <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]">{job.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Posted {posted === "New" ? "recently" : posted}
        {applyBy && (
          <>
            {" · "}
            <span className={cn(signals.closingInDays != null && "font-medium text-warning")}>Apply by {applyBy}</span>
          </>
        )}
        {job.source !== "careeros" && ` · via ${SOURCE_NAMES[job.source] ?? job.source}`}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={saved}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-raised"
        >
          {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-raised"
        >
          <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share"}
        </button>
        {applied ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-success/10 px-4 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Applied
          </span>
        ) : external ? (
          <a
            href={job.externalUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90"
          >
            Apply on company site <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={quickApply}
            disabled={applying}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {applying && <Loader2 className="h-4 w-4 animate-spin" />}
            Quick apply
          </button>
        )}
        <Link href={`/jobs/${job.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5">
          <Sparkles className="h-4 w-4" /> AI evaluation
        </Link>
      </div>
      {!applied && !external && <p className="mt-2 text-xs text-muted-foreground">Quick apply sends your primary resume. Want a cover letter? Open the full posting.</p>}
      {applyError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {applyError}{" "}
          {/resume/i.test(applyError) && (
            <Link href="/resume-studio" className="font-semibold underline">
              Add a resume
            </Link>
          )}
        </p>
      )}

      <hr className="my-7 border-border" />

      <h3 className="text-lg font-semibold text-foreground">At a glance</h3>
      <ul className="mt-4 space-y-5">
        {pay && <Glance icon={Banknote} title={pay} />}
        <Glance
          icon={MapPin}
          title={job.workplaceType === "REMOTE" ? "Remote" : `${workplaceLabel(job.workplaceType)}${job.location ? `, based in ${job.location}` : ""}`}
          sub={
            job.workplaceType === "HYBRID"
              ? "Work in person for part of the week"
              : job.workplaceType === "ONSITE"
                ? "Work in person"
                : "Work from anywhere they hire"
          }
        />
        <Glance icon={Briefcase} title="Job" sub={[employmentLabel(job.employmentType), level].filter(Boolean).join(" · ")} />
        <Glance icon={FileBadge} title={authTitle(signals)} sub={authDetail(signals)} />
        {signals.yearsRequired != null && (
          <Glance
            icon={GraduationCap}
            title={signals.yearsRequired === 0 ? "No experience required" : `${signals.yearsRequired}+ years of experience`}
            sub={signals.yearsRequired === 0 ? "Open to new graduates and career changers" : "The minimum the posting asks for"}
          />
        )}
        {signals.closingInDays != null && (
          <Glance icon={Clock} title={signals.closingInDays === 0 ? "Closes today" : `Closes in ${signals.closingInDays} day${signals.closingInDays === 1 ? "" : "s"}`} sub="Apply soon" />
        )}
      </ul>

      {match && (
        <div className="mt-7 rounded-xl border border-border bg-surface-raised/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Your match</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">{match.score}%</span>
          </div>
          {match.reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {match.reasons.slice(0, 3).map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          )}
          {match.missingSkills.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Skills to brush up:</span> {match.missingSkills.slice(0, 5).join(", ")}
            </p>
          )}
        </div>
      )}

      {job.skills.length > 0 && (
        <div className="mt-7">
          <h3 className="text-lg font-semibold text-foreground">Skills</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  match?.matchedSkills.includes(s.name) ? "border-success/30 bg-success/10 text-success" : "border-border text-foreground/80"
                )}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        <h3 className="text-lg font-semibold text-foreground">About the role</h3>
        <div className={cn("relative mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85", longDescription && !expanded && "max-h-[420px] overflow-hidden")}>
          {description}
          {longDescription && !expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />}
        </div>
        {longDescription && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-semibold text-primary hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </article>
  );
}
