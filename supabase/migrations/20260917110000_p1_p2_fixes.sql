-- Follow-up migration: 3 fixes applied directly to live DB this session.
-- Written by hand (no Docker/db pull needed) — matches what's actually live.

-- P2-3: processing lease was 30s, shorter than the webhook's own 60s
-- maxDuration, so a genuinely-still-running request could have its claim
-- stolen by a retry. Increased to 90s.
-- P1 bonus: usage_charged is now only set true when the charge was actually
-- allowed (was unconditionally true before, letting a stale retry after a
-- limit-reached response bypass the limit).
CREATE OR REPLACE FUNCTION public.claim_and_charge_message(p_wa_message_id text, p_business_id uuid, p_free_limit integer DEFAULT 50)
 RETURNS TABLE(claimed boolean, allowed boolean, messages_used integer, messages_limit integer, is_expired boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row record;
  v_usage record;
BEGIN
  INSERT INTO webhook_processed_messages (wa_message_id, status, updated_at, usage_charged)
  VALUES (p_wa_message_id, 'processing', now(), false)
  ON CONFLICT (wa_message_id) DO NOTHING;

  IF FOUND THEN
    SELECT * INTO v_usage FROM check_and_increment_usage(p_business_id, p_free_limit);
    UPDATE webhook_processed_messages SET usage_charged = v_usage.allowed WHERE wa_message_id = p_wa_message_id;
    RETURN QUERY SELECT true, v_usage.allowed, v_usage.messages_used, v_usage.messages_limit, v_usage.is_expired;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM webhook_processed_messages WHERE wa_message_id = p_wa_message_id FOR UPDATE;

  IF v_row.status = 'completed' THEN
    RETURN QUERY SELECT false, false, 0, 0, false;
    RETURN;
  END IF;

  IF v_row.updated_at > now() - interval '90 seconds' THEN
    RETURN QUERY SELECT false, false, 0, 0, false;
    RETURN;
  END IF;

  UPDATE webhook_processed_messages SET status = 'processing', updated_at = now() WHERE wa_message_id = p_wa_message_id;

  IF v_row.usage_charged THEN
    SELECT plan, messages_used, messages_limit,
           (valid_until IS NOT NULL AND valid_until < now()) AS expired
      INTO v_usage FROM subscriptions WHERE user_id = p_business_id LIMIT 1;
    RETURN QUERY SELECT true, true, COALESCE(v_usage.messages_used, 0), COALESCE(v_usage.messages_limit, p_free_limit), COALESCE(v_usage.expired, false);
    RETURN;
  ELSE
    SELECT * INTO v_usage FROM check_and_increment_usage(p_business_id, p_free_limit);
    UPDATE webhook_processed_messages SET usage_charged = v_usage.allowed WHERE wa_message_id = p_wa_message_id;
    RETURN QUERY SELECT true, v_usage.allowed, v_usage.messages_used, v_usage.messages_limit, v_usage.is_expired;
    RETURN;
  END IF;
END;
$function$;

-- Also fixed in check_and_increment_usage this session: RETURNS TABLE(...
-- messages_used ...) makes "messages_used" an implicit variable in scope,
-- which collided with the real subscriptions.messages_used column and threw
-- an ambiguous-column error on EVERY normal (under-limit) message. Fixed
-- with table aliasing.
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(p_business_id uuid, p_free_limit integer DEFAULT 50)
 RETURNS TABLE(allowed boolean, messages_used integer, messages_limit integer, is_expired boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sub record;
  v_limit int;
  v_expired boolean;
  v_new_count int;
BEGIN
  INSERT INTO subscriptions (user_id, plan, messages_limit, messages_used, usage_reset_at)
  VALUES (p_business_id, 'starter', p_free_limit, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_business_id ORDER BY valid_until DESC NULLS LAST LIMIT 1 FOR UPDATE;

  v_expired := v_sub.valid_until IS NOT NULL AND v_sub.valid_until < now();

  IF v_sub.usage_reset_at IS NULL OR now() - v_sub.usage_reset_at >= interval '30 days' THEN
    UPDATE subscriptions SET usage_reset_at = now(), messages_used = 0 WHERE id = v_sub.id;
    v_sub.messages_used := 0;
  END IF;

  v_limit := CASE WHEN v_expired THEN 0 ELSE COALESCE(v_sub.messages_limit, p_free_limit) END;

  IF v_sub.messages_used >= v_limit THEN
    RETURN QUERY SELECT false, v_sub.messages_used, v_limit, v_expired;
    RETURN;
  END IF;

  UPDATE subscriptions s SET messages_used = s.messages_used + 1 WHERE s.id = v_sub.id RETURNING s.messages_used INTO v_new_count;

  RETURN QUERY SELECT true, v_new_count, v_limit, v_expired;
END;
$function$;

-- P2-6: internal server-only functions locked down from anon/authenticated.
-- These are only ever called by backend code using the service role.
REVOKE EXECUTE ON FUNCTION check_and_increment_usage(uuid, int) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_and_charge_message(text, uuid, int) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(uuid, text, int, int) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION check_admin_lockout(text, int, int) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION record_admin_login_failure(text, int) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION promote_website_knowledge(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION process_paddle_payment(text, uuid, text, int, numeric, timestamptz) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION check_and_increment_usage(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION claim_and_charge_message(text, uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION check_admin_lockout(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION record_admin_login_failure(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION promote_website_knowledge(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION process_paddle_payment(text, uuid, text, int, numeric, timestamptz) TO service_role;

-- P3-7: phone_number_id should uniquely identify one WhatsApp number.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_numbers_phone_number_id_key'
  ) THEN
    ALTER TABLE whatsapp_numbers ADD CONSTRAINT whatsapp_numbers_phone_number_id_key UNIQUE (phone_number_id);
  END IF;
END $$;