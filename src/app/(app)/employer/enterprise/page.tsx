"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, useEnterprise, Stat, ErrorBanner, fmtDate, usd, Spinner } from "@/components/enterprise/shared";

interface Stats {
  openJobs: number;
  applicants: number;
  applicantsThisWeek: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  screenings: { total: number; HIGHLY_QUALIFIED: number; QUALIFIED: number; POTENTIAL_MATCH: number; NOT_SUITABLE: number };
  inmail: { sent: number; replied: number };
  activeBoosts: number;
  resumesUnlocked: number;
}

function Meter({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {total ? `${Math.max(0, total - used)} of ${total} left` : "Not included"}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

export default function EnterpriseOverviewPage() {
  const { overview, refresh } = useEnterprise();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api<Stats>("/api/enterprise/stats").then((r) => (r.ok ? setStats(r.data) : setError(r.error)));
  }, []);

  if (!overview) return null;
  const o = overview;
  const paid = o.plan && (o.status === "ACTIVE" || (o.status === "CANCELLED" && o.period.end && new Date(o.period.end) > new Date()));

  async function startTrial() {
    setStarting(true);
    setError(null);
    const res = await api("/api/enterprise/trial", { method: "POST" });
    setStarting(false);
    if (!res.ok) return setError(res.error);
    await refresh();
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}

      {!paid && o.status !== "TRIAL" && (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {o.trial.eligible ? "Try the Recruiter Suite free for 3 days" : "Your company is on the free tier"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {o.trial.eligible
                  ? "Post 1 job a day during the trial — no card needed. Resume search, AI screening, InMail and boosts come with a paid plan."
                  : `Subscribe to post jobs, search resumes, screen with AI and send InMail.${o.intro.eligible ? ` Your first month is ${usd(o.intro.priceCents)}.` : ""} All your data is kept.`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {o.trial.eligible && o.canManageBilling && (
                <Button onClick={startTrial} disabled={starting}>
                  {starting ? "Starting…" : "Start free trial"}
                </Button>
              )}
              <Button asChild variant={o.trial.eligible ? "outline" : "primary"}>
                <Link href="/employer/enterprise/billing">
                  <Sparkles className="h-4 w-4" /> See plans
                </Link>
              </Button>
            </div>
            {o.trial.eligible && !o.canManageBilling && (
              <p className="text-xs text-muted-foreground">Ask your company owner or an admin to start the trial.</p>
            )}
          </CardContent>
        </Card>
      )}

      {o.status === "TRIAL" && (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Free trial · ends {fmtDate(o.trial.endsAt)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can post 1 job a day. When the trial ends you move to the free tier automatically — nothing is deleted.
              </p>
            </div>
            <Button asChild>
              <Link href="/employer/enterprise/billing">Upgrade now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Allowances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Meter label="Jobs posted today" used={o.jobs.postedToday} total={o.jobs.perDay} />
            <Meter label="Resume unlocks this period" used={o.credits.resume.used} total={o.credits.resume.granted} />
            <Meter label="InMail credits this period" used={o.credits.inmail.used} total={o.credits.inmail.granted} />
            {(o.entitlements.freePostBoosts > 0 || o.entitlements.freeCampaignBoosts > 0) && (
              <>
                <Meter label="Free post boosts" used={o.credits.postBoost.used} total={o.credits.postBoost.granted} />
                <Meter label="Free campaign boosts" used={o.credits.campaignBoost.used} total={o.credits.campaignBoost.granted} />
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Job quota resets at midnight UTC.{" "}
              {o.period.end
                ? `Credits renew with your billing period on ${fmtDate(o.period.end)}.`
                : o.complimentary
                  ? "Credits reset on the 1st of each month (UTC)."
                  : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/employer/jobs/new">
                <Briefcase className="h-4 w-4" /> Post a job
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/employer/enterprise/candidates">Search resumes</Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/employer/enterprise/screening">Screen a candidate</Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/employer/enterprise/inmail">Send InMail</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {!stats ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Open jobs" value={stats.openJobs} />
          <Stat label="Applicants" value={stats.applicants} hint={`${stats.applicantsThisWeek} this week`} />
          <Stat label="Shortlisted" value={stats.shortlisted} hint={`${stats.interviews} interviewing`} />
          <Stat label="Offers" value={stats.offers} />
          <Stat
            label="AI screenings"
            value={stats.screenings.total}
            hint={`${stats.screenings.HIGHLY_QUALIFIED} highly qualified`}
          />
          <Stat label="Resumes unlocked" value={stats.resumesUnlocked} />
          <Stat label="InMail sent" value={stats.inmail.sent} hint={`${stats.inmail.replied} replied`} />
          <Stat label="Active boosts" value={stats.activeBoosts} />
        </div>
      )}
    </div>
  );
}
