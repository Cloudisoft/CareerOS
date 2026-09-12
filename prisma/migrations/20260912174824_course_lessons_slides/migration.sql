-- Replace markdown lesson content with structured slide data.
ALTER TABLE "course_lessons" ADD COLUMN "slides" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "course_lessons" DROP COLUMN "content";
ALTER TABLE "course_lessons" ALTER COLUMN "slides" DROP DEFAULT;
