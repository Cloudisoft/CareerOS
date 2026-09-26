-- CreateTable
CREATE TABLE "interview_stories" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interview_stories_profileId_question_key" ON "interview_stories"("profileId", "question");

-- AddForeignKey
ALTER TABLE "interview_stories" ADD CONSTRAINT "interview_stories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
