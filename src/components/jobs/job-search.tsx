"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  ChevronDown,
  Clock,
  Globe2,
  GraduationCap,
  Laptop,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  Sprout,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { JobRowBody, type JobRowData } from "@/components/jobs/job-row";
import { JobDetailPane, loadJobDetail } from "@/components/jobs/job-detail-pane";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/jobs/countries";

interface JobListItem extends JobRowData {
  company: { name: string; slug: string; logoUrl: string | null };
  saved?: boolean;
  closingInDays?: number | null;
  source: string;
}

interface ListResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  totalPages: number;
  refreshing?: boolean;
}

const EMPLOYMENT = [
  ["FULL_TIME", "Full-time"],
  ["PART_TIME", "Part-time"],
  ["CONTRACT", "Contract"],
  ["INTERNSHIP", "Internship"],
  ["TEMPORARY", "Temporary"],
] as const;
const WORKPLACE = [
  ["REMOTE", "Remote"],
  ["HYBRID", "Hybrid"],
  ["ONSITE", "On-site"],
] as const;
const LEVELS = [
  ["ENTRY", "Entry level"],
  ["ASSOCIATE", "Associate"],
  ["MID", "Mid level"],
  ["SENIOR", "Senior"],
  ["LEAD", "Lead"],
  ["MANAGER", "Manager"],
  ["DIRECTOR", "Director+"],
] as const;
const SOURCES = [
  ["careeros", "Career OS"],
  ["greenhouse", "Greenhouse"],
  ["lever", "Lever"],
  ["ashby", "Ashby"],
  ["workday", "Workday"],
  ["adzuna", "Adzuna"],
  ["jsearch", "JSearch"],
] as const;

/** One-tap filters. Each sets a single URL parameter. */
const SUGGESTED: { key: string; value: string; label: string; icon: typeof Laptop; color: string }[] = [
  { key: "experience", value: "none", label: "No experience required", icon: Sprout, color: "text-emerald-600" },
  { key: "workplaceType", value: "REMOTE", label: "Remote", icon: Laptop, color: "text-sky-600" },
  { key: "employmentType", value: "INTERNSHIP", label: "Internships", icon: GraduationCap, color: "text-violet-600" },
  { key: "visa", value: "1", label: "Open to visa sponsorship", icon: Globe2, color: "text-blue-600" },
  { key: "opt", value: "1", label: "OPT / CPT friendly", icon: BadgeCheck, color: "text-teal-600" },
  { key: "closing", value: "1", label: "Closing soon", icon: Clock, color: "text-amber-600" },
];

/** Every control in the search row shares this height, border and radius. */
const PILL =
  "inline-flex h-11 items-center rounded-xl border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-surface-raised data-[state=open]:border-foreground/40";
const ACTIVE_PILL = "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10";

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">{n}</span>;
}

const FILTER_KEYS = ["q", "location", "radius", "country", "employmentType", "workplaceType", "careerLevel", "minSalary", "source", "visa", "opt", "open", "closing", "experience", "sort"];

// List responses kept for the visit, so back/forward and repeated filters are instant.
const listCache = new Map<string, ListResponse>();
const DISMISSED_KEY = "careeros-dismissed-jobs";

function readDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

interface JobSearchExperienceProps {
  /** Lets the same search be presented under another name, e.g. SilverCareers. */
  brandName?: string;
  tagline?: string;
}

