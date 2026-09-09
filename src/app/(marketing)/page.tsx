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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Badge } from "@/components/ui/badge";

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

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(239,134,45,0.12), transparent), radial-gradient(40% 40% at 80% 20%, rgba(223,76,44,0.10), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28">
          <Badge variant="brand" className="mx-auto">
            The Career Operating System
          </Badge>
          <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Your career.
            <br />
            <span className="brand-gradient-text">One operating system.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Discover opportunities, build better resumes, prepare for interviews, learn new
            skills, and connect with the people who can move your career forward.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/features">Explore Career OS</Link>
            </Button>
          </div>

          {/* Flow strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-1 gap-y-4">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="h-px w-4 shrink-0 bg-border sm:w-8" aria-hidden />
                )}
              </div>
            ))}
          </div>

          {/* Product preview */}
          <div className="brand-glow mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-surface p-6 text-left sm:p-8">
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
                      <p className="text-lg font-semibold text-foreground">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
              <CircularProgress value={87} size={140} label="Career Readiness" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              One connected system, not ten separate apps
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every part of Career OS reads from the same Career Profile, so your resume,
              applications, interview prep, and learning plan all move together.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <Card key={pillar.title} className="transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-bold text-foreground">
            Auto Apply that never lies to you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Career OS never bypasses CAPTCHAs, MFA, or logins, never fabricates an answer to a
            legal or work-authorization question, and never reports an application as submitted
            without verified confirmation. When it needs you, it tells you exactly why.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to run your career like a system?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create your Career Profile in minutes. Free to start.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
