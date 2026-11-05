-- AI Work: paid AI-training roles from partners, added by platform admins.
-- Additive only: one new enum, one new table, one nullable column.

CREATE TYPE "AiWorkRoleStatus" AS ENUM ('ACTIVE', 'CLOSED');

CREATE TABLE "ai_work_roles" (
    "id" TEXT NOT NULL,
    "partner" TEXT NOT NULL DEFAULT 'micro1',
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT[],
    "minYears" INTEGER,
    "payMin" INTEGER,
    "payMax" INTEGER,
    "payCurrency" TEXT NOT NULL DEFAULT 'USD',
    "applyUrl" TEXT,
    "status" "AiWorkRoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_work_roles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_work_roles_status_createdAt_idx" ON "ai_work_roles"("status", "createdAt");

ALTER TABLE "interview_sessions" ADD COLUMN "aiWorkRoleId" TEXT;

ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_aiWorkRoleId_fkey" FOREIGN KEY ("aiWorkRoleId") REFERENCES "ai_work_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
