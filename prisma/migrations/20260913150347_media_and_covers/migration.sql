-- Post media (uploaded image or external video link)
ALTER TABLE "posts" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "posts" ADD COLUMN "videoUrl" TEXT;

-- Candidate profile cover/banner image
ALTER TABLE "candidate_profiles" ADD COLUMN "coverUrl" TEXT;
