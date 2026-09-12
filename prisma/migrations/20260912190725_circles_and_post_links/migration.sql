-- Career Circles: groups candidates can join, and post-linking for job/circle context.
CREATE TABLE "circles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "circles_slug_key" ON "circles"("slug");
CREATE INDEX "circles_category_idx" ON "circles"("category");

CREATE TYPE "CircleMemberRole" AS ENUM ('MEMBER', 'ADMIN');

CREATE TABLE "circle_members" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CircleMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "circle_members_circleId_userId_key" ON "circle_members"("circleId", "userId");
CREATE INDEX "circle_members_userId_idx" ON "circle_members"("userId");

ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts" ADD COLUMN "circleId" TEXT;
ALTER TABLE "posts" ADD COLUMN "jobId" TEXT;

CREATE INDEX "posts_circleId_idx" ON "posts"("circleId");

ALTER TABLE "posts" ADD CONSTRAINT "posts_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
