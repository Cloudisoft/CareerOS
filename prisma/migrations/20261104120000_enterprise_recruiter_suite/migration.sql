-- CreateEnum
CREATE TYPE "EnterprisePlanKey" AS ENUM ('STARTER', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "EnterpriseStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'FREE');

-- CreateEnum
CREATE TYPE "CreditKind" AS ENUM ('RESUME_FETCH', 'INMAIL', 'POST_BOOST', 'CAMPAIGN_BOOST');

-- CreateEnum
CREATE TYPE "AtsCategory" AS ENUM ('HIGHLY_QUALIFIED', 'QUALIFIED', 'POTENTIAL_MATCH', 'NOT_SUITABLE');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('SENT', 'DELIVERED', 'FAILED', 'REPLIED');

-- CreateEnum
CREATE TYPE "BoostKind" AS ENUM ('POST', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "BoostSource" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('GENERAL', 'JOB_ANNOUNCEMENT');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "kind" "PostKind" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "enterprise_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plan" "EnterprisePlanKey",
    "status" "EnterpriseStatus" NOT NULL DEFAULT 'FREE',
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "introUsedAt" TIMESTAMP(3),
    "introActive" BOOLEAN NOT NULL DEFAULT false,
    "paypalSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_events" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" TEXT NOT NULL,
    "fromStatus" "EnterpriseStatus",
    "toStatus" "EnterpriseStatus",
    "plan" "EnterprisePlanKey",
    "amountCents" INTEGER,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" "CreditKind" NOT NULL,
    "delta" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "actorUserId" TEXT,
    "candidateProfileId" TEXT,
    "jobId" TEXT,
    "boostId" TEXT,
    "outreachId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_job_posts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_unlocks" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "unlockedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ats_screenings" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateProfileId" TEXT,
    "candidateName" TEXT,
    "score" INTEGER NOT NULL,
    "category" "AtsCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "missingSkills" TEXT[],
    "recommendations" TEXT[],
    "breakdown" JSONB NOT NULL,
    "model" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ats_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_messages" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "targetCompanyId" TEXT,
    "targetCompanyName" TEXT,
    "channel" "OutreachChannel" NOT NULL,
    "recipientUserId" TEXT,
    "recipientEmail" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL,
    "providerMessageId" TEXT,
    "conversationId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boosts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" "BoostKind" NOT NULL,
    "source" "BoostSource" NOT NULL,
    "name" TEXT,
    "postId" TEXT,
    "jobIds" TEXT[],
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_orders" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" "BoostKind" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "boostId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careers_listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "careers_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careers_publishers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careers_publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_accounts_companyId_key" ON "enterprise_accounts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_accounts_paypalSubscriptionId_key" ON "enterprise_accounts"("paypalSubscriptionId");

-- CreateIndex
CREATE INDEX "enterprise_events_accountId_createdAt_idx" ON "enterprise_events"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "credit_transactions_accountId_kind_periodKey_idx" ON "credit_transactions"("accountId", "kind", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_accountId_kind_refKey_key" ON "credit_transactions"("accountId", "kind", "refKey");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_job_posts_jobId_key" ON "enterprise_job_posts"("jobId");

-- CreateIndex
CREATE INDEX "enterprise_job_posts_accountId_dayKey_idx" ON "enterprise_job_posts"("accountId", "dayKey");

-- CreateIndex
CREATE INDEX "resume_unlocks_accountId_periodKey_idx" ON "resume_unlocks"("accountId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "resume_unlocks_accountId_candidateProfileId_periodKey_key" ON "resume_unlocks"("accountId", "candidateProfileId", "periodKey");

-- CreateIndex
CREATE INDEX "ats_screenings_accountId_jobId_idx" ON "ats_screenings"("accountId", "jobId");

-- CreateIndex
CREATE INDEX "outreach_messages_accountId_senderUserId_createdAt_idx" ON "outreach_messages"("accountId", "senderUserId", "createdAt");

-- CreateIndex
CREATE INDEX "boosts_kind_endsAt_idx" ON "boosts"("kind", "endsAt");

-- CreateIndex
CREATE INDEX "boosts_accountId_idx" ON "boosts"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "boost_orders_paypalOrderId_key" ON "boost_orders"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "boost_orders_boostId_key" ON "boost_orders"("boostId");

-- CreateIndex
CREATE INDEX "boost_orders_accountId_idx" ON "boost_orders"("accountId");

-- CreateIndex
CREATE INDEX "careers_listings_published_createdAt_idx" ON "careers_listings"("published", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "careers_publishers_userId_key" ON "careers_publishers"("userId");

-- AddForeignKey
ALTER TABLE "enterprise_accounts" ADD CONSTRAINT "enterprise_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_events" ADD CONSTRAINT "enterprise_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_job_posts" ADD CONSTRAINT "enterprise_job_posts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_job_posts" ADD CONSTRAINT "enterprise_job_posts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_unlocks" ADD CONSTRAINT "resume_unlocks_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_unlocks" ADD CONSTRAINT "resume_unlocks_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ats_screenings" ADD CONSTRAINT "ats_screenings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ats_screenings" ADD CONSTRAINT "ats_screenings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ats_screenings" ADD CONSTRAINT "ats_screenings_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_orders" ADD CONSTRAINT "boost_orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_orders" ADD CONSTRAINT "boost_orders_boostId_fkey" FOREIGN KEY ("boostId") REFERENCES "boosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careers_publishers" ADD CONSTRAINT "careers_publishers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

