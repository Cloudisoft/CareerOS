import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Bot, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Micro1Logo } from "@/components/marketing/micro1-logo";

export const MICRO1_URL = "https://www.micro1.ai";

const POINTS = [
  {
    icon: BadgeCheck,
    title: "Work with leading AI teams",
    body: "micro1 connects vetted engineers and domain experts with AI labs, startups and enterprises — a path to AI-era roles alongside the jobs you find on Career OS.",
  },
  {
    icon: Bot,
    title: "AI-run interviews, done right",
    body: "micro1's AI recruiter, Zara, runs structured interviews. Career OS's Interview AI helps you practise for exactly that kind of conversation.",
  },
  {
    icon: Building2,
    title: "For hiring teams",
    body: "Recruiters on Career OS's Recruiter Suite can pair their own pipeline with micro1's pre-vetted global talent when a role needs specialist experts.",
  },
];

/** Homepage partnership section, with micro1's own wordmark. */
export function Micro1Partnership() {
  return (
    <section id="micro1" aria-labelledby="micro1-heading" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Partnership</p>
            <h2 id="micro1-heading" className="mt-4 flex items-center justify-center gap-3 text-3xl font-bold text-foreground sm:text-4xl">
              Career OS <span className="text-muted-foreground">×</span>
              <a href={MICRO1_URL} target="_blank" rel="noopener" aria-label="micro1">
                <Micro1Logo className="h-7 w-auto sm:h-8" />
              </a>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Career OS is in partnership with{" "}
              <a href={MICRO1_URL} target="_blank" rel="noopener" className="font-medium text-foreground underline-offset-4 hover:underline">
                micro1
              </a>
              , the AI-powered talent platform that matches top engineers and domain experts with the companies building AI.
            </p>
          </div>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3" stagger={0.08}>
          {POINTS.map((p) => (
            <RevealItem key={p.title} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/signup?next=%2Fai-work">Get paid to train AI</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={MICRO1_URL} target="_blank" rel="noopener">
              Explore micro1 <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
