"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useInView } from "framer-motion";
import { AudioLines, ListChecks, Sparkles, Mic, FileText, Check, BookOpen, Volume2, VolumeX } from "lucide-react";

/* Looping, illustrative demos of Interview AI for the home page: the desktop Companion listening for a question
   and showing talking points, the running list of questions with notes, and a practice interview built from a
   resume. Sample content only; nothing here is live data. Each scene plays a short timeline, holds, then the
   stage moves to the next scene. Animations only run while the stage is on screen. The demo always plays (a frozen
   demo looks broken); for people who prefer reduced motion, MotionConfig turns movement into plain fades. */

type SceneProps = { step: number };

const SCENES = [
  { id: "listen", label: "Listens for the question", short: "Listens", icon: AudioLines, steps: [600, 2600, 900, 700, 700, 700, 900], hold: 3200 },
  { id: "list", label: "Keeps every question", short: "Questions", icon: ListChecks, steps: [500, 700, 700, 700, 900, 1200, 900], hold: 3000 },
  { id: "practice", label: "Practice from your resume", short: "Practice", icon: Sparkles, steps: [500, 1600, 500, 500, 500, 500, 900, 2400, 900, 700], hold: 3200 },
] as const;

/** Text that types itself out once `on` is true. */
function Typed({ text, on, ms, instant }: { text: string; on: boolean; ms: number; instant: boolean }) {
  const [n, setN] = useState(instant && on ? text.length : 0);
  useEffect(() => {
    if (!on) return setN(0);
    if (instant) return setN(text.length);
    let i = 0;
    const tick = Math.max(12, ms / text.length);
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(t);
    }, tick);
    return () => clearInterval(t);
  }, [on, text, ms, instant]);
  return (
    <>
      {text.slice(0, n)}
      {on && n < text.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-primary" />}
    </>
  );
}

const pop = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-5 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={active ? { height: [4, 6 + ((i * 7) % 14), 4] } : { height: 4 }}
          transition={active ? { duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 } : { duration: 0.2 }}
          style={{ height: 4, opacity: active ? 1 : 0.35 }}
        />
      ))}
    </div>
  );
}

function WindowChrome({ title, status, children }: { title: string; status: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate text-xs font-semibold text-foreground">{title}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">{status}</span>
      </div>
      {children}
    </div>
  );
}

const HEARD = "So, tell me about a time you had to deliver something under a really tight deadline.";
const PRACTICE_Q = "Your resume says checkout conversion rose 12%. How was that measured, and what did you do?";

const POINTS = ["Checkout rebuild at Northwind, 6-week deadline", "Agreed a smaller first release with the PM", "Shipped on time; conversion up 12%"];

