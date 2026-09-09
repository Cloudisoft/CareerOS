-- CreateTable
CREATE TABLE "auto_apply_settings" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minMatchScore" INTEGER NOT NULL DEFAULT 70,
    "dailyLimit" INTEGER NOT NULL DEFAULT 5,
    "pacingSeconds" INTEGER NOT NULL DEFAULT 45,
    "concurrency" INTEGER NOT NULL DEFAULT 1,
    "autoSubmit" BOOLEAN NOT NULL DEFAULT false,
    "platformModes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_apply_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_apply_runs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "queued" INTEGER NOT NULL DEFAULT 0,
    "submitted" INTEGER NOT NULL DEFAULT 0,
    "assisted" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_apply_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auto_apply_settings_profileId_key" ON "auto_apply_settings"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "auto_apply_runs_runId_key" ON "auto_apply_runs"("runId");

-- CreateIndex
CREATE INDEX "auto_apply_runs_profileId_idx" ON "auto_apply_runs"("profileId");

-- AddForeignKey
ALTER TABLE "auto_apply_settings" ADD CONSTRAINT "auto_apply_settings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_apply_runs" ADD CONSTRAINT "auto_apply_runs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
