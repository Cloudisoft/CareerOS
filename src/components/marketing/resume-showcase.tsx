import { ArrowRight, Sparkles } from "lucide-react";
import { CountUp } from "@/components/marketing/count-up";

/** Illustrative mock of a real Resume Studio + ATS Scanner session — field names match the actual scanner output (score, keyword coverage, recommendations). */
export function ResumeShowcase() {
  return (
    <div className="brand-glow overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-3 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
          app.careeros.app/resume-studio
        </span>
      </div>

      <div className="p-6 text-left sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Resume Studio · ATS Scanner
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            Senior Product Manager <span className="text-muted-foreground">· sample listing</span>
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">ATS score</span>
            <span className="font-semibold text-muted-foreground line-through">78</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-primary">94</span>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-raised p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                1
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Add missing keywords</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This listing weights <span className="text-foreground">"stakeholder alignment"</span> and{" "}
                  <span className="text-foreground">"roadmap prioritization"</span> — neither appears in your
                  current bullets.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white">
              <Sparkles className="h-3 w-3" />
              Fix with AI
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
          {[
            ["Score", 94, "%"],
            ["Keywords matched", 11, "/12"],
            ["Skills listed", 9, ""],
          ].map(([label, val, suffix]) => (
            <div key={label as string}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                <CountUp value={val as number} suffix={suffix as string} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
