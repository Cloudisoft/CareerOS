-- CreateEnum
CREATE TYPE "ExtensionConnectStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "extension_pairing_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_pairing_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_connect_requests" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "ExtensionConnectStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "label" TEXT,
    "version" TEXT,
    "pendingToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_connect_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extension_pairing_codes_code_key" ON "extension_pairing_codes"("code");

-- CreateIndex
CREATE INDEX "extension_pairing_codes_userId_idx" ON "extension_pairing_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "extension_connect_requests_state_key" ON "extension_connect_requests"("state");

-- CreateIndex
CREATE INDEX "extension_connect_requests_state_idx" ON "extension_connect_requests"("state");

-- AddForeignKey
ALTER TABLE "extension_pairing_codes" ADD CONSTRAINT "extension_pairing_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_connect_requests" ADD CONSTRAINT "extension_connect_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
