-- Paddle full lifecycle: status tracking + real billing period dates
-- Adds: subscriptions.status, subscriptions.paddle_subscription_id
-- Updates: process_paddle_payment to accept paddle_subscription_id and
--          reset status back to 'active' on a successful payment (so a
--          past_due subscription that recovers via retry flips back
--          automatically, no manual admin step needed).

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub_id
  ON subscriptions(paddle_subscription_id);

CREATE OR REPLACE FUNCTION public.process_paddle_payment(
  p_event_id text,
  p_user_id uuid,
  p_plan text,
  p_limit integer,
  p_amount numeric,
  p_valid_until timestamp with time zone,
  p_paddle_subscription_id text DEFAULT NULL
)
RETURNS TABLE(claimed boolean)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO payments (user_id, plan, amount, status, reference_number, gateway, expires_at)
  VALUES (p_user_id, p_plan, p_amount, 'completed', p_event_id, 'paddle', p_valid_until)
  ON CONFLICT (reference_number) DO NOTHING;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;

  INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, valid_until, status, paddle_subscription_id)
  VALUES (p_user_id, p_plan, 0, p_limit, p_valid_until, 'active', p_paddle_subscription_id)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = p_plan,
    messages_used = 0,
    messages_limit = p_limit,
    valid_until = p_valid_until,
    status = 'active',
    paddle_subscription_id = COALESCE(EXCLUDED.paddle_subscription_id, subscriptions.paddle_subscription_id);

  RETURN QUERY SELECT true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION process_paddle_payment(text, uuid, text, int, numeric, timestamptz, text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION process_paddle_payment(text, uuid, text, int, numeric, timestamptz, text) TO service_role;
