-- Remove Lovable email pipeline
-- Switches email sending from the Lovable React Email / Edge Function / pgmq
-- pipeline to Supabase's built-in email system.
--
-- What this removes:
--   1. The pg_cron job that called process-email-queue every 5 seconds
--   2. Pending messages in the auth_emails queue
--   3. The vault secret used by the queue dispatcher
--
-- After running this migration:
--   • Go to Supabase Dashboard → Authentication → Email Templates
--   • Select "Confirm signup" and paste the branded HTML template
--   • Supabase will send emails natively going forward

-- 1. Unschedule the queue-processing cron job (only if pg_cron is installed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('process-email-queue');
  END IF;
END;
$$;

-- 2. Drain any pending messages so old queued emails are not sent
DO $$
DECLARE
  msg RECORD;
BEGIN
  -- Read and delete all pending auth emails
  FOR msg IN SELECT msg_id FROM pgmq.read('auth_emails', 0, 1000) LOOP
    PERFORM pgmq.delete('auth_emails', msg.msg_id);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL; -- queue may not exist; safe to ignore
END;
$$;

-- 3. Remove the vault secret used by the queue dispatcher
DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
