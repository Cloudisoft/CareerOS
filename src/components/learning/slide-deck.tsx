"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  X,
  Wrench,
  ArrowRight,
  TerminalSquare,
  Volume2,
  Pause,
  Gauge,
} from "lucide-react";
import type { Slide } from "@/lib/learning/slide-types";
import { slideNarrationText } from "@/lib/learning/narration";
import { useLessonNarration } from "@/hooks/use-lesson-narration";
import { cn } from "@/lib/utils";

const NARRATION_RATES = [0.75, 1, 1.25, 1.5];

const CALLOUT_STYLES: Record<NonNullable<Extract<Slide, { kind: "callout" }>["tone"]>, { icon: typeof Lightbulb; classes: string }> = {
  tip: { icon: Lightbulb, classes: "border-primary/30 bg-primary/10 text-foreground" },
  warning: { icon: AlertTriangle, classes: "border-destructive/30 bg-destructive/10 text-foreground" },
  insight: { icon: Sparkles, classes: "border-sky-500/30 bg-sky-500/10 text-foreground" },
};

function QuizSlide({ slide }: { slide: Extract<Slide, { kind: "quiz" }> }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground">{slide.question}</p>
      <div className="mt-4 space-y-2">
        {slide.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === slide.correctIndex;
          const revealed = selected !== null;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => setSelected(i)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg border p-3 text-left text-[15px] leading-relaxed transition-colors disabled:cursor-default",
                !revealed && "border-border hover:border-primary/40 hover:bg-muted",
                revealed && isCorrect && "border-success/40 bg-success/10 text-foreground",
                revealed && isSelected && !isCorrect && "border-destructive/40 bg-destructive/10 text-foreground",
                revealed && !isSelected && !isCorrect && "border-border opacity-60"
              )}
            >
              {revealed && isCorrect && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
              {revealed && isSelected && !isCorrect && <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div
          className={cn(
            "mt-4 rounded-lg border p-4 text-[15px] leading-relaxed",
            selected === slide.correctIndex ? "border-success/30 bg-success/10 text-foreground" : "border-primary/30 bg-primary/10 text-foreground"
          )}
        >
          <p className="font-semibold">{selected === slide.correctIndex ? "Correct!" : "Not quite."}</p>
          <p className="mt-1 text-muted-foreground">{slide.explanation}</p>
        </div>
      )}
    </div>
  );
}

function PracticeSlide({ slide }: { slide: Extract<Slide, { kind: "practice" }> }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{slide.prompt}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {slide.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showSolution ? "Hide solution" : "Show solution"}
        </button>
      </div>

      {showHint && slide.hint && (
        <div className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-[15px] leading-relaxed text-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <Lightbulb className="h-4 w-4" /> Hint
          </p>
          {slide.hint}
        </div>
      )}

      {showSolution && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-raised p-4 text-sm">
          <code className="font-mono text-foreground">{slide.solution}</code>
        </pre>
      )}
    </div>
  );
}

