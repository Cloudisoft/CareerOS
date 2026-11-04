-- Google sign-in: passwordHash becomes optional (Google-only accounts never
-- set one), and googleId links an account to its Google identity.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
