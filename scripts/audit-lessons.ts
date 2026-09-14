/**
 * Flags Learning Hub lessons whose actual word count falls short of their
 * stated durationMinutes at a 130wpm reading pace. Run after editing course
 * content in prisma/courses/*.ts:
 *
 *   npx tsx scripts/audit-lessons.ts
 *
 * "Practice:" and "Knowledge Check" lessons are skipped — they're meant to
 * be short by design.
 */
import { COURSES } from "../prisma/courses-seed-data";
import type { Slide } from "../src/lib/learning/slide-types";

const WPM = 130;
const THRESHOLD = 0.9;

function wordsOf(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slideWordCount(slide: Slide): number {
  switch (slide.kind) {
    case "title":
      return wordsOf(slide.heading) + wordsOf(slide.subheading);
    case "text":
      return wordsOf(slide.heading) + slide.body.reduce((n, b) => n + wordsOf(b), 0);
    case "bullets":
      return wordsOf(slide.heading) + wordsOf(slide.intro) + slide.bullets.reduce((n, b) => n + wordsOf(b), 0);
    case "example":
      return wordsOf(slide.heading) + wordsOf(slide.body);
    case "callout":
      return wordsOf(slide.heading) + wordsOf(slide.body);
    case "summary":
      return wordsOf(slide.heading) + slide.bullets.reduce((n, b) => n + wordsOf(b), 0);
    case "quiz":
      return (
        wordsOf(slide.heading) +
        wordsOf(slide.question) +
        slide.options.reduce((n, o) => n + wordsOf(o), 0) +
        wordsOf(slide.explanation)
      );
    case "practice":
      return wordsOf(slide.heading) + wordsOf(slide.prompt) + wordsOf(slide.hint) + wordsOf(slide.solution);
    case "terminal":
      return wordsOf(slide.heading) + wordsOf(slide.description);
    case "chart":
      return wordsOf(slide.heading) + wordsOf(slide.description);
    case "diagram":
      return (
        wordsOf(slide.heading) +
        wordsOf(slide.description) +
        slide.steps.reduce((n, s) => n + wordsOf(s.label) + wordsOf(s.detail), 0)
      );
    default:
      return 0;
  }
}

let totalLessons = 0;
let thinLessons = 0;

for (const course of COURSES) {
  const flagged: string[] = [];
  for (const lesson of course.lessons) {
    if (/^practice:/i.test(lesson.title) || /knowledge check/i.test(lesson.title)) continue;
    totalLessons++;
    const words = lesson.slides.reduce((n, s) => n + slideWordCount(s), 0);
    const targetWords = lesson.durationMinutes * WPM;
    const ratio = words / targetWords;
    if (ratio < THRESHOLD) {
      thinLessons++;
      flagged.push(
        `    - "${lesson.title}" (${lesson.durationMinutes}min target ${targetWords}w, has ${words}w, ${(ratio * 100).toFixed(0)}%)`
      );
    }
  }
  if (flagged.length) {
    console.log(`${course.slug}:`);
    flagged.forEach((f) => console.log(f));
  }
}

console.log(`\n${thinLessons} of ${totalLessons} core-content lessons under ${THRESHOLD * 100}% of stated duration.`);
