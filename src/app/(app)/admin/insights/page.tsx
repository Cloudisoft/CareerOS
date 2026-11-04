"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, ErrorBanner, Modal, Spinner, Stat, fmtDate, usd } from "@/components/enterprise/shared";

type Dict = Record<string, number>;
interface Overview {
  users: { byRole: Dict; new7: number; new30: number; active7: number };
  candidates: {
    plans: Dict;
    addOns: Dict;
    applications7: number;
    applicationsBySource7: Dict;
    autoApplyRuns7: number;
    autoApplySubmitted7: number;
    autoApplyFailed7: number;
    interviews7: number;
    aiUsage7: Dict;
  };
  enterprise: { byStatus: Dict; byPlan: Dict; jobsPosted30: number; inmail30: number; unlocks30: number; screenings30: number };
  revenue30: { cents: number; payments: number };
}
interface CandidateRow {
  userId: string;
  name: string;
  email: string;
  status: string;
  joined: string;
  lastActive: string | null;
  title: string | null;
  plan: string;
  planComplimentary: boolean;
  addOns: string[];
  extensionConnected: boolean;
  applications: number;
  applications30: number;
  autoApplied: number;
  interviews: number;
  aiUses30: number;
}
interface CompanyRow {
  companyId: string;
  name: string;
  owner: string | null;
  members: number;
  openJobs: number;
  plan: string | null;
  status: string;
  complimentary: boolean;
  trialEndsAt: string | null;
  renewsAt: string | null;
  jobsPosted30: number;
  inmail30: number;
  unlocks30: number;
  screenings30: number;
  lifetimeRevenueCents: number;
  lastCreditUse: string | null;
}

const ADDON_LABEL: Record<string, string> = { RESUME_STUDIO: "Resume Studio", INTERVIEW_AI: "Interview AI" };
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase());
const when = (d: string | null) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

