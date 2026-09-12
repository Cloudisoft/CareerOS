import { Search, Target, Send, ClipboardCheck } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";

const STEPS = [
  {
    icon: Search,
    title: "Discovers",
    body: "Aggregates roles from Adzuna, JSearch, and employer postings on Career OS — deduplicated and refreshed continuously.",
  },
  {
    icon: Target,
    title: "Scores",
    body: "Every role is matched against your Career Profile — skills, experience, location, salary — with a transparent percentage, not a black box.",
  },
  {
    icon: Send,
    title: "Applies",
    body: "Manual, Assisted, or fully Auto Apply — within the match threshold, limits, and safety gates you set for your plan.",
  },
  {
    icon: ClipboardCheck,
    title: "Logs everything",
    body: "Every action lands in Applications with a timestamp, so you always know exactly what was submitted and when.",
  },
];

export function AutoApplySteps() {
  return (
    <RevealGroup className="grid gap-6 sm:grid-cols-2" stagger={0.08}>
      {STEPS.map((step, i) => (
        <RevealItem key={step.title}>
          <div className="group relative h-full overflow-hidden rounded-lg border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40">
            <span className="text-3xl font-bold text-border transition-colors group-hover:text-primary/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <step.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/** Illustrative single-run mock of the Auto Apply agent — not a live or aggregate stat. */
export function AutoApplyAgentCard() {
  return (
    <div className="brand-glow rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white">
            <Send className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Auto Apply</p>
            <p className="flex items-center gap-1.5 text-xs text-success">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
              Running for you
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Sample match</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">Senior Backend Engineer</p>
            <p className="text-xs text-muted-foreground">Remote · $150K–$180K</p>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            91% match
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Scanning job boards</span>
          <span className="text-foreground">Done</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full rounded-full bg-brand-gradient" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span>Tailoring resume &amp; cover letter</span>
          <span className="text-foreground">Done</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full rounded-full bg-brand-gradient" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span>Awaiting safety-gate review</span>
          <span className="text-primary">Needs you</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-brand-gradient" />
        </div>
      </div>
    </div>
  );
}
