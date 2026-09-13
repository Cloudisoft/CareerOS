/**
 * Structured slide content for a course lesson. Authored directly as data
 * (see prisma/courses-seed-data.ts) rather than parsed from markdown, so the
 * lesson player can give each slide kind its own layout — closer to a real
 * course platform than a scrolling text page.
 */
export type Slide =
  | { kind: "title"; heading: string; subheading?: string }
  | { kind: "text"; heading: string; body: string[] }
  | { kind: "bullets"; heading: string; intro?: string; bullets: string[] }
  | { kind: "example"; heading: string; body?: string; code: string; language?: string }
  | { kind: "callout"; heading: string; body: string; tone?: "tip" | "warning" | "insight" }
  | { kind: "summary"; heading: string; bullets: string[] }
  | { kind: "quiz"; heading: string; question: string; options: string[]; correctIndex: number; explanation: string }
  | { kind: "practice"; heading: string; prompt: string; hint?: string; solution: string }
  | { kind: "terminal"; heading: string; description?: string; lines: { text: string; output?: boolean }[] }
  | {
      kind: "chart";
      heading: string;
      description?: string;
      chartType: "bar" | "line";
      unit?: string;
      data: { label: string; value: number }[];
    }
  | { kind: "diagram"; heading: string; description?: string; steps: { label: string; detail?: string }[] };
