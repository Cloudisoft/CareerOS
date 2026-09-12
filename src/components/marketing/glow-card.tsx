import type { LucideIcon } from "lucide-react";

interface GlowCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** Icon-led feature card with the hover glow/gradient-top-line treatment used across marketing pages. */
export function GlowCard({ icon: Icon, title, body }: GlowCardProps) {
  return (
    <div className="group relative h-full overflow-hidden rounded-lg border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(239,134,45,0.08)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "linear-gradient(90deg, transparent, #EF862D, #DF4C2C, transparent)" }}
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
