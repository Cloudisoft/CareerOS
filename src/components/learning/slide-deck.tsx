"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import type { Slide } from "@/lib/learning/slide-types";
import { cn } from "@/lib/utils";

const CALLOUT_STYLES: Record<NonNullable<Extract<Slide, { kind: "callout" }>["tone"]>, { icon: typeof Lightbulb; classes: string }> = {
  tip: { icon: Lightbulb, classes: "border-primary/30 bg-primary/10 text-foreground" },
  warning: { icon: AlertTriangle, classes: "border-destructive/30 bg-destructive/10 text-foreground" },
  insight: { icon: Sparkles, classes: "border-sky-500/30 bg-sky-500/10 text-foreground" },
};

function SlideBody({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {slide.heading}
          </h2>
          {slide.subheading && (
            <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground">{slide.subheading}</p>
          )}
          <div className="mt-6 h-1 w-16 rounded-full bg-brand-gradient" aria-hidden />
        </div>
      );

    case "text":
      return (
        <div>
          <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
          <div className="mt-4 space-y-3">
            {slide.body.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      );

    case "bullets":
      return (
        <div>
          <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
          {slide.intro && <p className="mt-2 text-[15px] text-muted-foreground">{slide.intro}</p>}
          <ul className="mt-4 space-y-2.5">
            {slide.bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gradient" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "example":
      return (
        <div>
          <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
          {slide.body && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{slide.body}</p>}
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface-raised p-4 text-sm">
            <code className="font-mono text-foreground">{slide.code}</code>
          </pre>
        </div>
      );

    case "callout": {
      const style = CALLOUT_STYLES[slide.tone ?? "tip"];
      const Icon = style.icon;
      return (
        <div className={cn("rounded-lg border p-5", style.classes)}>
          <div className="flex items-center gap-2 font-semibold">
            <Icon className="h-4 w-4 shrink-0" />
            {slide.heading}
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{slide.body}</p>
        </div>
      );
    }

    case "summary":
      return (
        <div>
          <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
          <ul className="mt-4 space-y-2.5">
            {slide.bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export function SlideDeck({ slides, onFinish }: { slides: Slide[]; onFinish?: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  function go(next: number) {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
    if (next === slides.length - 1) onFinish?.();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  if (slides.length === 0) {
    return <p className="text-sm text-muted-foreground">This lesson has no slides yet.</p>;
  }

  const slide = slides[index];

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i === index ? "bg-brand-gradient" : i < index ? "bg-primary/30" : "bg-border"
            )}
          />
        ))}
      </div>

      <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={slide.kind === "title" ? "flex min-h-[220px] items-center justify-center" : ""}
          >
            <SlideBody slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground">
          Slide {index + 1} of {slides.length}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary disabled:opacity-30"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