export function JobSearchExperience({ brandName = "Jobs", tagline }: JobSearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("job");
  const savedTab = params.get("saved") === "1";

  const filterKey = useMemo(() => {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) {
      const v = params.get(k);
      if (v) p.set(k, v);
    }
    return p.toString();
  }, [params]);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  useEffect(() => {
    setQ(params.get("q") ?? "");
    setLocation(params.get("location") ?? "");
  }, [params]);

  const [data, setData] = useState<ListResponse | null>(() => listCache.get(filterKey) ?? null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<JobListItem[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const refetchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setDismissed(readDismissed()), []);

  /** Rewrites the URL (the single source of truth for filters) without scrolling. */
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const fetchList = useCallback(
    async (key: string, quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const res = await fetch(`/api/jobs?${key}`);
        const json = await res.json();
        if (!res.ok) return;
        const body = json.data as ListResponse;
        listCache.set(key, body);
        setData(body);
        setPage(1);
        clearTimeout(refetchTimer.current);
        // A background scan of employer boards is still running: pick up its jobs once, quietly.
        if (body.refreshing && !quiet) refetchTimer.current = setTimeout(() => fetchList(key, true), 9000);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (savedTab) return;
    const cached = listCache.get(filterKey);
    if (cached) {
      setData(cached);
      setPage(1);
    }
    fetchList(filterKey, Boolean(cached));
    return () => clearTimeout(refetchTimer.current);
  }, [filterKey, savedTab, fetchList]);

  useEffect(() => {
    if (!savedTab) return;
    setSavedJobs(null);
    fetch("/api/jobs/saved")
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setNeedsLogin(true);
          setSavedJobs([]);
          return;
        }
        const json = await r.json();
        setSavedJobs(((json.data?.jobs ?? []) as JobListItem[]).map((j) => ({ ...j, saved: true })));
      })
      .catch(() => setSavedJobs([]));
  }, [savedTab]);

  async function loadMore() {
    if (!data || page >= data.totalPages) return;
    setLoadingMore(true);
    const res = await fetch(`/api/jobs?${filterKey}${filterKey ? "&" : ""}page=${page + 1}`).catch(() => null);
    const json = await res?.json().catch(() => null);
    setLoadingMore(false);
    if (!res?.ok) return;
    setData((d) => (d ? { ...d, jobs: [...d.jobs, ...(json.data.jobs as JobListItem[]).filter((j) => !d.jobs.some((x) => x.id === j.id))] } : d));
    setPage((p) => p + 1);
  }

  const jobs = useMemo(() => {
    const list = savedTab ? savedJobs ?? [] : data?.jobs ?? [];
    return list.filter((j) => !dismissed.has(j.id));
  }, [savedTab, savedJobs, data, dismissed]);

  // Desktop shows the first job straight away; phones open a job on its own page.
  const isDesktop = useRef(false);
  useEffect(() => {
    isDesktop.current = window.matchMedia("(min-width: 1024px)").matches;
  }, []);
  useEffect(() => {
    if (!selected && jobs.length && window.matchMedia("(min-width: 1024px)").matches) {
      setParams({ job: jobs[0].id });
    }
  }, [selected, jobs, setParams]);

  function openJob(id: string) {
    if (isDesktop.current) setParams({ job: id });
    else router.push(`/jobs/${id}`);
  }

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next).slice(-500)));
    } catch {}
    if (selected === id) {
      const rest = jobs.filter((j) => j.id !== id);
      setParams({ job: rest[0]?.id ?? null });
    }
  }

  async function toggleSaved(job: JobListItem) {
    const next = !job.saved;
    const update = (list: JobListItem[]) => list.map((j) => (j.id === job.id ? { ...j, saved: next } : j));
    setData((d) => (d ? { ...d, jobs: update(d.jobs) } : d));
    setSavedJobs((s) => (s ? update(s) : s));
    const res = await fetch(`/api/jobs/${job.id}/save`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    if (res?.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(`/jobs?job=${job.id}`)}`;
      return;
    }
    listCache.clear();
  }

  function onSavedChange(id: string, saved: boolean) {
    const update = (list: JobListItem[]) => list.map((j) => (j.id === id ? { ...j, saved } : j));
    setData((d) => (d ? { ...d, jobs: update(d.jobs) } : d));
    setSavedJobs((s) => (s ? update(s) : s));
    listCache.clear();
  }

  const multi = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  function toggleMulti(key: string, value: string) {
    const cur = multi(key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    setParams({ [key]: next.join(",") || null, job: null });
  }
  const isZip = /^\d{5}$/.test(location.trim());
  const extraFilterCount =
    multi("workplaceType").length +
    multi("careerLevel").length +
    multi("source").length +
    ["minSalary", "visa", "opt", "open"].filter((k) => params.get(k)).length;
  const country = params.get("country") as keyof typeof COUNTRIES | null;
  const locationLabel = [params.get("location"), country && COUNTRIES[country] ? COUNTRIES[country].label : null].filter(Boolean).join(" · ") || "Location";
  const anyFilter = FILTER_KEYS.some((k) => k !== "sort" && params.get(k));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setParams({ q: q.trim() || null, location: location.trim() || null, radius: isZip ? params.get("radius") ?? "25" : null, job: null, saved: null });
  }

  const showingSkeleton = !savedTab ? !data && loading : savedJobs === null;

  return (
    // Fills the viewport under whichever header wraps it (app shell or public site), edge to edge.
    <div
      className="flex flex-col bg-surface"
      style={{ margin: "calc(var(--shell-pad, 0px) * -1)", height: "calc(100dvh - var(--shell-top, 73px))", minHeight: 520 }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border px-4 sm:px-6">
        <h1 className="py-3 text-lg font-semibold text-foreground">{brandName}</h1>
        <nav className="flex gap-5 text-sm font-medium" aria-label="Job lists">
          <button
            type="button"
            onClick={() => setParams({ saved: null, job: null })}
            className={cn("border-b-2 py-3.5", !savedTab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setParams({ saved: "1", job: null })}
            className={cn("border-b-2 py-3.5", savedTab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            Saved
          </button>
        </nav>
        <Link href="/jobs/swipe" className="ml-auto hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex">
          <Layers className="h-4 w-4" /> Swipe view
        </Link>
      </div>

      {/* Search + filters: one row of equal-height controls; on small screens the pills scroll sideways. */}
      {!savedTab && (
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form onSubmit={submit} role="search" className="relative min-w-0 lg:max-w-xl lg:flex-1">
              <label htmlFor="jobs-q" className="sr-only">
                Describe a job you want
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <input
                id="jobs-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Describe a job you want"
                enterKeyHint="search"
                className={cn(PILL, "w-full pl-10 pr-10 text-[15px] font-normal placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15")}
              />
              {q && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQ("");
                    setParams({ q: null, job: null });
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
              <Popover>
                <PopoverTrigger className={cn(PILL, "shrink-0 gap-1.5 px-4", (params.get("location") || params.get("country")) && ACTIVE_PILL)}>
                  <MapPin className="h-4 w-4" />
                  <span className="max-w-[140px] truncate">{locationLabel}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setParams({ location: location.trim() || null, radius: isZip ? params.get("radius") ?? "25" : null, job: null });
                    }}
                  >
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="jobs-location">
                      City or zip code
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        id="jobs-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. London, Bengaluru, 10001"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                      <button type="submit" className="h-9 rounded-lg bg-foreground px-3 text-sm font-semibold text-background">
                        Apply
                      </button>
                    </div>
                    {isZip && (
                      <select
                        aria-label="Distance"
                        className="mt-2 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
                        value={params.get("radius") ?? "25"}
                        onChange={(e) => setParams({ radius: e.target.value, location: location.trim(), job: null })}
                      >
                        {[10, 25, 50, 100].map((m) => (
                          <option key={m} value={m}>
                            Within {m} miles
                          </option>
                        ))}
                      </select>
                    )}
                  </form>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country or region</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1">
                    {[["", "Anywhere"], ...Object.entries(COUNTRIES).map(([code, c]) => [code, c.label])].map(([code, label]) => {
                      const active = (params.get("country") ?? "") === code;
                      return (
                        <button
                          key={code || "any"}
                          type="button"
                          onClick={() => setParams({ country: code || null, job: null })}
                          className={cn("rounded-lg px-2.5 py-1.5 text-left text-sm", active ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-surface-raised")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger className={cn(PILL, "shrink-0 gap-1.5 px-4", multi("employmentType").length > 0 && ACTIVE_PILL)}>
                  Job type
                  {multi("employmentType").length > 0 && <Count n={multi("employmentType").length} />}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                  {EMPLOYMENT.map(([v, l]) => (
                    <CheckRow key={v} label={l} checked={multi("employmentType").includes(v)} onChange={() => toggleMulti("employmentType", v)} />
                  ))}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger className={cn(PILL, "shrink-0 gap-1.5 px-4", extraFilterCount > 0 && ACTIVE_PILL)}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {extraFilterCount > 0 && <Count n={extraFilterCount} />}
                </PopoverTrigger>
                <PopoverContent align="end" className="max-h-[70vh] w-80 overflow-y-auto p-3">
                  <FilterGroup title="Work authorization">
                    <CheckRow label="Open to visa sponsorship" checked={params.get("visa") === "1"} onChange={() => setParams({ visa: params.get("visa") === "1" ? null : "1", job: null })} />
                    <CheckRow label="Open to students (OPT / CPT)" checked={params.get("opt") === "1"} onChange={() => setParams({ opt: params.get("opt") === "1" ? null : "1", job: null })} />
                    <CheckRow label="Hide citizens / PR-only roles" checked={params.get("open") === "1"} onChange={() => setParams({ open: params.get("open") === "1" ? null : "1", job: null })} />
                  </FilterGroup>
                  <FilterGroup title="Workplace">
                    {WORKPLACE.map(([v, l]) => (
                      <CheckRow key={v} label={l} checked={multi("workplaceType").includes(v)} onChange={() => toggleMulti("workplaceType", v)} />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Experience level">
                    {LEVELS.map(([v, l]) => (
                      <CheckRow key={v} label={l} checked={multi("careerLevel").includes(v)} onChange={() => toggleMulti("careerLevel", v)} />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Minimum yearly pay">
                    <select
                      aria-label="Minimum pay"
                      className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
                      value={params.get("minSalary") ?? ""}
                      onChange={(e) => setParams({ minSalary: e.target.value || null, job: null })}
                    >
                      <option value="">Any</option>
                      {[40000, 60000, 80000, 100000, 130000, 160000, 200000].map((v) => (
                        <option key={v} value={v}>
                          {v / 1000}K+ (posting currency)
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterGroup title="Source">
                    {SOURCES.map(([v, l]) => (
                      <CheckRow key={v} label={l} checked={multi("source").includes(v)} onChange={() => toggleMulti("source", v)} />
                    ))}
                  </FilterGroup>
                </PopoverContent>
              </Popover>

              {anyFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setLocation("");
                    router.replace(pathname, { scroll: false });
                  }}
                  className={cn(PILL, "shrink-0 px-4 lg:ml-auto")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 sm:-mx-6 sm:px-6">
            <span className="shrink-0 text-[13px] text-muted-foreground">Suggested</span>
            {SUGGESTED.map((s) => {
              const active = (params.get(s.key)?.split(",") ?? []).includes(s.value);
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    s.key === "workplaceType" || s.key === "employmentType" ? toggleMulti(s.key, s.value) : setParams({ [s.key]: active ? null : s.value, job: null })
                  }
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary ring-1 ring-primary/40" : "text-foreground/75 hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <s.icon className={cn("h-4 w-4", s.color)} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List + detail */}
      <div className="flex min-h-0 flex-1">
        <section className="flex w-full flex-col border-r border-border lg:w-[420px] lg:shrink-0" aria-label="Results">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm sm:px-5">
            <span className="text-muted-foreground" aria-live="polite">
              {savedTab
                ? savedJobs
                  ? `${jobs.length} saved job${jobs.length === 1 ? "" : "s"}`
                  : "Loading…"
                : data
                  ? `${data.total.toLocaleString()} job${data.total === 1 ? "" : "s"} found`
                  : "Searching…"}
            </span>
            {!savedTab && (
              <label className="flex items-center gap-2 text-muted-foreground">
                Sort by
                <select
                  className="h-8 rounded-lg border border-border bg-surface px-2 text-sm font-medium text-foreground"
                  value={params.get("sort") ?? ""}
                  onChange={(e) => setParams({ sort: e.target.value || null, job: null })}
                >
                  <option value="">Most recent</option>
                  <option value="match">Best match</option>
                </select>
              </label>
            )}
          </div>
          {tagline && <p className="px-5 pb-2 text-xs text-muted-foreground">{tagline}</p>}

          <div className={cn("min-h-0 flex-1 overflow-y-auto transition-opacity", loading && data && "opacity-60")}>
            {showingSkeleton ? (
              <ListSkeleton />
            ) : needsLogin && savedTab ? (
              <Empty>
                <Link href={`/login?next=${encodeURIComponent("/jobs?saved=1")}`} className="font-semibold text-primary hover:underline">
                  Log in
                </Link>{" "}
                to see the jobs you saved.
              </Empty>
            ) : jobs.length === 0 ? (
              <Empty>
                {savedTab ? "Save jobs with the bookmark to keep them here." : "No jobs match these filters yet. Try removing one or widening the location."}
              </Empty>
            ) : (
              <ul>
                {jobs.map((job) => {
                  const active = job.id === selected;
                  return (
                    <li key={job.id} className="relative">
                      <button
                        type="button"
                        onClick={() => openJob(job.id)}
                        onMouseEnter={() => loadJobDetail(job.id)}
                        onFocus={() => loadJobDetail(job.id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "block w-full border-b border-l-[3px] border-b-border py-4 pl-4 pr-20 text-left transition-colors sm:pl-5",
                          active ? "border-l-primary bg-surface-raised/60" : "border-l-transparent hover:bg-surface-raised/40"
                        )}
                      >
                        <JobRowBody job={job} compact />
                        {job.closingInDays != null && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <Clock className="h-3 w-3" /> Closes in {job.closingInDays}d
                          </span>
                        )}
                      </button>
                      <div className="absolute right-3 top-3.5 flex gap-0.5">
                        <IconButton label={job.saved ? "Unsave job" : "Save job"} onClick={() => toggleSaved(job)}>
                          {job.saved ? <BookmarkCheck className="h-[18px] w-[18px] text-primary" /> : <Bookmark className="h-[18px] w-[18px]" />}
                        </IconButton>
                        {!savedTab && (
                          <IconButton label="Not interested" onClick={() => dismiss(job.id)}>
                            <X className="h-[18px] w-[18px]" />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
                {!savedTab && data && page < data.totalPages && (
                  <li className="p-4">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="h-10 w-full rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-surface-raised disabled:opacity-60"
                    >
                      {loadingMore ? "Loading…" : "Show more jobs"}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        <section className="hidden min-w-0 flex-1 overflow-y-auto lg:block" aria-label="Job details">
          {selected ? (
            <div className="mx-auto max-w-3xl">
              <JobDetailPane key={selected} jobId={selected} onSavedChange={onSavedChange} onApplied={() => listCache.clear()} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
              Pick a job to see the details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-surface-raised">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[hsl(var(--primary))]" />
      {label}
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2 last:border-0">
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-14 text-center text-sm text-muted-foreground">{children}</p>;
}

function ListSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3.5 border-b border-border px-5 py-4">
          <div className="h-10 w-10 rounded-lg bg-surface-raised" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-surface-raised" />
            <div className="h-4 w-3/4 rounded bg-surface-raised" />
            <div className="h-3 w-1/3 rounded bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}
