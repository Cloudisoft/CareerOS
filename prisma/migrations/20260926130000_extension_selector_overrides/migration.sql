-- CreateTable
CREATE TABLE "extension_selector_overrides" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "extension_selector_overrides_pkey" PRIMARY KEY ("id")
);
