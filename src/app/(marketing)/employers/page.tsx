import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, LineChart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Hire from a pool that's ready to move
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Candidates on Career OS keep an active, structured Career Profile — not a stale resume
          upload. Publish jobs, search talent, and manage your pipeline in one place.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/signup">Create an employer account</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
