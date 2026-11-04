-- New accounts submit applications by themselves (the person can turn this off in Auto Apply settings).
ALTER TABLE "auto_apply_settings" ALTER COLUMN "autoSubmit" SET DEFAULT true;
