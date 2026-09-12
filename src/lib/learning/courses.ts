import "server-only";
import { prisma } from "@/lib/prisma";
import type { Slide } from "@/lib/learning/slide-types";

export class CourseError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function listCourses(profileId: string) {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { lessons: { select: { id: true } } },
  });

  const progress = await prisma.courseLessonProgress.findMany({
    where: { profileId, lesson: { courseId: { in: courses.map((c) => c.id) } } },
    select: { lessonId: true, lesson: { select: { courseId: true } } },
  });

  const completedByCourseCount = new Map<string, number>();
  for (const p of progress) {
    const key = p.lesson.courseId;
    completedByCourseCount.set(key, (completedByCourseCount.get(key) ?? 0) + 1);
  }

  return courses.map((course) => {
    const total = course.lessons.length;
    const completed = completedByCourseCount.get(course.id) ?? 0;
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      lessonCount: total,
      completedCount: completed,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}

/**
 * Maps common missing-skill names (from real job-match data) to the native
 * course slug that actually teaches them. Deliberately conservative — a
 * missing skill with no clear course match here simply won't surface a
 * recommendation, rather than guessing at a loose fit.
 */
const SKILL_TO_COURSE_SLUG: Record<string, string> = {
  javascript: "javascript-fundamentals",
  typescript: "typescript-fundamentals",
  python: "python-fundamentals",
  react: "react-fundamentals",
  "react.js": "react-fundamentals",
  "next.js": "nextjs-and-full-stack-react",
  nextjs: "nextjs-and-full-stack-react",
  node: "nodejs-fundamentals",
  "node.js": "nodejs-fundamentals",
  git: "git-and-version-control",
  docker: "docker-and-containers-in-practice",
  kubernetes: "kubernetes-fundamentals",
  terraform: "infrastructure-as-code-with-terraform",
  aws: "cloud-computing-fundamentals",
  azure: "cloud-computing-fundamentals",
  gcp: "cloud-computing-fundamentals",
  cloud: "cloud-computing-fundamentals",
  "machine learning": "machine-learning-fundamentals",
  ml: "machine-learning-fundamentals",
  "data analysis": "data-analysis-fundamentals",
  pandas: "data-analysis-fundamentals",
  excel: "data-analysis-fundamentals",
  "system design": "system-design-fundamentals",
  graphql: "graphql-fundamentals",
  linux: "linux-and-command-line-fundamentals",
  "command line": "linux-and-command-line-fundamentals",
  agile: "agile-and-scrum-fundamentals",
  scrum: "agile-and-scrum-fundamentals",
  sql: "sql-and-database-fundamentals",
  postgresql: "sql-and-database-fundamentals",
  networking: "networking-fundamentals",
  devops: "devops-and-ci-cd-fundamentals",
  "ci/cd": "devops-and-ci-cd-fundamentals",
  security: "cybersecurity-fundamentals-for-it",
  cybersecurity: "cybersecurity-fundamentals-for-it",
};

/**
 * Recommends native courses for the skills this candidate is actually
 * missing, aggregated from their real cached job matches.
 */
export async function getRecommendedCourses(profileId: string) {
  const matches = await prisma.jobMatch.findMany({
    where: { profileId },
    orderBy: { score: "desc" },
    take: 20,
    select: { missingSkills: true },
  });

  const frequency = new Map<string, number>();
  for (const match of matches) {
    for (const skill of match.missingSkills) {
      const key = skill.toLowerCase();
      frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }
  }

  const topSkills = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  const slugs = Array.from(
    new Set(topSkills.map((skill) => SKILL_TO_COURSE_SLUG[skill]).filter((slug): slug is string => Boolean(slug)))
  );

  if (slugs.length === 0) return { missingSkills: topSkills, courses: [] };

  const allCourses = await listCourses(profileId);
  const courses = slugs
    .map((slug) => allCourses.find((c) => c.slug === slug))
    .filter((c): c is (typeof allCourses)[number] => Boolean(c));

  return { missingSkills: topSkills, courses };
}

export async function getCourse(profileId: string, slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!course) throw new CourseError("This course could not be found.", "NOT_FOUND");

  const progress = await prisma.courseLessonProgress.findMany({
    where: { profileId, lessonId: { in: course.lessons.map((l) => l.id) } },
    select: { lessonId: true },
  });
  const completedIds = new Set(progress.map((p) => p.lessonId));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    lessons: course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slides: l.slides as unknown as Slide[],
      order: l.order,
      durationMinutes: l.durationMinutes,
      completed: completedIds.has(l.id),
    })),
  };
}

export async function setLessonComplete(profileId: string, lessonId: string, completed: boolean) {
  const lesson = await prisma.courseLesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new CourseError("This lesson could not be found.", "NOT_FOUND");

  if (completed) {
    await prisma.courseLessonProgress.upsert({
      where: { profileId_lessonId: { profileId, lessonId } },
      update: {},
      create: { profileId, lessonId },
    });
  } else {
    await prisma.courseLessonProgress.deleteMany({ where: { profileId, lessonId } });
  }
}
