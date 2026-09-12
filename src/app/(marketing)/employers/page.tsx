import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, LineChart, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { GlowCard } from "@/components/marketing/glow-card";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "For Employers",
  description: "Publish jobs, search qualified talent, and manage your hiring pipeline on Career OS.",
};

const FEATURES = [
  {
    icon: Search,
    title: "AI candidate matching",
    body: "Every application and every candidate in Talent Search is scored against your job requirements, so your pipeline surfaces fit — not just volume.",
  },
  {
    icon: Users,
    title: "Talent Search",
    body: "Search candidates by title, skills, experience, location, and availability, respecting each candidate's visibility preferences.",
  },
  {
    icon: LineChart,
    title: "Hiring pipeline",
    body: "Track every job from draft to close, and every candidate from applied to offer, with a real Kanban view your whole team can use.",
  },
  {
    icon: MessageSquare,
    title: "Direct messaging",
    body: "Reach out to candidates directly through Career OS once they've made themselves available to recruiters.",
  },
];

export default function EmployersPage() {
  return (
    <>
      <PageHero
        eyebrow="For employers"
        title="Hire from a pool that's ready to move"
        description="Candidates on Career OS keep an active, structured Career Profile — not a stale resume upload. Publish jobs, search talent, and manage your pipeline in one place."
        actions={
          <Button asChild size="lg" className="group">
            <Link href="/signup">
              Create an employer account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <RevealGroup className="grid gap-6 sm:grid-cols-2" stagger={0.08}>
          {FEATURES.map((feature) => (
            <RevealItem key={feature.title}>
              <GlowCard icon={feature.icon} title={feature.title} body={feature.body} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </>
  );
}
