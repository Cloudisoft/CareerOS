-- AlterTable: track retry attempts per interview question
ALTER TABLE "interview_questions" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: needed for the interview-practice-to-offer measurement join
CREATE INDEX "interview_sessions_jobId_idx" ON "interview_sessions"("jobId");

-- CreateTable
CREATE TABLE "interview_prep_packs" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyBrief" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "stories" JSONB NOT NULL,
    "questionsToAsk" TEXT[],
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "readinessUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_prep_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interview_prep_packs_applicationId_key" ON "interview_prep_packs"("applicationId");

-- CreateIndex
CREATE INDEX "interview_prep_packs_profileId_idx" ON "interview_prep_packs"("profileId");

-- AddForeignKey
ALTER TABLE "interview_prep_packs" ADD CONSTRAINT "interview_prep_packs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_prep_packs" ADD CONSTRAINT "interview_prep_packs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_prep_packs" ADD CONSTRAINT "interview_prep_packs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
