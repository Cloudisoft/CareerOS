import type { Slide } from "../src/lib/learning/slide-types";

export interface CourseSeed {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  order: number;
  lessons: { title: string; slides: Slide[]; durationMinutes: number }[];
}
