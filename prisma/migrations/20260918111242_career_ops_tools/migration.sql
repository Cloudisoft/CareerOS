-- CreateEnum
CREATE TYPE "JobLegitimacy" AS ENUM ('CLEAR', 'CAUTION', 'LIKELY_SCAM');

-- CreateTable
CREATE TABLE "job_evaluations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "cvMatchNotes" TEXT NOT NULL,
    "levelStrategy" TEXT NOT NULL,
    "compNotes" TEXT NOT NULL,
    "personalization" TEXT NOT NULL,
    "interviewPrep" TEXT NOT NULL,
    "legitimacy" "JobLegitimacy" NOT NULL DEFAULT 'CLEAR',
    "legitimacyNotes" TEXT NOT NULL,
    "sponsorshipBlocker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_stories" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reflection" TEXT,
    "sourceQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_scripts" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT,
    "scenario" TEXT NOT NULL,
    "offeredSalary" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "script" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_drafts" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT,
    "channel" TEXT NOT NULL,
    "contactName" TEXT,
    "contactRole" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_evaluations_jobId_idx" ON "job_evaluations"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_evaluations_profileId_jobId_key" ON "job_evaluations"("profileId", "jobId");

-- CreateIndex
CREATE INDEX "interview_stories_profileId_idx" ON "interview_stories"("profileId");

-- CreateIndex
CREATE INDEX "negotiation_scripts_profileId_idx" ON "negotiation_scripts"("profileId");

-- CreateIndex
CREATE INDEX "outreach_drafts_profileId_idx" ON "outreach_drafts"("profileId");

-- AddForeignKey
ALTER TABLE "job_evaluations" ADD CONSTRAINT "job_evaluations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_evaluations" ADD CONSTRAINT "job_evaluations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_stories" ADD CONSTRAINT "interview_stories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_stories" ADD CONSTRAINT "interview_stories_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "interview_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_scripts" ADD CONSTRAINT "negotiation_scripts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_scripts" ADD CONSTRAINT "negotiation_scripts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
