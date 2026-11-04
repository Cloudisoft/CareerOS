"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Lock, MessageSquare, Search, Unlock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatSalaryRange } from "@/lib/utils";
import { api, useEnterprise, UpgradeNotice, ErrorBanner, SuccessBanner, Spinner, Modal } from "@/components/enterprise/shared";

interface Result {
  profileId: string;
  displayName: string;
  headline: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
  industry: string | null;
  careerLevel: string | null;
  totalExperienceYears: number | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  salaryCurrency: string;
  education: string | null;
  skills: string[];
  matchScore: number | null;
  unlocked: boolean;
  applied: boolean;
}

interface Package {
  profileId: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  resumeText: string;
}

const FIELDS = [
  ["q", "Position or title"],
  ["location", "Location"],
  ["skills", "Skills (comma separated)"],
  ["industry", "Industry"],
  ["education", "Education"],
  ["employer", "Current / past employer"],
  ["minYears", "Min. years"],
  ["maxYears", "Max. years"],
  ["maxSalary", "Max. salary budget"],
] as const;

export default function CandidateSearchPage() {
  const { overview, refresh } = useEnterprise();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [results, setResults] = useState<Result[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const allowed = overview?.entitlements.resumeFetching;

  const search = useCallback(
    async (p = 1) => {
      setError(null);
      const params = new URLSearchParams({ page: String(p) });
      for (const [k, v] of Object.entries(filters)) if (v.trim()) params.set(k, v.trim());
      const res = await api<{ results: Result[]; total: number; totalPages: number }>(`/api/enterprise/candidates?${params}`);
      if (!res.ok) return setError(res.error);
      setResults(res.data!.results);
      setTotal(res.data!.total);
      setTotalPages(res.data!.totalPages);
      setPage(p);
    },
    [filters]
  );

  useEffect(() => {
    if (!allowed) return;
    search(1);
    api<{ jobs: { id: string; title: string; status: string }[] }>("/api/employer/jobs").then(
      (r) => r.ok && setJobs(r.data!.jobs.filter((j) => j.status === "OPEN"))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  if (!overview) return null;
  if (!allowed) {
    return (
      <UpgradeNotice
        feature="Resume search"
        description="Search candidates who made their profile visible to recruiters, filter by role, skills, experience, salary, education and employer, and unlock full resumes and contact details."
      />
    );
  }

  async function unlock(r: Result) {
    setBusy(r.profileId);
    setError(null);
    const res = await api<{ charged: boolean }>(`/api/enterprise/candidates/${r.profileId}/unlock`, { method: "POST" });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setNotice(res.data!.charged ? "Unlocked — 1 resume credit used." : "Already unlocked — no credit used.");
    await Promise.all([search(page), refresh()]);
    openPackage(r.profileId);
  }

  async function openPackage(profileId: string) {
    setBusy(profileId);
    const res = await api<Package>(`/api/enterprise/candidates/${profileId}`);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setPkg(res.data);
    setMsg("");
  }

  async function sendMessage() {
    if (!pkg || !msg.trim()) return;
    setSending(true);
    const res = await api<{ conversationId: string }>(`/api/enterprise/candidates/${pkg.profileId}/message`, { method: "POST", json: { content: msg } });
    setSending(false);
    if (!res.ok) return setError(res.error);
    setNotice(`Message sent to ${pkg.name}. Replies arrive in Messages.`);
    setPkg(null);
  }

  const remaining = overview.credits.resume.remaining;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      <Card className="mb-4">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(1);
            }}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FIELDS.map(([key, label]) => (
              <Input
                key={key}
                aria-label={label}
                placeholder={label}
                inputMode={key.startsWith("m") && key !== "q" ? "numeric" : undefined}
                value={filters[key] ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
              />
            ))}
            <select
              aria-label="Rank by fit for job"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              value={filters.jobId ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, jobId: e.target.value }))}
            >
              <option value="">Rank by fit for a job…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <Button type="submit" className="sm:col-span-2 lg:col-span-1">
              <Search className="h-4 w-4" /> Search
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Searching and previews are free. Unlocking a full resume and contact details uses 1 resume credit ({remaining} left this period) —
            candidates who applied to your jobs are always free. Only people who chose to be visible to recruiters appear here.
          </p>
        </CardContent>
      </Card>

      {!results ? (
        <Spinner />
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">No candidates match these filters. Try widening them.</CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">{total} candidate{total === 1 ? "" : "s"}</p>
          <div className="space-y-3">
            {results.map((r) => {
              const full = r.unlocked || r.applied;
              return (
                <Card key={r.profileId}>
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {r.displayName}
                        {r.applied && <Badge variant="success" className="ml-2 align-middle">Applied to you</Badge>}
                        {r.unlocked && <Badge variant="outline" className="ml-2 align-middle">Unlocked</Badge>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[r.currentTitle ?? r.headline, r.currentCompany, r.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[
                          r.totalExperienceYears != null ? `${r.totalExperienceYears} yrs experience` : null,
                          r.education,
                          r.desiredSalaryMin || r.desiredSalaryMax ? `Expects ${formatSalaryRange(r.desiredSalaryMin, r.desiredSalaryMax, r.salaryCurrency)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.skills.slice(0, 8).map((s) => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                      {r.matchScore != null && <Badge variant={r.matchScore >= 75 ? "brand" : "default"}>{r.matchScore}% fit</Badge>}
                      {full ? (
                        <Button size="sm" variant="secondary" disabled={busy === r.profileId} onClick={() => openPackage(r.profileId)}>
                          <Unlock className="h-3.5 w-3.5" /> View resume
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busy === r.profileId || remaining < 1} onClick={() => unlock(r)} title={remaining < 1 ? "No resume credits left this period" : undefined}>
                          <Lock className="h-3.5 w-3.5" /> {busy === r.profileId ? "Unlocking…" : "Unlock · 1 credit"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => search(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => search(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(pkg)} onClose={() => setPkg(null)} title={pkg?.name ?? ""} wide>
        {pkg && (
          <div className="space-y-4">
            <div className="grid gap-1 text-sm">
              <p><span className="text-muted-foreground">Email:</span> <a className="text-primary" href={`mailto:${pkg.email}`}>{pkg.email}</a></p>
              {pkg.phone && <p><span className="text-muted-foreground">Phone:</span> {pkg.phone}</p>}
              {pkg.location && <p><span className="text-muted-foreground">Location:</span> {pkg.location}</p>}
              {[pkg.linkedinUrl, pkg.githubUrl, pkg.portfolioUrl].filter(Boolean).map((u) => (
                <a key={u} className="truncate text-primary" href={u!} target="_blank" rel="noopener noreferrer nofollow">{u}</a>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={`/api/enterprise/candidates/${pkg.profileId}/resume`}>
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </Button>
              {overview.entitlements.atsScreening && (
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/employer/enterprise/screening?candidate=${pkg.profileId}`}>Screen with AI</Link>
                </Button>
              )}
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-raised p-3 text-xs text-foreground">{pkg.resumeText}</pre>
            {overview.entitlements.candidateEngagement && (
              <div>
                <Textarea placeholder={`Write to ${pkg.name.split(" ")[0]}…`} value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} maxLength={4000} />
                <Button className="mt-2" size="sm" disabled={!msg.trim() || sending} onClick={sendMessage}>
                  <MessageSquare className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send message"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
