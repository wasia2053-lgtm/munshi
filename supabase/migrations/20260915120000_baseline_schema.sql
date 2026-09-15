-- Baseline schema migration for Munshi
-- Generated directly from the live production Supabase database on 2026-09-15.
-- This captures the REAL current state (tables, constraints, indexes,
-- functions, trigger, RLS policies) so the project is reproducible from Git
-- without needing Docker/WSL to pull it via the Supabase CLI.

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text,
  whatsapp_number text,
  whatsapp_status text DEFAULT 'disconnected',
  bot_name text DEFAULT 'Munshi',
  bot_tone text DEFAULT 'friendly',
  bot_language text DEFAULT 'roman_urdu',
  created_at timestamptz DEFAULT now(),
  whatsapp_phone_id text DEFAULT ''
);
-- NOTE: this table is legacy/OAuth scaffolding. The app's real ownership
-- model is business_id = auth.users.id everywhere else (no FK to this table).

CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  bot_name text DEFAULT 'Munshi',
  organization_name text DEFAULT 'My Business',
  language text DEFAULT 'roman_urdu',
  tone text DEFAULT 'professional',
  greeting_message text DEFAULT 'Assalam o alaikum!',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  avatar_url text DEFAULT 'NULL',
  onboarding_complete boolean DEFAULT false,
  operating_hours jsonb DEFAULT '{"friday": {"open": "09:00", "close": "18:00", "enabled": true}, "monday": {"open": "09:00", "close": "18:00", "enabled": true}, "sunday": {"open": null, "close": null, "enabled": false}, "tuesday": {"open": "09:00", "close": "18:00", "enabled": true}, "saturday": {"open": "09:00", "close": "14:00", "enabled": true}, "thursday": {"open": "09:00", "close": "18:00", "enabled": true}, "wednesday": {"open": "09:00", "close": "18:00", "enabled": true}}'::jsonb,
  away_message text DEFAULT 'Assalam o alaikum! Abhi hum available nahi hain. Kal business hours mein reply karenge. Shukriya!'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  plan text DEFAULT 'free',
  messages_used integer DEFAULT 0,
  messages_limit integer DEFAULT 50,
  ls_customer_id text,
  valid_until timestamptz,
  ls_subscription_id text,
  ls_variant_id text,
  usage_reset_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  plan text,
  amount integer,
  status text DEFAULT 'pending',
  reference_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  gateway text DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid, -- no FK: app uses auth.users.id directly, see note below
  customer_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message text,
  last_message_time timestamp,
  customer_summary text DEFAULT '',
  is_resolved boolean DEFAULT false,
  UNIQUE (customer_phone, business_id)
);
-- IMPORTANT: business_id previously had FK -> businesses.id. That FK was
-- DROPPED because businesses rows are never created for most signups, which
-- made every new customer's first conversation fail. Do NOT re-add it.

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  sender text,
  content text,
  "timestamp" timestamptz DEFAULT now(),
  message_text text
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid, -- no FK, same reasoning as conversations above
  source_type text,
  source_url text,
  content text,
  chunks_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  job_id uuid -- isolates concurrent website crawls (staging bucket per crawl)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  phone_number text,
  phone_number_id text,
  display_name text,
  status text DEFAULT 'disconnected',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  access_token text -- AES-256-GCM encrypted at the app layer, see lib/crypto.ts
);

CREATE TABLE IF NOT EXISTS whatsapp_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  business_name text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_credentials_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id text NOT NULL,
  access_token text NOT NULL, -- AES-256-GCM encrypted at the app layer
  phone_number text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backend-only tables (service role only — RLS enabled, no client policies)
CREATE TABLE IF NOT EXISTS webhook_processed_messages (
  wa_message_id text PRIMARY KEY,
  processed_at timestamptz DEFAULT now(),
  status text DEFAULT 'processing',
  updated_at timestamptz DEFAULT now(),
  usage_charged boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  business_id uuid NOT NULL,
  route text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, route, window_start)
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip text NOT NULL,
  window_start timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, window_start)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_business_id ON knowledge_base(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connection_requests_business_id ON whatsapp_connection_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_credentials_submissions_business_id ON whatsapp_credentials_submissions(business_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_credentials_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_processed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bs_insert_own" ON business_settings FOR INSERT WITH CHECK (business_id = (select auth.uid()));
CREATE POLICY "bs_select_own" ON business_settings FOR SELECT USING (business_id = (select auth.uid()));
CREATE POLICY "bs_update_own" ON business_settings FOR UPDATE USING (business_id = (select auth.uid())) WITH CHECK (business_id = (select auth.uid()));

CREATE POLICY "Users can read own business" ON businesses FOR SELECT USING (((select auth.uid()) = user_id) OR ((select auth.uid()) = id));

CREATE POLICY "conversations_select_own" ON conversations FOR SELECT USING (business_id = (select auth.uid()));
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (business_id = (select auth.uid())) WITH CHECK (business_id = (select auth.uid()));

CREATE POLICY "kb_delete_own" ON knowledge_base FOR DELETE USING (business_id = (select auth.uid()));
CREATE POLICY "kb_insert_own" ON knowledge_base FOR INSERT WITH CHECK (business_id = (select auth.uid()));
CREATE POLICY "kb_select_own" ON knowledge_base FOR SELECT USING (business_id = (select auth.uid()));
CREATE POLICY "kb_update_own" ON knowledge_base FOR UPDATE USING (business_id = (select auth.uid())) WITH CHECK (business_id = (select auth.uid()));

CREATE POLICY "messages_select_own" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.business_id = (select auth.uid()))
);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (business_id = (select auth.uid()));
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT WITH CHECK (business_id = (select auth.uid()));
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (business_id = (select auth.uid()));
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (business_id = (select auth.uid())) WITH CHECK (business_id = (select auth.uid()));

CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "users_read_own" ON subscriptions FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own requests" ON whatsapp_connection_requests FOR INSERT WITH CHECK (business_id = (select auth.uid()));
CREATE POLICY "Users can view own requests" ON whatsapp_connection_requests FOR SELECT USING (business_id = (select auth.uid()));

CREATE POLICY "Users can insert own submissions" ON whatsapp_credentials_submissions FOR INSERT WITH CHECK (business_id = (select auth.uid()));
CREATE POLICY "Users can view own submissions" ON whatsapp_credentials_submissions FOR SELECT USING (business_id = (select auth.uid()));

CREATE POLICY "whatsapp_numbers_select_own" ON whatsapp_numbers FOR SELECT USING (business_id = (select auth.uid()));

-- webhook_processed_messages, api_rate_limits, admin_login_attempts:
-- RLS enabled, NO policies — intentional (service role / backend only).

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Signup trigger: creates the Starter subscription + business_settings row
-- for every new auth.users signup (both email and Google OAuth).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, usage_reset_at)
  VALUES (NEW.id, 'starter', 0, 50, now())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO business_settings (business_id, bot_name, language, tone, greeting_message, organization_name)
  VALUES (
    NEW.id,
    'Munshi',
    'roman_urdu',
    'friendly',
    'Assalam o Alaikum! Main aapki kaise madad kar sakta hun?',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), '')
  )
  ON CONFLICT (business_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- handle_new_user is a trigger — it fires on auth.users insert regardless of
-- role grants. It must never be directly callable via RPC:
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated, PUBLIC;


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

  UPDATE subscriptions SET messages_used = messages_used + 1 WHERE id = v_sub.id RETURNING subscriptions.messages_used INTO v_new_count;

  RETURN QUERY SELECT true, v_new_count, v_limit, v_expired;
END;
$function$;


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
    UPDATE webhook_processed_messages SET usage_charged = true WHERE wa_message_id = p_wa_message_id;
    RETURN QUERY SELECT true, v_usage.allowed, v_usage.messages_used, v_usage.messages_limit, v_usage.is_expired;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM webhook_processed_messages WHERE wa_message_id = p_wa_message_id FOR UPDATE;

  IF v_row.status = 'completed' THEN
    RETURN QUERY SELECT false, false, 0, 0, false;
    RETURN;
  END IF;

  IF v_row.updated_at > now() - interval '30 seconds' THEN
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
    UPDATE webhook_processed_messages SET usage_charged = true WHERE wa_message_id = p_wa_message_id;
    RETURN QUERY SELECT true, v_usage.allowed, v_usage.messages_used, v_usage.messages_limit, v_usage.is_expired;
    RETURN;
  END IF;
END;
$function$;


CREATE OR REPLACE FUNCTION public.check_rate_limit(p_business_id uuid, p_route text, p_max_requests integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start timestamptz;
  v_count int;
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO api_rate_limits (business_id, route, window_start, request_count)
  VALUES (p_business_id, p_route, v_window_start, 1)
  ON CONFLICT (business_id, route, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$function$;


CREATE OR REPLACE FUNCTION public.check_admin_lockout(p_ip text, p_max_attempts integer DEFAULT 5, p_window_seconds integer DEFAULT 300)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start timestamptz;
  v_count int;
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  SELECT attempt_count INTO v_count FROM admin_login_attempts WHERE ip = p_ip AND window_start = v_window_start;
  RETURN COALESCE(v_count, 0) < p_max_attempts;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_admin_login_failure(p_ip text, p_window_seconds integer DEFAULT 300)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start timestamptz;
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO admin_login_attempts (ip, window_start, attempt_count)
  VALUES (p_ip, v_window_start, 1)
  ON CONFLICT (ip, window_start) DO UPDATE SET attempt_count = admin_login_attempts.attempt_count + 1;
END;
$function$;


CREATE OR REPLACE FUNCTION public.promote_website_knowledge(p_business_id uuid, p_job_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM knowledge_base WHERE business_id = p_business_id AND source_type = 'website';
  UPDATE knowledge_base SET source_type = 'website', job_id = NULL
    WHERE business_id = p_business_id AND source_type = 'website_pending' AND job_id = p_job_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.process_paddle_payment(p_event_id text, p_user_id uuid, p_plan text, p_limit integer, p_amount numeric, p_valid_until timestamp with time zone)
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

  INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, valid_until)
  VALUES (p_user_id, p_plan, 0, p_limit, p_valid_until)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = p_plan, messages_used = 0, messages_limit = p_limit, valid_until = p_valid_until;

  RETURN QUERY SELECT true;
END;
$function$;