function TerminalSlide({ slide }: { slide: Extract<Slide, { kind: "terminal" }> }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <TerminalSquare className="h-4 w-4 shrink-0 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
      </div>
      {slide.description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{slide.description}</p>}
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5b942]/70" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" aria-hidden />
        </div>
        <div className="overflow-x-auto bg-surface p-4 font-mono text-[13px] leading-relaxed">
          {slide.lines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line.output ? (
                <span className="text-muted-foreground">{line.text}</span>
              ) : (
                <span className="text-foreground">
                  <span className="text-success">$ </span>
                  {line.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartSlide({ slide }: { slide: Extract<Slide, { kind: "chart" }> }) {
  const width = 480;
  const height = 220;
  const padding = { top: 12, right: 12, bottom: 28, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxValue = Math.max(...slide.data.map((d) => d.value), 1);

  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
      {slide.description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{slide.description}</p>}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 320 }} role="img" aria-label={slide.heading}>
          {[0, 0.5, 1].map((t) => {
            const y = padding.top + chartH * (1 - t);
            return <line key={t} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="stroke-border" strokeWidth={1} />;
          })}
          {slide.chartType === "bar" ? (
            slide.data.map((d, i) => {
              const slot = chartW / slide.data.length;
              const barW = slot * 0.55;
              const x = padding.left + i * slot + (slot - barW) / 2;
              const barH = (d.value / maxValue) * chartH;
              const y = padding.top + chartH - barH;
              return (
                <g key={d.label}>
                  <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx={3} className="fill-primary" />
                  <text x={x + barW / 2} y={height - padding.bottom + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    {d.label}
                  </text>
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-foreground text-[10px] font-medium">
                    {d.value}
                    {slide.unit ?? ""}
                  </text>
                </g>
              );
            })
          ) : (
            <>
              <polyline
                fill="none"
                className="stroke-primary"
                strokeWidth={2}
                points={slide.data
                  .map((d, i) => {
                    const x = padding.left + (chartW / Math.max(slide.data.length - 1, 1)) * i;
                    const y = padding.top + chartH - (d.value / maxValue) * chartH;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {slide.data.map((d, i) => {
                const x = padding.left + (chartW / Math.max(slide.data.length - 1, 1)) * i;
                const y = padding.top + chartH - (d.value / maxValue) * chartH;
                const anchor = i === 0 ? "start" : i === slide.data.length - 1 ? "end" : "middle";
                return (
                  <g key={d.label}>
                    <circle cx={x} cy={y} r={3} className="fill-primary" />
                    <text x={x} y={height - padding.bottom + 16} textAnchor={anchor} className="fill-muted-foreground text-[10px]">
                      {d.label}
                    </text>
                    <text x={x} y={y - 8} textAnchor={anchor} className="fill-foreground text-[10px] font-medium">
                      {d.value}
                      {slide.unit ?? ""}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function DiagramSlide({ slide }: { slide: Extract<Slide, { kind: "diagram" }> }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground">{slide.heading}</h3>
      {slide.description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{slide.description}</p>}
      <div className="mt-5 flex flex-wrap items-stretch gap-2">
        {slide.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex min-w-[120px] max-w-[190px] flex-col rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              {step.detail && <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>}
            </div>
            {i < slide.steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}

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

    case "quiz":
      return <QuizSlide slide={slide} />;

    case "practice":
      return <PracticeSlide slide={slide} />;

    case "terminal":
      return <TerminalSlide slide={slide} />;

    case "chart":
      return <ChartSlide slide={slide} />;

    case "diagram":
      return <DiagramSlide slide={slide} />;
  }
}

export function SlideDeck({ slides, onFinish }: { slides: Slide[]; onFinish?: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [narrationOn, setNarrationOn] = useState(false);
  const narration = useLessonNarration();
  const narrationModeRef = useRef(false);
  const indexRef = useRef(0);
  indexRef.current = index;

  const speakSlideAt = useCallback(
    (i: number) => {
      const text = slideNarrationText(slides[i]);
      narration.speak(text, () => {
        if (!narrationModeRef.current) return;
        const nextIndex = i + 1;
        if (nextIndex < slides.length) {
          setDirection(1);
          setIndex(nextIndex);
          if (nextIndex === slides.length - 1) onFinish?.();
          speakSlideAt(nextIndex);
        } else {
          narrationModeRef.current = false;
          setNarrationOn(false);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slides, onFinish]
  );

  function stopNarration() {
    narrationModeRef.current = false;
    setNarrationOn(false);
    narration.stop();
  }

  function toggleNarration() {
    if (narration.state === "speaking") {
      narration.pause();
      return;
    }
    if (narration.state === "paused") {
      narration.resume();
      return;
    }
    narrationModeRef.current = true;
    setNarrationOn(true);
    speakSlideAt(indexRef.current);
  }

  function cycleNarrationRate() {
    const next = NARRATION_RATES[(NARRATION_RATES.indexOf(narration.rate) + 1) % NARRATION_RATES.length];
    narration.setRate(next);
    if (narrationOn) speakSlideAt(indexRef.current);
  }

  useEffect(() => {
    setIndex(0);
    stopNarration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  useEffect(() => stopNarration, []); // eslint-disable-line react-hooks/exhaustive-deps

  function go(next: number) {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
    if (next === slides.length - 1) onFinish?.();
    if (narrationModeRef.current) speakSlideAt(next);
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
      <div className="mb-3 flex items-center gap-1.5">
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

      {narration.supported && (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleNarration}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              narrationOn ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {narration.state === "speaking" ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause narration
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" /> {narrationOn ? "Resume narration" : "Listen to this lesson"}
              </>
            )}
          </button>
          {narrationOn && (
            <>
              <button
                type="button"
                onClick={cycleNarrationRate}
                title="Playback speed"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Gauge className="h-3.5 w-3.5" /> {narration.rate}x
              </button>
              <button
                type="button"
                onClick={stopNarration}
                title="Stop narration"
                className="inline-flex items-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}

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
