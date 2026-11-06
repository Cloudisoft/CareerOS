-- LinkedIn & Indeed add-on: a switch on the Auto Apply settings, and when the person acknowledged the warning.
ALTER TABLE "auto_apply_settings" ADD COLUMN IF NOT EXISTS "boardsAddon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "auto_apply_settings" ADD COLUMN IF NOT EXISTS "boardsAddonAckAt" TIMESTAMP(3);
