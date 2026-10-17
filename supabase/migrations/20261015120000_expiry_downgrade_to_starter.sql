ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS downgraded_from text,
  ADD COLUMN IF NOT EXISTS downgraded_valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS expired_notice_for timestamptz;

CREATE OR REPLACE FUNCTION public.downgrade_expired_subscriptions(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(out_user_id uuid, out_previous_plan text, out_expired_at timestamptz)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  UPDATE subscriptions s
     SET downgraded_from = s.plan,
         downgraded_valid_until = s.valid_until,
         plan = 'starter',
         messages_limit = 50,
         messages_used = 0,
         usage_reset_at = now(),
         valid_until = NULL,
         status = 'active'
   WHERE s.plan <> 'starter'
     AND s.valid_until IS NOT NULL
     AND s.valid_until < now()
     AND (p_user_id IS NULL OR s.user_id = p_user_id)
  RETURNING s.user_id, s.downgraded_from, s.downgraded_valid_until;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.downgrade_expired_subscriptions(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscriptions(uuid) TO service_role;

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

  PERFORM 1 FROM downgrade_expired_subscriptions(p_business_id);

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_business_id ORDER BY valid_until DESC NULLS LAST LIMIT 1 FOR UPDATE;

  v_expired := v_sub.plan <> 'starter' AND v_sub.valid_until IS NOT NULL AND v_sub.valid_until < now();

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