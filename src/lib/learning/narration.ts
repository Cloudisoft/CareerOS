import type { Slide } from "./slide-types";

/**
 * Turns a slide into flowing text for text-to-speech. Reference material
 * that would read a spoiler or noise aloud (quiz answers, practice
 * solutions/hints, raw terminal output) is deliberately left out — the
 * narration explains what's on the slide, it doesn't give away the
 * exercise or read punctuation-heavy output line by line.
 */
export function slideNarrationText(slide: Slide): string {
  const say = (...parts: (string | null | undefined)[]) =>
    parts
      .filter((p): p is string => Boolean(p && p.trim()))
      .map((p) => p.trim().replace(/[.:]$/, ""))
      .join(". ") + ".";

  switch (slide.kind) {
    case "title":
      return say(slide.heading, slide.subheading);

    case "text":
      return say(slide.heading, ...slide.body);

    case "bullets":
      return say(slide.heading, slide.intro, ...slide.bullets);

    case "example":
      return say(
        slide.heading,
        slide.body,
        "Here's the example code on screen.",
        slide.language ? `It's written in ${slide.language}.` : null
      );

    case "callout":
      return say(slide.heading, slide.body);

    case "summary":
      return say(slide.heading, "Key takeaways:", ...slide.bullets);

    case "quiz":
      return say(
        slide.heading,
        slide.question,
        ...slide.options.map((option, i) => `Option ${String.fromCharCode(65 + i)}: ${option}`)
      );

    case "practice":
      return say(slide.heading, slide.prompt, "Give it a try, then check the hint or solution on screen when you're ready.");

    case "terminal":
      return say(
        slide.heading,
        slide.description,
        "Here's the command sequence:",
        ...slide.lines.filter((l) => !l.output).map((l) => l.text)
      );

    case "chart":
      return say(
        slide.heading,
        slide.description,
        ...slide.data.map((d) => `${d.label}: ${d.value}${slide.unit ?? ""}`)
      );

    case "diagram":
      return say(
        slide.heading,
        slide.description,
        ...slide.steps.map((s, i) => `Step ${i + 1}, ${s.label}${s.detail ? ` — ${s.detail}` : ""}`)
      );
  }
}