/* Scene 1: the Companion hears the interviewer, spots the question, and shows talking points. */
function ListenScene({ step }: SceneProps) {
  const instant = step >= 99;
  return (
    <WindowChrome
      title="Interview Companion"
      status={
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Listening
        </>
      }
    >
      <div className="grid gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
          <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Waveform active={step >= 1 && step < 3} />
          <span className="text-[11px] text-muted-foreground">Call audio</span>
        </div>
        <div className="min-h-[3.25rem] text-sm text-muted-foreground">
          <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">Heard</span>
          <Typed text={HEARD} on={step >= 1} ms={2300} instant={instant} />
        </div>
        <div className="min-h-[11.5rem] rounded-lg border border-border bg-surface p-4">
          <AnimatePresence>
            {step >= 3 && (
              <motion.div key="q" {...pop}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Question · Behavioral</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Tell me about a time you delivered under a tight deadline.</p>
              </motion.div>
            )}
          </AnimatePresence>
          <ul className="mt-3 space-y-2">
            <AnimatePresence>
              {POINTS.map((p, i) =>
                step >= 4 + i ? (
                  <motion.li key={p} {...pop} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {p}
                  </motion.li>
                ) : null
              )}
            </AnimatePresence>
          </ul>
          <AnimatePresence>
            {step >= 7 && (
              <motion.p key="s" {...pop} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <BookOpen className="h-3 w-3" /> Your story: Checkout rebuild → +12% conversion
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[11px] text-muted-foreground">Talking points from your own resume and saved stories. You answer in your own words.</p>
      </div>
    </WindowChrome>
  );
}

const QUESTIONS = [
  { q: "Walk me through your background.", points: ["5 years building checkout and payments", "Led the Northwind checkout rebuild", "Now looking for product-minded teams"] },
  { q: "Why are you interested in this role?", points: ["Your payments roadmap matches my work", "Small team, real ownership", "Fintech is where I want to grow"] },
  { q: "Tell me about a time you delivered under a tight deadline.", points: ["Checkout rebuild, 6-week deadline", "Agreed a smaller first release", "Shipped on time; conversion up 12%"] },
  { q: "How do you handle disagreement with a product manager?", points: ["Start from the shared goal", "Bring data: the A/B test on fields", "We tried both and kept the winner"] },
  { q: "What would you focus on in your first 90 days?", points: ["Learn the payment flows end to end", "Ship one small fix in month one", "Agree success metrics with the PM"] },
];

/* Scene 2: every question asked lands in a list, and notes can be saved at the end. */
function ListScene({ step }: SceneProps) {
  const shown = Math.min(QUESTIONS.length, Math.max(0, step));
  const current = QUESTIONS[Math.max(0, shown - 1)];
  return (
    <WindowChrome
      title="Interview Companion"
      status={
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> {shown} {shown === 1 ? "question" : "questions"}
        </>
      }
    >
      <div className="grid gap-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-h-[13rem] border-b border-border p-5 sm:border-b-0 sm:border-r sm:p-6">
          <AnimatePresence mode="wait">
            {shown > 0 && (
              <motion.div key={current.q} {...pop}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Now</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{current.q}</p>
                <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                  {current.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {step >= 7 && (
              <motion.div key="saved" {...pop} className="mt-6 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Notes saved: 5 questions and your points, ready for a thank-you email and your next practice.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Questions so far</p>
            <motion.button
              type="button"
              tabIndex={-1}
              aria-hidden
              animate={step === 6 ? { scale: [1, 0.94, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              className={"inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors " + (step >= 6 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}
            >
              <FileText className="h-3 w-3" /> Save notes
            </motion.button>
          </div>
          <ol className="mt-3 space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {QUESTIONS.slice(0, shown)
                .map(({ q }, i) => ({ q, i }))
                .reverse()
                .map(({ q, i }) => (
                  <motion.li
                    key={q}
                    layout
                    {...pop}
                    className={"rounded-lg border-l-2 px-3 py-2 text-xs " + (i < shown - 3 ? "hidden sm:block " : "") + (i === shown - 1 ? "border-primary bg-primary/5 text-foreground" : "border-success/60 bg-surface text-muted-foreground")}
                  >
                    <span className="line-clamp-1">{q}</span>
                    <span className="mt-0.5 block text-[10px] opacity-70">{i === shown - 1 ? "Now" : "Covered"}</span>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ol>
        </div>
      </div>
    </WindowChrome>
  );
}

const FOCUS = ["Checkout rebuild", "“+12% conversion”", "Why fintech, why now", "The 2021 career break"];

/* Scene 3: Interview AI reads the resume, plans focus areas, asks, and scores the answer. */
function PracticeScene({ step }: SceneProps) {
  const instant = step >= 99;
  const score = 82;
  return (
    <WindowChrome
      title="Interview AI · Practice"
      status={
        <>
          <Sparkles className="h-3 w-3 text-primary" /> Built from your resume
        </>
      }
    >
      <div className="grid gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{step >= 2 ? "Interview plan ready" : "Reading your resume…"}</span>
            <span className="text-muted-foreground">Senior Product Engineer</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised">
            <motion.div className="h-full rounded-full bg-brand-gradient" initial={{ width: "0%" }} animate={{ width: step >= 1 ? "100%" : "0%" }} transition={{ duration: instant ? 0 : 1.5, ease: "easeInOut" }} />
          </div>
          <div className="mt-3 flex min-h-[1.75rem] flex-wrap gap-1.5">
            <AnimatePresence>
              {FOCUS.map((f, i) =>
                step >= 2 + i ? (
                  <motion.span key={f} {...pop} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground/85">
                    {f}
                  </motion.span>
                ) : null
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="min-h-[15rem] rounded-lg border border-border bg-surface p-4">
          <AnimatePresence>
            {step >= 6 && (
              <motion.div key="q" {...pop}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Question 3 · Resume claim</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{PRACTICE_Q}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {step >= 7 && (
            <p className="mt-3 rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              <Typed text="We A/B tested the new flow for four weeks against the old one. I led the payment step redesign and cut two form fields…" on ms={2200} instant={instant} />
            </p>
          )}
          <AnimatePresence>
            {step >= 8 && (
              <motion.div key="fb" {...pop} className="mt-3 flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-surface-raised" />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="stroke-primary"
                      strokeDasharray="97.4"
                      initial={{ strokeDashoffset: 97.4 }}
                      animate={{ strokeDashoffset: 97.4 * (1 - score / 100) }}
                      transition={{ duration: instant ? 0 : 1, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{score}</span>
                </div>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-1.5 text-foreground/90">
                    <Check className="h-3 w-3 text-success" /> Clear method and a real number
                  </li>
                  <AnimatePresence>
                    {step >= 9 && (
                      <motion.li key="t" {...pop} className="flex items-center gap-1.5 text-foreground/90">
                        <Sparkles className="h-3 w-3 text-primary" /> Say what you did versus the team
                      </motion.li>
                    )}
                  </AnimatePresence>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}

/* The other side of the call: a video tile beside the demo. Plays a looping clip when one is configured
   (NEXT_PUBLIC_INTERVIEW_DEMO_VIDEO, a muted MP4 of someone who agreed to appear on the site); otherwise an
   illustrated interviewer whose mouth moves while they're asking a question. */
const DEMO_VIDEO = process.env.NEXT_PUBLIC_INTERVIEW_DEMO_VIDEO || "";

function IllustratedInterviewer({ speaking, still }: { speaking: boolean; still: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ia-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2433" />
          <stop offset="1" stopColor="#17131c" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#ia-bg)" />
      {/* bookshelf behind */}
      <rect x="14" y="30" width="58" height="4" rx="2" fill="#3a3244" />
      <rect x="18" y="12" width="8" height="18" rx="1.5" fill="#EF862D" opacity="0.55" />
      <rect x="28" y="16" width="7" height="14" rx="1.5" fill="#7c6f8f" />
      <rect x="37" y="10" width="9" height="20" rx="1.5" fill="#DF4C2C" opacity="0.5" />
      <rect x="150" y="18" width="34" height="34" rx="17" fill="#2f6b4f" opacity="0.45" />
      {/* shoulders and shirt */}
      <path d="M30 240 C34 188 64 170 100 170 C136 170 166 188 170 240 Z" fill="#3d5a80" />
      <path d="M86 172 L100 196 L114 172 Z" fill="#e9e4ef" />
      {/* neck */}
      <rect x="88" y="146" width="24" height="30" rx="10" fill="#c98e6b" />
      {/* head */}
      <ellipse cx="100" cy="112" rx="40" ry="46" fill="#d9a07c" />
      {/* hair */}
      <path d="M58 108 C56 72 80 58 102 60 C128 60 146 76 142 110 C138 92 128 82 112 80 C96 90 76 92 58 108 Z" fill="#2b1d16" />
      {/* ears */}
      <ellipse cx="60" cy="116" rx="6" ry="9" fill="#cf9572" />
      <ellipse cx="140" cy="116" rx="6" ry="9" fill="#cf9572" />
      {/* brows */}
      <motion.g animate={speaking && !still ? { y: [0, -1.5, 0, -1, 0] } : { y: 0 }} transition={{ duration: 1.6, repeat: speaking ? Infinity : 0 }}>
        <rect x="78" y="100" width="16" height="3" rx="1.5" fill="#2b1d16" />
        <rect x="106" y="100" width="16" height="3" rx="1.5" fill="#2b1d16" />
      </motion.g>
      {/* eyes, blinking now and then */}
      <motion.g
        style={{ transformOrigin: "100px 113px" }}
        animate={still ? { scaleY: 1 } : { scaleY: [1, 1, 0.1, 1] }}
        transition={still ? {} : { duration: 4, times: [0, 0.92, 0.96, 1], repeat: Infinity }}
      >
        <ellipse cx="86" cy="113" rx="4" ry="4.5" fill="#1d1712" />
        <ellipse cx="114" cy="113" rx="4" ry="4.5" fill="#1d1712" />
      </motion.g>
      {/* nose */}
      <path d="M100 116 C98 124 96 128 101 129" stroke="#b97d5b" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* mouth: opens and closes while speaking */}
      <motion.ellipse
        cx="100"
        cy="139"
        rx="9"
        ry="1.5"
        initial={{ ry: 1.5 }}
        fill="#7a3b2e"
        animate={speaking && !still ? { ry: [1.5, 5, 2.5, 6, 1.5, 4, 2] } : { ry: 1.5 }}
        transition={speaking && !still ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      />
    </svg>
  );
}

function CallTile({ speaking, label, sub, still }: { speaking: boolean; label: string; sub: string; still: boolean }) {
  // On phones the tile is small, so its name tag is shown beside it instead (see InterviewAIShowcase).
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-[#17131c] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]">
      {DEMO_VIDEO ? (
        <video className="h-full w-full object-cover" src={DEMO_VIDEO} autoPlay muted loop playsInline preload="metadata" aria-hidden />
      ) : (
        <IllustratedInterviewer speaking={speaking} still={still} />
      )}
      {/* speaking ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-primary"
        animate={{ opacity: speaking ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
      <div className="absolute inset-x-3 bottom-3 hidden items-center md:flex gap-2 rounded-lg bg-black/55 px-2.5 py-1.5 text-white backdrop-blur">
        <span className={"flex h-5 w-5 items-center justify-center rounded-full " + (speaking ? "bg-primary" : "bg-white/20")}>
          <Mic className="h-3 w-3" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{label}</span>
          <span className="block truncate text-[10px] text-white/70">{sub}</span>
        </span>
      </div>
      {/* the candidate's own small tile */}
      <div className="absolute right-1.5 top-1.5 flex h-7 w-9 items-center justify-center rounded border border-white/15 bg-[#2a2433] text-[8px] md:right-3 md:top-3 md:h-12 md:w-16 md:rounded-md md:text-[10px] font-semibold text-white/80">
        You
      </div>
    </div>
  );
}

const RENDER = { listen: ListenScene, list: ListScene, practice: PracticeScene };

/** What the interviewer says out loud at this point of a scene, when sound is on. */
function lineFor(sceneId: (typeof SCENES)[number]["id"], step: number): string {
  if (sceneId === "listen" && step === 1) return HEARD;
  if (sceneId === "list" && step >= 1 && step <= QUESTIONS.length) return QUESTIONS[step - 1].q;
  if (sceneId === "practice" && step === 6) return PRACTICE_Q;
  return "";
}

/** A natural English voice: one for the hiring manager, a different one for the practice interviewer if there is one. */
function pickVoice(practice: boolean): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
  if (!all.length) return null;
  const ranked = [...all].sort((a, b) => Number(/natural|google|samantha|daniel|aria|jenny|guy/i.test(b.name)) - Number(/natural|google|samantha|daniel|aria|jenny|guy/i.test(a.name)));
  return ranked[practice && ranked.length > 1 ? 1 : 0];
}

export function InterviewAIShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [scene, setScene] = useState(0);
  const [step, setStep] = useState(0);
  const [sound, setSound] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const cfg = SCENES[scene];

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setCanSpeak(true);
    window.speechSynthesis.getVoices(); // some browsers load the voice list on first ask
    return () => window.speechSynthesis.cancel();
  }, []);

  // Play the current scene's timeline, hold on the finished state, then move to the next scene. It loops for as
  // long as the section is on screen. With sound on, the interviewer's line is spoken and the demo waits for it.
  useEffect(() => {
    if (!inView) return;
    const line = sound && canSpeak ? lineFor(cfg.id, step) : "";
    let timerDone = false;
    let speechDone = !line;
    let talking = false;
    const next = () => {
      if (!timerDone || !speechDone) return;
      if (step < cfg.steps.length) setStep((s) => s + 1);
      else {
        setStep(0);
        setScene((s) => (s + 1) % SCENES.length);
      }
    };
    const timer = setTimeout(() => {
      timerDone = true;
      next();
    }, step < cfg.steps.length ? cfg.steps[step] : cfg.hold);
    let safety: ReturnType<typeof setTimeout> | undefined;
    if (line) {
      const u = new SpeechSynthesisUtterance(line);
      const voice = pickVoice(cfg.id === "practice");
      if (voice) u.voice = voice;
      u.rate = 1.02;
      const done = () => {
        if (speechDone) return;
        speechDone = true;
        talking = false;
        next();
      };
      u.onend = done;
      u.onerror = done;
      talking = true;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      safety = setTimeout(done, 12000); // never let a missing "end" event stall the loop
    }
    return () => {
      clearTimeout(timer);
      if (safety) clearTimeout(safety);
      if (talking) window.speechSynthesis.cancel();
    };
  }, [step, scene, inView, cfg, sound, canSpeak]);

  const Scene = RENDER[cfg.id];
  const shownStep = step;
  // When the other side of the call is talking in each demo.
  const speaking =
    inView && ((cfg.id === "listen" && step >= 1 && step <= 2) || (cfg.id === "list" && step >= 1 && step <= 5) || (cfg.id === "practice" && step === 6));
  const caller = cfg.id === "practice" ? { label: "Interview AI", sub: "Practice interviewer" } : { label: "Jordan Reyes", sub: "Hiring manager · Northwind" };

  return (
    <MotionConfig reducedMotion="user">
    <div ref={ref}>
      <div className="flex justify-center gap-1.5 sm:flex-wrap sm:gap-2" role="tablist" aria-label="Interview AI demos">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === scene}
            onClick={() => {
              setScene(i);
              setStep(0);
            }}
            className={
              "relative inline-flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors sm:px-3.5 sm:text-sm " +
              (i === scene ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground")
            }
          >
            <s.icon className={"h-3.5 w-3.5 " + (i === scene ? "text-primary" : "")} />
            <span className="sm:hidden">{s.short}</span>
            <span className="hidden sm:inline">{s.label}</span>
            {i === scene && (
              <motion.span
                key={`${scene}-bar`}
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: inView ? 1 : 0 }}
                transition={{ duration: (cfg.steps.reduce((a, b) => a + b, 0) + cfg.hold) / 1000, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
      {canSpeak && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            aria-pressed={sound}
            onClick={() => {
              if (sound) window.speechSynthesis.cancel();
              setSound((v) => !v);
            }}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors " +
              (sound ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {sound ? "Sound on" : "Hear the interviewer"}
          </button>
        </div>
      )}
      <div className="relative mx-auto mt-6 grid max-w-5xl items-start gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div aria-hidden className="pointer-events-none absolute -inset-y-10 inset-x-0 -z-10 rounded-full opacity-60 blur-3xl md:-inset-10" style={{ background: "radial-gradient(circle, rgba(239,134,45,0.18), transparent 70%)" }} />
        <div className="flex items-center gap-3 md:sticky md:top-24 md:block">
          <div className="w-20 shrink-0 sm:w-24 md:w-full">
            <CallTile speaking={speaking} label={caller.label} sub={caller.sub} still={false} />
          </div>
          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-semibold text-foreground">{caller.label}</p>
            <p className="truncate text-xs text-muted-foreground">{caller.sub}</p>
            <p className={"mt-1 flex items-center gap-1.5 text-[11px] font-medium " + (speaking ? "text-primary" : "text-muted-foreground")}>
              <Mic className="h-3 w-3" /> {speaking ? "Asking a question…" : "On the call"}
            </p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={cfg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
            <Scene step={shownStep} />
          </motion.div>
        </AnimatePresence>
        <p className="text-center text-[11px] text-muted-foreground md:col-span-2">Sample interview for illustration.</p>
      </div>
    </div>
    </MotionConfig>
  );
}
