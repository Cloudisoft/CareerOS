import type { Metadata } from "next";
import {
  Search,
  Target,
  FileText,
  Send,
  Bot,
  MessageSquare,
  GraduationCap,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything Career OS connects: discovery, matching, resumes, applications, AI, interviews, learning, and network — in one system.",
};

const SECTIONS = [
  {
    icon: Search,
    title: "Discover & Match",
    body: "Career OS continuously scans the market against your Career Profile — title, skills, experience, location, and salary preferences — and scores every job with a transparent match percentage, showing exactly which skills align and which are gaps.",
  },
  {
    icon: FileText,
    title: "Resume Studio & ATS Scanner",
    body: "Build multiple resumes from one source of truth, tailor them per job in seconds, and run them through an ATS scanner that checks keyword coverage, formatting, and seniority alignment against the job description — before you ever apply.",
  },
  {
    icon: Send,
    title: "Manual, Assisted & Auto Apply",
    body: "Apply your way. Manual apply for full control, Assisted Apply to pre-fill every field from your profile for a quick review, or Auto Apply to let Career OS handle qualified, repetitive applications within limits and safety gates you set.",
  },
  {
    icon: Bot,
    title: "Job GPT",
    body: "A career copilot that has read your whole profile — resume, applications, interviews, and learning history — so it can answer real questions: why you're not converting interviews, which jobs to prioritize, or how to phrase a recruiter message.",
  },
  {
    icon: MessageSquare,
    title: "Interview AI",
    body: "Practice technical, behavioral, managerial, and system-design interviews tailored to a specific job description. Get scored on technical depth, communication, structure, and specificity — and track your readiness over time.",
  },
  {
    icon: GraduationCap,
    title: "Learning Hub",
    body: "Courses across engineering, product, business, and career skills — connected directly to the skill gaps Career OS identifies in your matches, so you're always learning the thing that unlocks your next opportunity.",
  },
  {
    icon: Target,
    title: "Career Readiness",
    body: "One score, calculated from your real data — resume strength, profile completeness, skills, interview performance, and job match quality — so you always know what to work on next.",
  },
  {
    icon: Users,
    title: "Career Circles",
    body: "A professional network built for career movement: connect with peers and recruiters, follow companies, and message the people who can actually open a door for you.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Every part of your career, <span className="brand-gradient-text">connected</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Career OS isn't ten disconnected tools wearing one login. It's a single Career Profile
          that powers matching, resumes, applications, AI, interviews, and learning together.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
