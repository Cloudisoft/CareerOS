import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarCheck,
  Cpu,
  FileText,
  Globe2,
  GraduationCap,
  Laptop,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Sprout,
  Trophy,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCompanyForUser, getCompanyDashboardStats } from "@/lib/company/service";
import { getEntitlements } from "@/lib/billing/entitlements";
import { enrichCompanyBrands } from "@/lib/company/branding";
import { applicationSummary, companiesHiring, followUpsDue, recommendedJobs } from "@/lib/dashboard/candidate";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { JobRowLink } from "@/components/jobs/job-row";
import { cn } from "@/lib/utils";

type ProfileWithCounts = {
  onboardingCompletedAt: Date | null;
  _count: { skills: number; experiences: number; resumes: number };
} | null;

function getNextBestAction(profile: ProfileWithCounts): { message: string; href: string; cta: string } {
  if (!profile?.onboardingCompletedAt) {
    return { message: "Finish your Career Profile so Career OS can match you to jobs.", href: "/onboarding", cta: "Complete profile" };
  }
  if (profile._count.resumes === 0) {
    return { message: "Add a resume — it powers Quick apply, Auto Apply and your match scores.", href: "/resume-studio", cta: "Add resume" };
  }
  if (profile._count.skills < 5) {
    return {
      message: `You've added ${profile._count.skills} skill${profile._count.skills === 1 ? "" : "s"}. A few more sharpens your matches.`,
      href: "/profile",
      cta: "Add skills",
    };
  }
  if (profile._count.experiences === 0) {
    return { message: "Add your work experience so matches reflect your background.", href: "/profile", cta: "Add experience" };
  }
  return { message: "Your profile is in great shape. Practise an interview to raise your readiness.", href: "/interview-ai", cta: "Practise now" };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const SUGGESTIONS = [
  { label: "Remote", href: "/jobs?workplaceType=REMOTE", icon: Laptop },
  { label: "No experience required", href: "/jobs?careerLevel=ENTRY", icon: Sprout },
  { label: "Internships", href: "/jobs?employmentType=INTERNSHIP", icon: GraduationCap },
  { label: "Full-time", href: "/jobs?employmentType=FULL_TIME", icon: Briefcase },
  { label: "Hybrid", href: "/jobs?workplaceType=HYBRID", icon: Globe2 },
];

const TOOLS = [
  { label: "Job GPT", hint: "Ask anything about your search", href: "/job-gpt", icon: Bot },
  { label: "Resume", hint: "Tailor an ATS-ready resume", href: "/resume-studio", icon: FileText },
  { label: "Auto Apply", hint: "Apply while you sleep", href: "/auto-apply", icon: Send },
  { label: "Interview", hint: "Practise with AI feedback", href: "/interview-ai", icon: MessageSquare },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  if (user.role === "PLATFORM_ADMIN") redirect("/admin");
  if (user.role !== "CANDIDATE") return <EmployerHome userId={user.id} firstName={user.firstName} />;

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { skills: true, experiences: true, resumes: true } } },
  });
  const profileId = profile?.id ?? null;
  const [entitlements, jobs, companies, pipeline, followUps] = await Promise.all([
    getEntitlements(user.id),
    recommendedJobs(profileId),
    companiesHiring(),
    applicationSummary(profileId),
    followUpsDue(profileId),
  ]);
  const next = getNextBestAction(profile);
  enrichCompanyBrands([...companies.filter((c) => !c.logoUrl).map((c) => c.id), ...jobs.filter((j) => !j.company.logoUrl).map((j) => j.company.id)]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Search first: the fastest way into the job market. */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(239,134,45,0.28), transparent 70%)" }}
        />
        <p className="relative text-sm font-medium text-muted-foreground">
          {greeting()}, {user.firstName}
        </p>
        <h1 className="relative mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">What do you want to do next?</h1>
        <form action="/jobs" className="relative mt-5 flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <label htmlFor="home-search" className="sr-only">
            Describe a job you want
          </label>
          <input
            id="home-search"
            name="q"
            placeholder="Describe a job you want"
            className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button type="submit" className="h-10 shrink-0 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Search
          </button>
        </form>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Suggested</span>
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground/85 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <s.icon className="h-3.5 w-3.5 text-primary" />
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Your applications" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Applied", value: pipeline.applied, icon: Send, href: "/applications" },
          { label: "Interviewing", value: pipeline.interviewing, icon: CalendarCheck, href: "/applications" },
          { label: "Offers", value: pipeline.offers, icon: Trophy, href: "/applications" },
          { label: "Saved jobs", value: pipeline.saved, icon: Briefcase, href: "/jobs?saved=1" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-xl font-semibold leading-none text-foreground">{s.value}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{s.label}</span>
            </span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="jobs-for-you">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 id="jobs-for-you" className="text-lg font-semibold text-foreground">
                Jobs for you
              </h2>
              <p className="text-sm text-muted-foreground">Picked from your profile, newest roles included.</p>
            </div>
            <Link href="/jobs" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobs.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {jobs.map((job) => (
                <JobRowLink key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              New roles are on their way. <Link href="/jobs" className="font-medium text-primary hover:underline">Search all jobs</Link>
            </div>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">AI tools</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TOOLS.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
              >
                <t.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-semibold text-foreground">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-4">
              <CircularProgress value={profile?.careerReadinessScore ?? 0} size={84} />
              <div>
                <p className="font-semibold text-foreground">Career readiness</p>
                <p className="mt-0.5 text-xs text-muted-foreground">From your resume, profile, skills, interviews and matches.</p>
              </div>
            </div>
            {entitlements.careerAnalytics ? (
              <div className="mt-4 space-y-2.5">
                {(
                  [
                    ["Resume", profile?.resumeScore ?? 0],
                    ["Profile", profile?.profileScore ?? 0],
                    ["Skills", profile?.skillsScore ?? 0],
                    ["Interview", profile?.interviewScore ?? 0],
                    ["Job match", profile?.jobMatchScore ?? 0],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{val}</span>
                    </div>
                    <Progress value={val} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <Link href="/pricing" className="mt-3 block text-xs font-medium text-primary hover:underline">
                Upgrade to see the full breakdown
              </Link>
            )}
            <div className="mt-4 rounded-lg bg-surface-raised p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" /> Next step
              </p>
              <p className="mt-1 text-sm text-foreground">{next.message}</p>
              <Link href={next.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary">
                {next.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <Link
            href="/ai-work"
            className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40"
          >
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <Cpu className="h-4 w-4 text-primary" /> Get paid to train AI
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Remote, hourly AI-training work with micro1, using the skills you already have.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary">
              See AI roles <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {followUps.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="font-semibold text-foreground">Follow-ups due</p>
              <p className="mt-0.5 text-xs text-muted-foreground">A short, friendly note a week after applying gets noticed.</p>
              <ul className="mt-3 space-y-2">
                {followUps.map((f) => (
                  <li key={f.id} className="flex items-center gap-3">
                    <CompanyLogo name={f.job.company.name} logoUrl={f.job.company.logoUrl} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{f.job.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {f.job.company.name} · {f.days} days without a reply
                      </span>
                    </span>
                    <Link
                      href={`/outreach?job=${encodeURIComponent(f.job.title)}`}
                      className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-raised"
                    >
                      Draft
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {companies.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Companies hiring</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <ul className="mt-3 space-y-1">
                {companies.map((c) => (
                  <li key={c.id}>
                    <Link href={`/company/${c.slug}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-raised">
                      <CompanyLogo name={c.name} logoUrl={c.logoUrl} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.industry ?? "Hiring now"}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {c.openJobs} {c.openJobs === 1 ? "job" : "jobs"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

async function EmployerHome({ userId, firstName }: { userId: string; firstName: string }) {
  const company = await getCompanyForUser(userId);
  if (!company) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
        <p className="text-sm font-medium text-muted-foreground">
          {greeting()}, {firstName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Set up your company to start hiring</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create your company profile to post jobs, publish to Career OS Careers and search talent.</p>
        <Link href="/employer/company" className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Set up your company
        </Link>
      </div>
    );
  }

  const [stats, recent] = await Promise.all([
    getCompanyDashboardStats(company.id),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      orderBy: { appliedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        job: { select: { id: true, title: true } },
        profile: { select: { headline: true, user: { select: { firstName: true, lastName: true } } } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {greeting()}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{company.name} on Career OS</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/employer/jobs/new" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Post a job
          </Link>
          <Link href="/employer/talent" className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-raised">
            Search talent
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open jobs", value: stats.openJobs, icon: Briefcase, href: "/employer/jobs" },
          { label: "Total applications", value: stats.totalApplications, icon: FileText, href: "/employer/jobs" },
          { label: "New this week", value: stats.newApplicationsThisWeek, icon: Sparkles, href: "/employer/jobs" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-2xl font-semibold leading-none text-foreground">{s.value}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{s.label}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Latest applicants</h2>
          <Link href="/employer/enterprise/pipeline" className="text-sm font-medium text-primary hover:underline">
            Open pipeline
          </Link>
        </div>
        {recent.length ? (
          <ul className="divide-y divide-border">
            {recent.map((a) => (
              <li key={a.id}>
                <Link href={`/employer/jobs/${a.job.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-raised/50">
                  <CompanyLogo name={`${a.profile.user.firstName} ${a.profile.user.lastName}`} size={36} className="rounded-full" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {a.profile.user.firstName} {a.profile.user.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.job.title}
                      {a.profile.headline ? ` · ${a.profile.headline}` : ""}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", a.status === "APPLIED" ? "bg-primary/10 text-primary" : "bg-surface-raised text-muted-foreground")}>
                    {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No applications yet. Post a job to start receiving applicants.</p>
        )}
      </section>
    </div>
  );
}
