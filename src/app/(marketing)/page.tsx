import Link from "next/link";
import {
  Search,
  Target,
  FileText,
  Send,
  MessageSquare,
  GraduationCap,
  Users,
  TrendingUp,
  Sparkles,
  Bot,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { ResumeShowcase } from "@/components/marketing/resume-showcase";
import { HeroExplode } from "@/components/marketing/hero-explode";
import { AutoApplySteps, AutoApplyAgentCard } from "@/components/marketing/auto-apply-showcase";

const FLOW = [
  { icon: Search, label: "Discover" },
  { icon: Target, label: "Match" },
  { icon: FileText, label: "Resume" },
  { icon: Send, label: "Apply" },
  { icon: MessageSquare, label: "Interview" },
  { icon: GraduationCap, label: "Learn" },
  { icon: Users, label: "Connect" },
  { icon: TrendingUp, label: "Grow" },
];

const PILLARS = [
  {
    icon: Bot,
    title: "Job GPT",
    description:
      "Your AI career copilot. It knows your profile, resume, and history — ask it anything from \"why am I not getting interviews\" to \"tailor my resume for this role.\"",
    big: true,
  },
  {
    icon: Sparkles,
    title: "Auto Apply",
    description:
      "Set your preferences once. Career OS discovers, matches, and applies to qualified roles on your behalf, with full transparency and human review when it matters.",
  },
  {
    icon: FileText,
    title: "Resume Studio & ATS Scanner",
    description:
      "Build resumes that pass the bots and win over humans. Real ATS scoring, keyword gaps, and AI rewrites grounded in your actual experience.",
  },
  {
    icon: MessageSquare,
    title: "Interview AI",
    description:
      "Practice technical, behavioral, and system-design interviews with an AI that adapts to your answers and scores you on substance, not vibes.",
  },
  {
    icon: GraduationCap,
    title: "Learning Hub",
    description:
      "Close the exact skill gaps standing between you and your next role, with courses tied directly to your Career Profile.",
  },
  {
    icon: Users,
    title: "Career Circles",
    description:
      "Connect with people who can actually move your career forward — peers, recruiters, and the companies you're targeting.",
  },
];

const GUARANTEES = [
  {
    icon: Lock,
    title: "Never bypasses security",
    description: "CAPTCHAs, MFA, and third-party logins always pause and hand control back to you.",
  },
  {
    icon: CheckCircle2,
    title: "Never fabricates",
    description:
      "No invented facts about your employment, education, visa status, or salary history — ever.",
  },
  {
    icon: Eye,
    title: "Full transparency",
    description: "Every application is logged and verifiable. Nothing is reported \"submitted\" without proof.",
  },
];

const SKILL_TAGS = [
  "Software Engineering",
  "Product Management",
  "Data Science",
  "Cloud & DevOps",
  "UX Design",
  "Cybersecurity",
  "Sales",
  "Digital Marketing",
  "Project Management",
  "Machine Learning",
  "SQL & Databases",
  "Financial Analysis",
];

export default function MarketingHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.15]" />
        <div
          className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] animate-float rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(239,134,45,0.22), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-24 h-[420px] w-[420px] animate-float rounded-full blur-3xl"
          style={{ animationDelay: "2.5s", background: "radial-gradient(circle, rgba(223,76,44,0.18), transparent 70%)" }}
        />

        <HeroExplode />

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <Reveal>
            <Badge variant="brand" className="mx-auto gap-1.5 py-1">
              <Sparkles className="h-3 w-3" />
              The Career Operating System
            </Badge>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Your career.
              <br />
              <span className="brand-gradient-text">One operating system.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Discover opportunities, build better resumes, prepare for interviews, learn new
              skills, and connect with the people who can move your career forward.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/features">Explore Career OS</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Skill marquee */}
        <Reveal delay={0.3}>
          <div className="fade-edges-x relative overflow-hidden py-2">
            <div className="flex w-max animate-marquee gap-3">
              {[...SKILL_TAGS, ...SKILL_TAGS].map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="whitespace-nowrap rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Flow strip */}
        <Reveal delay={0.1} className="relative mx-auto mt-14 max-w-5xl px-6">
          <div className="relative flex flex-wrap items-start justify-center gap-x-1 gap-y-6">
            <div
              className="pointer-events-none absolute left-[7%] right-[7%] top-[22px] hidden h-px sm:block"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)) 10%, hsl(var(--border)) 90%, transparent)" }}
              aria-hidden
            />
            <RevealGroup className="flex flex-wrap items-start justify-center gap-x-1 gap-y-6" stagger={0.06}>
              {FLOW.map((step) => (
                <RevealItem key={step.label} className="relative flex flex-col items-center gap-2 px-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/50">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Reveal>

        {/* Product preview */}
        <Reveal delay={0.15} className="relative mx-auto mt-16 max-w-3xl px-6 pb-24">
          <div className="brand-glow overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-3 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
                app.careeros.app/dashboard
              </span>
            </div>
            <div className="p-6 text-left sm:p-8">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Career Readiness</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Calculated live from your resume, profile, skills, and interview practice.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                      ["Resume", 92],
                      ["Profile", 95],
                      ["Skills", 84],
                      ["Interview", 76],
                      ["Job Match", 91],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-lg font-semibold text-foreground">
                          <CountUp value={val as number} suffix="%" />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <CircularProgress value={87} size={140} label="Career Readiness" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Resume Studio showcase */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <Badge variant="outline">Resume Studio</Badge>
              <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
                Every resume, tailored and scored in seconds
              </h2>
              <p className="mt-4 text-muted-foreground">
                Paste a job description and Resume Studio scores your resume against it, flags the
                exact keywords it's missing, and rewrites bullets with AI — grounded in your real
                experience, never invented.
              </p>
              <Button asChild size="lg" className="group mt-8">
                <Link href="/signup">
                  Try Resume Studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={0.1}>
              <ResumeShowcase />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Auto Apply showcase */}
      <section className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mx-auto">
              Auto Apply
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
              A job search agent that shows its work
            </h2>
            <p className="mt-4 text-muted-foreground">
              Auto Apply discovers, scores, and applies within the limits you set — and pauses to
              ask you the moment anything is ambiguous.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-5 lg:items-start">
            <div className="lg:col-span-3">
              <AutoApplySteps />
            </div>
            <div className="lg:col-span-2">
              <AutoApplyAgentCard />
            </div>
          </div>
        </div>
      </section>

      {/* Product video */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mx-auto">
              See it in action
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
              Watch Career OS run the whole flow
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="brand-glow mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
            <video
              className="block h-auto w-full"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="Career OS product walkthrough"
            >
              <source src="/videos/product-demo.webm" type="video/webm" />
              <source src="/videos/product-demo.mp4" type="video/mp4" />
            </video>
          </Reveal>
        </div>
      </section>

      {/* Bento pillars */}
      <section className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              One connected system, not ten separate apps
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every part of Career OS reads from the same Career Profile, so your resume,
              applications, interview prep, and learning plan all move together.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {PILLARS.map((pillar) => (
              <RevealItem
                key={pillar.title}
                className={pillar.big ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : undefined}
              >
                <div
                  className={
                    "group relative h-full overflow-hidden rounded-lg border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(239,134,45,0.08)] " +
                    (pillar.big ? "flex flex-col justify-center" : "")
                  }
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "linear-gradient(90deg, transparent, #EF862D, #DF4C2C, transparent)" }}
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{pillar.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Guarantees */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-3xl font-bold text-foreground">
              Auto Apply that never lies to you
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              When something needs your judgment, it tells you exactly why — and waits.
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-3" stagger={0.08}>
            {GUARANTEES.map((g) => (
              <RevealItem key={g.title}>
                <div className="h-full rounded-lg border border-border bg-surface p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <g.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{g.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-16 text-center sm:px-16">
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
                  backgroundSize: "60px 60px, 90px 90px",
                }}
                aria-hidden
              />
              <div className="relative">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Ready to run your career like a system?
                </h2>
                <p className="mt-4 text-white/85">Create your Career Profile in minutes. Free to start.</p>
                <div className="mt-8 flex justify-center">
                  <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-white/90">
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
