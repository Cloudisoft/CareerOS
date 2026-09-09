-- CreateTable
CREATE TABLE "resume_scores" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobId" TEXT,
    "score" INTEGER NOT NULL,
    "keywordScore" INTEGER NOT NULL,
    "formatScore" INTEGER NOT NULL,
    "matchedKeywords" TEXT[],
    "missingKeywords" TEXT[],
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_scores_resumeId_idx" ON "resume_scores"("resumeId");

-- AddForeignKey
ALTER TABLE "resume_scores" ADD CONSTRAINT "resume_scores_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_scores" ADD CONSTRAINT "resume_scores_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
