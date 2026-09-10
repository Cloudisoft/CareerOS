-- Rename dailyLimit -> monthlyLimit (Auto Apply limits are now tracked per calendar month)
-- and raise the default to match the Free plan's 20/month allotment.
ALTER TABLE "auto_apply_settings" RENAME COLUMN "dailyLimit" TO "monthlyLimit";
ALTER TABLE "auto_apply_settings" ALTER COLUMN "monthlyLimit" SET DEFAULT 20;
