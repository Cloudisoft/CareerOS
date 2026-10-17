-- CreateEnum
CREATE TYPE "ToolkitType" AS ENUM ('COVER_LETTER', 'EMAIL', 'QUESTION_RESPONSE', 'RESUME_REVIEW');

-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING_CONSENT', 'CONSENTED', 'SUBMITTED', 'INTERVIEWING', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PayoutTrigger" AS ENUM ('INTERVIEW_REACHED', 'HIRE_CONFIRMED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'REFERRER';

-- CreateTable
CREATE TABLE "toolkit_outputs" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ToolkitType" NOT NULL,
    "jobId" TEXT,
    "input" JSONB,
    "output" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "toolkit_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounties" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BountyStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interviewBonusCents" INTEGER NOT NULL DEFAULT 0,
    "hireBonusCents" INTEGER NOT NULL DEFAULT 0,
    "guaranteeDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "candidateUserId" TEXT,
    "endorsement" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING_CONSENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consentedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "trigger" "PayoutTrigger" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paypalPayoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "toolkit_outputs_profileId_idx" ON "toolkit_outputs"("profileId");

-- CreateIndex
CREATE INDEX "toolkit_outputs_profileId_type_idx" ON "toolkit_outputs"("profileId", "type");

-- CreateIndex
CREATE INDEX "toolkit_outputs_jobId_idx" ON "toolkit_outputs"("jobId");

-- CreateIndex
CREATE INDEX "bounties_companyId_idx" ON "bounties"("companyId");

-- CreateIndex
CREATE INDEX "bounties_status_idx" ON "bounties"("status");

-- CreateIndex
CREATE INDEX "referrals_bountyId_idx" ON "referrals"("bountyId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_paypalPayoutId_key" ON "payouts"("paypalPayoutId");

-- CreateIndex
CREATE INDEX "payouts_bountyId_idx" ON "payouts"("bountyId");

-- CreateIndex
CREATE INDEX "payouts_referrerId_idx" ON "payouts"("referrerId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- AddForeignKey
ALTER TABLE "toolkit_outputs" ADD CONSTRAINT "toolkit_outputs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolkit_outputs" ADD CONSTRAINT "toolkit_outputs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: prisma migrate dev also generated 3 RenameIndex statements here
-- (addon_subscriptions/payments/subscriptions stripe->paypal index names).
-- Deliberately removed: the local database this migration was generated
-- against was built purely by replaying committed migration files, which
-- still declared the old stripe-named indexes since no migration ever
-- renamed them — but production's real database already has the paypal
-- names (renamed out-of-band at some point, outside any migration file).
-- Running the rename against production fails with "relation ... does not
-- exist" because there's nothing left to rename. This file only creates
-- the new Phase 0 tables/enum value; it doesn't touch the pre-existing
-- stripe/paypal naming drift, which is a separate, harmless inconsistency
-- (index names don't affect query correctness) to clean up on its own.
