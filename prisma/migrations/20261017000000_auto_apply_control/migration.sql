-- AlterTable
ALTER TABLE "auto_apply_settings" ADD COLUMN     "runCommand" TEXT,
ADD COLUMN     "runCommandAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auto_apply_runs" ADD COLUMN     "waiting" JSONB NOT NULL DEFAULT '[]';

