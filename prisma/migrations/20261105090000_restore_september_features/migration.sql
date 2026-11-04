-- Restores the September features (Network media/reactions/reposts/circles,
-- profile covers, location radius, job evaluations, negotiation scripts,
-- outreach drafts). Production already has these from the September
-- branch's migrations (applied then, never merged to main), so EVERY step
-- here checks first and is a no-op where the object exists. Nothing is
-- dropped or deleted.

DO $$ BEGIN
  CREATE TYPE "CircleMemberRole" AS ENUM ('MEMBER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'FUNNY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "JobLegitimacy" AS ENUM ('CLEAR', 'CAUTION', 'LIKELY_SCAM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "desiredLocationRadiusMiles" INTEGER;

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "circleId" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "repostOfId" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

ALTER TABLE "reactions" ADD COLUMN IF NOT EXISTS "type" "ReactionType" NOT NULL DEFAULT 'LIKE';

CREATE TABLE IF NOT EXISTS "circles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "circle_members" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CircleMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "job_evaluations" (
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

CREATE TABLE IF NOT EXISTS "negotiation_scripts" (
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

CREATE TABLE IF NOT EXISTS "outreach_drafts" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "circles_slug_key" ON "circles"("slug");
CREATE INDEX IF NOT EXISTS "circles_category_idx" ON "circles"("category");
CREATE INDEX IF NOT EXISTS "circle_members_userId_idx" ON "circle_members"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "circle_members_circleId_userId_key" ON "circle_members"("circleId", "userId");
CREATE INDEX IF NOT EXISTS "job_evaluations_jobId_idx" ON "job_evaluations"("jobId");
CREATE UNIQUE INDEX IF NOT EXISTS "job_evaluations_profileId_jobId_key" ON "job_evaluations"("profileId", "jobId");
CREATE INDEX IF NOT EXISTS "negotiation_scripts_profileId_idx" ON "negotiation_scripts"("profileId");
CREATE INDEX IF NOT EXISTS "outreach_drafts_profileId_idx" ON "outreach_drafts"("profileId");
CREATE INDEX IF NOT EXISTS "posts_circleId_idx" ON "posts"("circleId");
CREATE INDEX IF NOT EXISTS "posts_repostOfId_idx" ON "posts"("repostOfId");

-- Foreign keys: added only when missing.
DO $$
DECLARE fk RECORD;
BEGIN
  FOR fk IN SELECT * FROM (VALUES
    ('circle_members', 'circle_members_circleId_fkey', 'FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('circle_members', 'circle_members_userId_fkey', 'FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('posts', 'posts_circleId_fkey', 'FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
    ('posts', 'posts_jobId_fkey', 'FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
    ('posts', 'posts_repostOfId_fkey', 'FOREIGN KEY ("repostOfId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('job_evaluations', 'job_evaluations_profileId_fkey', 'FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('job_evaluations', 'job_evaluations_jobId_fkey', 'FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('negotiation_scripts', 'negotiation_scripts_profileId_fkey', 'FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('negotiation_scripts', 'negotiation_scripts_jobId_fkey', 'FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
    ('outreach_drafts', 'outreach_drafts_profileId_fkey', 'FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
    ('outreach_drafts', 'outreach_drafts_jobId_fkey', 'FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE')
  ) AS t(tbl, name, def) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = fk.name) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s', fk.tbl, fk.name, fk.def);
    END IF;
  END LOOP;
END $$;

-- Index names from the Stripe era: production already uses the PayPal names
-- (renamed by a September migration); fresh databases still had the old ones.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'addon_subscriptions_stripeSubscriptionId_key') THEN
    ALTER INDEX "addon_subscriptions_stripeSubscriptionId_key" RENAME TO "addon_subscriptions_paypalSubscriptionId_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payments_stripeInvoiceId_key') THEN
    ALTER INDEX "payments_stripeInvoiceId_key" RENAME TO "payments_paypalTransactionId_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'subscriptions_stripeSubscriptionId_key') THEN
    ALTER INDEX "subscriptions_stripeSubscriptionId_key" RENAME TO "subscriptions_paypalSubscriptionId_key";
  END IF;
END $$;

-- "My Stories" needs interview_stories in its current shape (question/answer).
-- If a database still has September's earlier story-bank shape (title/
-- situation/...), keep that data in interview_stories_sept_backup — nothing
-- is deleted — and create the current table alongside it.
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_stories')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_stories' AND column_name = 'question') THEN
    ALTER TABLE "interview_stories" RENAME TO "interview_stories_sept_backup";
    FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = 'interview_stories_sept_backup'::regclass AND contype IN ('p', 'f', 'u') LOOP
      EXECUTE format('ALTER TABLE "interview_stories_sept_backup" RENAME CONSTRAINT %I TO %I', r.conname, replace(r.conname, 'interview_stories', 'interview_stories_sept_backup'));
    END LOOP;
    FOR r IN SELECT indexname FROM pg_indexes WHERE tablename = 'interview_stories_sept_backup' AND indexname LIKE 'interview_stories\_%' AND indexname NOT LIKE 'interview_stories_sept_backup%' LOOP
      EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, replace(r.indexname, 'interview_stories', 'interview_stories_sept_backup'));
    END LOOP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_stories') THEN
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
    CREATE UNIQUE INDEX "interview_stories_profileId_question_key" ON "interview_stories"("profileId", "question");
    ALTER TABLE "interview_stories" ADD CONSTRAINT "interview_stories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