function DictList({ data, empty = "None" }: { data: Dict; empty?: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="divide-y divide-border text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between py-1.5">
          <span className="text-foreground">{ADDON_LABEL[k] ?? label(k)}</span>
          <span className="tabular-nums text-muted-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [tab, setTab] = useState<"overview" | "candidates" | "companies">("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cands, setCands] = useState<{ candidates: CandidateRow[]; total: number; page: number; totalPages: number } | null>(null);
  const [cq, setCq] = useState("");
  const [cfilter, setCfilter] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [eq, setEq] = useState("");
  const [detail, setDetail] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>("/api/admin/insights").then((r) => (r.ok ? setOverview(r.data) : setError(r.error)));
  }, []);

  const loadCandidates = useCallback(
    async (page = 1) => {
      const p = new URLSearchParams({ page: String(page) });
      if (cq.trim()) p.set("q", cq.trim());
      if (cfilter) p.set("filter", cfilter);
      const r = await api<NonNullable<typeof cands>>(`/api/admin/insights/candidates?${p}`);
      if (r.ok) setCands(r.data);
      else setError(r.error);
    },
    [cq, cfilter]
  );

  const loadCompanies = useCallback(async () => {
    const r = await api<{ companies: CompanyRow[] }>(`/api/admin/insights/enterprise?q=${encodeURIComponent(eq.trim())}`);
    if (r.ok) setCompanies(r.data!.companies);
    else setError(r.error);
  }, [eq]);

  useEffect(() => {
    if (tab === "candidates" && !cands) loadCandidates(1);
    if (tab === "companies" && !companies) loadCompanies();
  }, [tab, cands, companies, loadCandidates, loadCompanies]);

  async function openCandidate(c: CandidateRow) {
    const r = await api<{
      user: { createdAt: string; subscription: { plan: string; status: string; currentPeriodEnd: string | null; paypalSubscriptionId: string | null } | null; addOnSubscriptions: { addOn: string; status: string }[]; sessions: { createdAt: string; userAgent: string | null }[]; extensionSessions: { deviceLabel: string | null; lastSeenAt: string }[]; payments: { amount: number; status: string; description: string | null; createdAt: string }[]; candidateProfile: { visibility: string; profileScore: number; resumeScore: number; careerReadinessScore: number } | null };
      applications: { id: string; status: string; source: string; appliedAt: string; title: string; company: string }[];
      autoApplyRuns: { startedAt: string; status: string; submitted: number; assisted: number; skipped: number; failed: number }[];
      interviews: { createdAt: string; type: string; status: string; overallScore: number | null }[];
      aiUsage30: Dict;
      resumes: number;
      recentActions: { action: string; createdAt: string }[];
    }>(`/api/admin/insights/candidates/${c.userId}`);
    if (!r.ok) return setError(r.error);
    const d = r.data!;
    setDetail({
      title: `${c.name} · ${c.email}`,
      body: (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Plan" value={c.plan === "FREE" ? "Free" : label(c.plan)} hint={c.planComplimentary ? "Complimentary" : d.user.subscription?.currentPeriodEnd ? `Renews ${fmtDate(d.user.subscription.currentPeriodEnd)}` : undefined} />
            <Stat label="Applications" value={c.applications} hint={`${c.applications30} in 30 days`} />
            <Stat label="Auto-applied" value={c.autoApplied} />
            <Stat label="Resumes" value={d.resumes} />
          </div>
          <p className="text-muted-foreground">
            Add-ons: {d.user.addOnSubscriptions.filter((a) => a.status === "ACTIVE").map((a) => ADDON_LABEL[a.addOn]).join(", ") || "none"} · Profile
            visibility: {d.user.candidateProfile ? label(d.user.candidateProfile.visibility) : "—"} · Readiness score: {d.user.candidateProfile?.careerReadinessScore ?? "—"}
          </p>
          <Section title="Recent applications">
            {d.applications.length ? d.applications.map((a) => <Row key={a.id} left={`${a.title} · ${a.company}`} right={`${label(a.status)} · ${label(a.source)} · ${fmtDate(a.appliedAt)}`} />) : <Empty />}
          </Section>
          <Section title="Auto Apply runs">
            {d.autoApplyRuns.length ? d.autoApplyRuns.map((r, i) => <Row key={i} left={when(r.startedAt)} right={`${r.submitted} submitted · ${r.assisted} assisted · ${r.skipped} skipped · ${r.failed} failed`} />) : <Empty />}
          </Section>
          <Section title="Interview AI sessions">
            {d.interviews.length ? d.interviews.map((s, i) => <Row key={i} left={`${label(s.type)} · ${label(s.status)}`} right={`${s.overallScore ?? "—"} · ${fmtDate(s.createdAt)}`} />) : <Empty />}
          </Section>
          <Section title="AI usage (30 days)"><DictList data={d.aiUsage30} /></Section>
          <Section title="Sign-ins and connected browsers">
            {d.user.sessions.map((s, i) => <Row key={`s${i}`} left="Signed in" right={when(s.createdAt)} />)}
            {d.user.extensionSessions.map((s, i) => <Row key={`e${i}`} left={`Extension · ${s.deviceLabel ?? "browser"}`} right={`last seen ${when(s.lastSeenAt)}`} />)}
            {!d.user.sessions.length && !d.user.extensionSessions.length && <Empty />}
          </Section>
          <Section title="Payments">
            {d.user.payments.length ? d.user.payments.map((p, i) => <Row key={i} left={`${p.description ?? "Payment"} · ${fmtDate(p.createdAt)}`} right={`${usd(p.amount)} · ${p.status}`} />) : <Empty />}
          </Section>
          <Section title="Recent actions">
            {d.recentActions.length ? d.recentActions.map((a, i) => <Row key={i} left={a.action} right={when(a.createdAt)} />) : <Empty />}
          </Section>
        </div>
      ),
    });
  }

  async function openCompany(c: CompanyRow) {
    const r = await api<{
      members: { role: string; name: string; email: string }[];
      events: { id: string; type: string; plan: string | null; amountCents: number | null; createdAt: string }[];
      credits: { kind: string; type: string; delta: number; note: string | null; createdAt: string }[];
      jobs: { id: string; title: string; status: string; createdAt: string; applicants: number }[];
    }>(`/api/admin/insights/enterprise/${c.companyId}`);
    if (!r.ok) return setError(r.error);
    const d = r.data!;
    setDetail({
      title: c.name,
      body: (
        <div className="space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Plan" value={c.plan ? label(c.plan) : "None"} hint={c.complimentary ? "Complimentary" : label(c.status)} />
            <Stat label="Jobs posted (30d)" value={c.jobsPosted30} />
            <Stat label="InMail (30d)" value={c.inmail30} />
            <Stat label="Revenue" value={usd(c.lifetimeRevenueCents)} />
          </div>
          <Section title="Team">{d.members.map((m) => <Row key={m.email} left={`${m.name} · ${m.email}`} right={label(m.role)} />)}</Section>
          <Section title="Jobs">{d.jobs.length ? d.jobs.map((j) => <Row key={j.id} left={`${j.title} · ${label(j.status)}`} right={`${j.applicants} applicants · ${fmtDate(j.createdAt)}`} />) : <Empty />}</Section>
          <Section title="Subscription history">
            {d.events.length ? d.events.map((e) => <Row key={e.id} left={`${label(e.type)}${e.plan ? ` · ${label(e.plan)}` : ""}`} right={`${e.amountCents != null ? `${usd(e.amountCents)} · ` : ""}${when(e.createdAt)}`} />) : <Empty />}
          </Section>
          <Section title="Credit activity">
            {d.credits.length ? d.credits.map((t, i) => <Row key={i} left={`${label(t.kind)} · ${label(t.type)}${t.note ? ` · ${t.note}` : ""}`} right={`${t.delta > 0 ? "+" : ""}${t.delta} · ${when(t.createdAt)}`} />) : <Empty />}
          </Section>
        </div>
      ),
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Platform Insights</h1>
      <p className="mb-4 text-sm text-muted-foreground">Job seekers and recruiting companies: plans, add-ons, usage and recent activity. Opening a person or company is recorded in the audit log.</p>
      {error && <ErrorBanner message={error} />}
      <div className="mb-5 inline-flex rounded-md bg-muted p-1">
        {([["overview", "Overview"], ["candidates", "Job seekers"], ["companies", "Companies"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tab === k ? "bg-surface-raised text-foreground shadow-sm" : "text-muted-foreground")}>
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" &&
        (!overview ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Job seekers" value={overview.users.byRole.CANDIDATE ?? 0} hint={`${overview.users.new7} new users this week`} />
              <Stat label="Employers" value={(overview.users.byRole.EMPLOYER ?? 0) + (overview.users.byRole.COMPANY_ADMIN ?? 0)} />
              <Stat label="Active this week" value={overview.users.active7} hint="signed in" />
              <Stat label="Revenue (30 days)" value={usd(overview.revenue30.cents)} hint={`${overview.revenue30.payments} payments`} />
              <Stat label="Applications (7d)" value={overview.candidates.applications7} />
              <Stat label="Auto-applied (7d)" value={overview.candidates.autoApplySubmitted7} hint={`${overview.candidates.autoApplyRuns7} runs · ${overview.candidates.autoApplyFailed7} failed`} />
              <Stat label="Interviews (7d)" value={overview.candidates.interviews7} />
              <Stat label="Recruiter InMail (30d)" value={overview.enterprise.inmail30} hint={`${overview.enterprise.unlocks30} resumes unlocked`} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardTitle className="text-base">Job seeker plans</CardTitle></CardHeader><CardContent><DictList data={overview.candidates.plans} empty="No paid plans" /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Add-ons</CardTitle></CardHeader><CardContent><DictList data={overview.candidates.addOns} empty="No add-ons" /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Recruiter Suite</CardTitle></CardHeader><CardContent><DictList data={{ ...overview.enterprise.byStatus }} empty="No companies yet" /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Applications by source (7d)</CardTitle></CardHeader><CardContent><DictList data={overview.candidates.applicationsBySource7} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">AI usage by feature (7d)</CardTitle></CardHeader><CardContent><DictList data={overview.candidates.aiUsage7} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Recruiter activity (30d)</CardTitle></CardHeader><CardContent>
                <DictList data={{ "Jobs posted": overview.enterprise.jobsPosted30, "AI screenings": overview.enterprise.screenings30, "Resumes unlocked": overview.enterprise.unlocks30, InMail: overview.enterprise.inmail30 }} />
              </CardContent></Card>
            </div>
          </div>
        ))}

      {tab === "candidates" && (
        <>
          <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); loadCandidates(1); }}>
            <Input placeholder="Name or email" value={cq} onChange={(e) => setCq(e.target.value)} />
            <select aria-label="Filter" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground" value={cfilter} onChange={(e) => setCfilter(e.target.value)}>
              <option value="">Everyone</option>
              <option value="paid">On a paid plan</option>
              <option value="addons">With add-ons</option>
              <option value="extension">Extension connected</option>
            </select>
            <Button type="submit"><Search className="h-4 w-4" /> Search</Button>
          </form>
          {!cands ? (
            <Spinner />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">{cands.total} job seekers</p>
              <div className="space-y-2">
                {cands.candidates.map((c) => (
                  <button key={c.userId} type="button" className="block w-full text-left" onClick={() => openCandidate(c)}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{c.name} <span className="font-normal text-muted-foreground">· {c.email}</span></p>
                          <p className="truncate text-xs text-muted-foreground">{c.title ?? "—"} · joined {fmtDate(c.joined)} · last active {c.lastActive ? fmtDate(c.lastActive) : "—"}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant={c.plan === "FREE" ? "outline" : "brand"}>{c.plan === "FREE" ? "Free" : label(c.plan)}{c.planComplimentary ? " · comp" : ""}</Badge>
                            {c.addOns.map((a) => <Badge key={a} variant="success">{ADDON_LABEL[a]}</Badge>)}
                            {c.extensionConnected && <Badge variant="outline">Extension</Badge>}
                            {c.status !== "ACTIVE" && <Badge variant="destructive">{label(c.status)}</Badge>}
                          </div>
                        </div>
                        <div className="grid shrink-0 grid-cols-4 gap-3 text-center text-xs text-muted-foreground">
                          <div><p className="text-base font-semibold text-foreground">{c.applications}</p>applied</div>
                          <div><p className="text-base font-semibold text-foreground">{c.autoApplied}</p>auto</div>
                          <div><p className="text-base font-semibold text-foreground">{c.interviews}</p>interviews</div>
                          <div><p className="text-base font-semibold text-foreground">{c.aiUses30}</p>AI (30d)</div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
              {cands.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" disabled={cands.page <= 1} onClick={() => loadCandidates(cands.page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {cands.page} of {cands.totalPages}</span>
                  <Button size="sm" variant="outline" disabled={cands.page >= cands.totalPages} onClick={() => loadCandidates(cands.page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "companies" && (
        <>
          <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); loadCompanies(); }}>
            <Input placeholder="Company name" value={eq} onChange={(e) => setEq(e.target.value)} />
            <Button type="submit"><Search className="h-4 w-4" /> Search</Button>
          </form>
          {!companies ? (
            <Spinner />
          ) : companies.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No companies yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {companies.map((c) => (
                <button key={c.companyId} type="button" className="block w-full text-left" onClick={() => openCompany(c)}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{c.name} <span className="font-normal text-muted-foreground">{c.owner ? `· ${c.owner}` : ""}</span></p>
                        <p className="text-xs text-muted-foreground">
                          {c.members} member{c.members === 1 ? "" : "s"} · {c.openJobs} open jobs
                          {c.status === "TRIAL" && c.trialEndsAt ? ` · trial ends ${fmtDate(c.trialEndsAt)}` : ""}
                          {c.renewsAt && !c.complimentary ? ` · renews ${fmtDate(c.renewsAt)}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant={c.plan && c.status === "ACTIVE" ? "brand" : "outline"}>{c.plan ? label(c.plan) : "No plan"} · {c.complimentary ? "Complimentary" : label(c.status)}</Badge>
                        </div>
                      </div>
                      <div className="grid shrink-0 grid-cols-4 gap-3 text-center text-xs text-muted-foreground">
                        <div><p className="text-base font-semibold text-foreground">{c.jobsPosted30}</p>jobs (30d)</div>
                        <div><p className="text-base font-semibold text-foreground">{c.unlocks30}</p>unlocks</div>
                        <div><p className="text-base font-semibold text-foreground">{c.inmail30}</p>InMail</div>
                        <div><p className="text-base font-semibold text-foreground">{usd(c.lifetimeRevenueCents)}</p>revenue</div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title ?? ""} wide>
        {detail?.body}
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-medium text-foreground">{title}</p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex flex-col justify-between gap-0.5 py-1.5 sm:flex-row sm:gap-3">
      <span className="min-w-0 truncate text-foreground">{left}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{right}</span>
    </div>
  );
}
function Empty() {
  return <p className="py-1.5 text-muted-foreground">Nothing yet.</p>;
}
