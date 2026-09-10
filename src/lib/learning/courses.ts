import "server-only";
import { prisma } from "@/lib/prisma";

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
      content: l.content,
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
