-- Column was applied directly to the live DB when the expiry-reminder cron
-- was built (app/api/cron/expiry-reminders/route.ts) but the migration file
-- itself was never committed — adding it now so a fresh DB/migration replay
-- actually matches what's live.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS expiry_reminder_for timestamptz;