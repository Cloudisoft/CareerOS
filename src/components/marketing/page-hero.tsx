import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Badge } from "@/components/ui/badge";

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  actions?: React.ReactNode;
}

export function PageHero({ eyebrow, title, description, align = "center", actions }: PageHeroProps) {
  const isCenter = align === "center";
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.1]" />
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(239,134,45,0.16), transparent 70%)" }}
      />
      <div className={`relative mx-auto max-w-5xl px-6 py-20 ${isCenter ? "text-center" : ""}`}>
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${isCenter ? "mb-8" : "mb-6"}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <Reveal>
          {eyebrow && (
            <Badge variant="brand" className={isCenter ? "mx-auto" : ""}>
              {eyebrow}
            </Badge>
          )}
          <h1 className={`text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl ${eyebrow ? "mt-6" : ""}`}>
            {title}
          </h1>
          {description && (
            <p className={`mt-4 text-balance text-lg text-muted-foreground ${isCenter ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
              {description}
            </p>
          )}
          {actions && <div className={`mt-8 flex gap-3 ${isCenter ? "justify-center" : ""}`}>{actions}</div>}
        </Reveal>
      </div>
    </section>
  );
}
