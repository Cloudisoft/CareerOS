-- CreateEnum
CREATE TYPE "LearningResourceType" AS ENUM ('COURSE', 'ARTICLE', 'VIDEO', 'DOCS', 'BOOK');

-- CreateEnum
CREATE TYPE "LearningLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LearningProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "LearningResourceType" NOT NULL,
    "level" "LearningLevel" NOT NULL DEFAULT 'BEGINNER',
    "durationMinutes" INTEGER,
    "description" TEXT NOT NULL,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "LearningProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_resources_skillId_idx" ON "learning_resources"("skillId");

-- CreateIndex
CREATE INDEX "learning_progress_profileId_idx" ON "learning_progress"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_profileId_resourceId_key" ON "learning_progress"("profileId", "resourceId");

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
