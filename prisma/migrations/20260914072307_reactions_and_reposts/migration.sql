-- Reaction types (like/celebrate/support/love/insightful/funny)
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'FUNNY');

ALTER TABLE "reactions" ADD COLUMN "type" "ReactionType" NOT NULL DEFAULT 'LIKE';

-- Reposts
ALTER TABLE "posts" ADD COLUMN "repostOfId" TEXT;
ALTER TABLE "posts" ADD CONSTRAINT "posts_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "posts_repostOfId_idx" ON "posts"("repostOfId");
