-- Interview AI reads the resume (and job) into a plan before the first question.
ALTER TABLE "interview_sessions" ADD COLUMN IF NOT EXISTS "plan" JSONB;
ALTER TABLE "interview_questions" ADD COLUMN IF NOT EXISTS "focusId" TEXT;
