-- ============================================================
-- Base application schema bootstrap
--
-- WHY THIS FILE EXISTS:
-- Several tables this app depends on (valley_leads, report_requests,
-- services, promo_codes, promo_code_redemptions, advisory_sessions,
-- activity_log, autopsy_reports, follow_ups) were created directly
-- against a Supabase project outside of this repo's migration
-- history (no CREATE TABLE for them exists anywhere under
-- supabase/migrations/ prior to this file — see
-- 20260606000000_dashboard_v2_full_schema.sql, which is a note-only
-- placeholder, not executable SQL). On a fresh project these tables
-- simply do not exist, which is what caused:
--   ERROR: 42P01: relation "public.valley_leads" does not exist
--
-- This file reconstructs the missing schema from how the
-- application code actually reads/writes these tables, since no
-- original SQL source of truth survived. Columns for
-- founder_assessments / testimonials / user_roles / advisory_sessions
-- / autopsy_reports / follow_ups are taken directly from the
-- Supabase-generated src/integrations/supabase/types.ts (a reliable
-- introspection snapshot). Columns for valley_leads / report_requests
-- / services / promo_codes / promo_code_redemptions / activity_log
-- are reconstructed from every .from('table') call in src/ — these
-- are best-effort; if the app later throws "column ... does not
-- exist", that specific column was missed and needs an
-- ADD COLUMN IF NOT EXISTS follow-up.
--
-- Entirely idempotent — safe to run on a fresh database AND safe to
-- re-run on a database that already has some/all of these objects.
--
-- Does NOT touch: is_current_user_admin() (admin-auth RPC — left
-- alone per explicit instruction), CARZIX, or any UI/design code.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. founder_assessments
--    (base columns from 20260527100531; case_code,
--    primary_failure_mode, founder_health_score, lead_source are
--    extra columns confirmed present in the generated types.ts but
--    never captured in a migration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.founder_assessments (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email                 text          NOT NULL,
  name                  text,
  company               text,
  stage                 text,
  sector                text,
  country               text,
  answers               jsonb         NOT NULL DEFAULT '{}'::jsonb,
  risk_score            integer       NOT NULL DEFAULT 0,
  risk_level            text,
  blind_spots           text[],
  insight               text,
  user_agent            text,
  case_code             text,
  primary_failure_mode  text,
  founder_health_score  integer,
  lead_source           text,
  created_at            timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_assessments
  ADD COLUMN IF NOT EXISTS case_code            text,
  ADD COLUMN IF NOT EXISTS primary_failure_mode text,
  ADD COLUMN IF NOT EXISTS founder_health_score integer,
  ADD COLUMN IF NOT EXISTS lead_source          text;

ALTER TABLE public.founder_assessments ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.founder_assessments TO anon, authenticated;
GRANT ALL    ON public.founder_assessments TO service_role;

DROP POLICY IF EXISTS "Anyone can submit an assessment" ON public.founder_assessments;
DROP POLICY IF EXISTS "Anyone can submit a valid assessment" ON public.founder_assessments;
CREATE POLICY "Anyone can submit a valid assessment"
  ON public.founder_assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND answers IS NOT NULL
    AND jsonb_typeof(answers) = 'object'
    AND risk_score BETWEEN 0 AND 100
  );

REVOKE SELECT, UPDATE, DELETE ON public.founder_assessments FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.founder_assessments FROM authenticated;
GRANT INSERT ON public.founder_assessments TO anon, authenticated;

-- ============================================================
-- 2. testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote        text        NOT NULL,
  author_name  text        NOT NULL,
  author_role  text,
  company      text,
  order_index  integer     NOT NULL DEFAULT 0,
  published    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL    ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published testimonials are viewable by everyone" ON public.testimonials;
CREATE POLICY "Published testimonials are viewable by everyone"
  ON public.testimonials FOR SELECT
  USING (published = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.testimonials (quote, author_name, author_role, company, order_index)
SELECT v.quote, v.author_name, v.author_role, v.company, v.order_index
FROM (VALUES
  ('He didn''t tell me what I wanted to hear. He told me what I had been avoiding for eight months. That conversation cost me my pride and saved my company.', 'Founder', 'Series A · FinTech', 'Riyadh', 1),
  ('Most advisors validate you. He audits you. I walked in pitching a vision and walked out understanding I was running from a decision, not toward one.', 'Co-founder & CEO', 'Seed · B2B SaaS', 'Dubai', 2),
  ('I thought I needed a strategy. I needed someone to name the thing my team was too polite to say. Ninety minutes. No slides. The clearest I''ve felt in two years.', 'Solo Founder', 'Bootstrapped · Marketplace', 'Cairo', 3),
  ('You don''t leave the session motivated. You leave the session honest. That''s rarer and worth more.', 'Founder', 'Pre-Seed · Healthtech', 'Jeddah', 4),
  ('He read my deck for four minutes and asked one question I couldn''t answer. The next month was the hardest and most useful month of the company.', 'CEO', 'Series A · Logistics', 'Riyadh', 5)
) AS v(quote, author_name, author_role, company, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials);

-- ============================================================
-- 3. user_roles + has_role()
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'admin',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
$$;

GRANT SELECT ON public.founder_assessments TO authenticated;
DROP POLICY IF EXISTS "Admins can read all assessments" ON public.founder_assessments;
CREATE POLICY "Admins can read all assessments"
  ON public.founder_assessments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
CREATE POLICY "Admins can insert testimonials"
  ON public.testimonials FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;
CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. set_updated_at() helper (also defined in 20260605000000;
--    CREATE OR REPLACE here so this file is independently runnable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. services — RECONSTRUCTED from src/pages/admin/AdminServices.tsx,
--    src/pages/Contact.tsx, src/pages/BookSession.tsx,
--    src/pages/FailKitRequest.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id                   uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name         text          NOT NULL,
  service_key          text          NOT NULL UNIQUE,
  category             text,
  price                numeric(10,2) NOT NULL DEFAULT 0,
  duration_minutes     integer,
  accepts_promo_codes  boolean       NOT NULL DEFAULT false,
  description_en       text,
  description_ar       text,
  active               boolean       NOT NULL DEFAULT true,
  sort_order           integer       NOT NULL DEFAULT 0,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL    ON public.services TO service_role;

DROP POLICY IF EXISTS "Active services are viewable by everyone" ON public.services;
CREATE POLICY "Active services are viewable by everyone"
  ON public.services FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can read all services" ON public.services;
CREATE POLICY "Admins can read all services"
  ON public.services FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services"
  ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. promo_codes — RECONSTRUCTED from src/pages/admin/AdminPromoCodes.tsx,
--    src/pages/BookSession.tsx, src/pages/FailKitRequest.tsx
--    (service_key CHECK constraint is added later by the existing
--    20260607000000_fail_kit_requests.sql migration — not duplicated here)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                     uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code                   text          NOT NULL UNIQUE,
  title                  text,
  description            text,
  service_key            text          NOT NULL,
  discount_type          text          NOT NULL DEFAULT 'percentage',
  discount_value         numeric(10,2) NOT NULL DEFAULT 0,
  max_uses               integer,
  max_uses_per_customer  integer,
  used_count             integer       NOT NULL DEFAULT 0,
  starts_at              timestamptz,
  ends_at                timestamptz,
  active                 boolean       NOT NULL DEFAULT true,
  created_at             timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT promo_codes_discount_type_check
    CHECK (discount_type IN ('percentage','fixed_amount','free'))
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.promo_codes TO service_role;

DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;

-- ============================================================
-- 7. advisory_sessions — columns confirmed via generated types.ts;
--    workflow_status confirmed via src/lib/workflowEngine.ts usage
-- ============================================================
CREATE TABLE IF NOT EXISTS public.advisory_sessions (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id       uuid        REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  founder_name        text        NOT NULL,
  founder_email       text        NOT NULL,
  company             text,
  session_type        text,
  scheduled_at        timestamptz,
  duration_minutes    integer,
  status              text        DEFAULT 'pending',
  workflow_status      text,
  payment_status      text        DEFAULT 'pending',
  risk_level          text,
  session_value       numeric(10,2),
  notes               text,
  source_booking_id   uuid,
  meeting_method      text,
  meeting_link        text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  CONSTRAINT advisory_sessions_status_check
    CHECK (status IS NULL OR status IN ('pending','confirmed','completed','cancelled','no_show')),
  CONSTRAINT advisory_sessions_payment_status_check
    CHECK (payment_status IS NULL OR payment_status IN ('pending','paid','free'))
);

ALTER TABLE public.advisory_sessions
  ADD COLUMN IF NOT EXISTS workflow_status    text,
  ADD COLUMN IF NOT EXISTS source_booking_id  uuid,
  ADD COLUMN IF NOT EXISTS meeting_method     text,
  ADD COLUMN IF NOT EXISTS meeting_link       text;

ALTER TABLE public.advisory_sessions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.advisory_sessions TO service_role;

DROP POLICY IF EXISTS "Admins manage advisory sessions" ON public.advisory_sessions;
CREATE POLICY "Admins manage advisory sessions"
  ON public.advisory_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisory_sessions TO authenticated;

DROP TRIGGER IF EXISTS advisory_sessions_updated_at ON public.advisory_sessions;
CREATE TRIGGER advisory_sessions_updated_at
  BEFORE UPDATE ON public.advisory_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 8. autopsy_reports — columns confirmed via generated types.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.autopsy_reports (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id         uuid        REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  founder_name          text        NOT NULL,
  founder_email         text,
  company               text,
  risk_score            integer,
  failure_mode          text,
  root_causes           text,
  blind_spots           text[],
  timeline_to_collapse  text,
  recovery_path         text,
  executive_summary     text,
  advisor_notes         text,
  status                text        DEFAULT 'pending',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.autopsy_reports ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.autopsy_reports TO service_role;

DROP POLICY IF EXISTS "Admins manage autopsy reports" ON public.autopsy_reports;
CREATE POLICY "Admins manage autopsy reports"
  ON public.autopsy_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopsy_reports TO authenticated;

DROP TRIGGER IF EXISTS autopsy_reports_updated_at ON public.autopsy_reports;
CREATE TRIGGER autopsy_reports_updated_at
  BEFORE UPDATE ON public.autopsy_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 9. follow_ups — columns confirmed via generated types.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id  uuid        REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  session_id     uuid        REFERENCES public.advisory_sessions(id) ON DELETE SET NULL,
  founder_name   text,
  founder_email  text,
  title          text        NOT NULL,
  type           text,
  priority       text,
  status         text        DEFAULT 'pending',
  due_date       date,
  note           text,
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.follow_ups TO service_role;

DROP POLICY IF EXISTS "Admins manage follow ups" ON public.follow_ups;
CREATE POLICY "Admins manage follow ups"
  ON public.follow_ups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;

DROP TRIGGER IF EXISTS follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. valley_leads — RECONSTRUCTED from src/components/valley/
--     ValleyAssessment.tsx, src/pages/Contact.tsx,
--     src/pages/admin/AdminValleyLeads.tsx, AdminRetargeting.tsx,
--     AdminDashboard.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.valley_leads (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name             text,
  email                 text,
  company               text,
  country               text,
  sector                text,
  startup_stage         text,
  last_question_index   integer     DEFAULT 0,
  current_step          integer     DEFAULT 0,
  progress_percentage   integer     DEFAULT 0,
  risk_score_so_far     integer     DEFAULT 0,
  completed             boolean     NOT NULL DEFAULT false,
  completed_at          timestamptz,
  risk_score            integer,
  risk_level            text,
  primary_failure_mode  text,
  assessment_id         uuid        REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  requested_report      boolean     NOT NULL DEFAULT false,
  requested_session     boolean     NOT NULL DEFAULT false,
  session_intent        text,
  started_at            timestamptz,
  last_contacted_at     timestamptz,
  retargeting_notes     text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.valley_leads
  ADD COLUMN IF NOT EXISTS current_step         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_percentage  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_score_so_far     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requested_session     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_intent        text,
  ADD COLUMN IF NOT EXISTS started_at            timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS retargeting_notes     text;

ALTER TABLE public.valley_leads ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.valley_leads TO service_role;

-- Public gate/quiz flow writes anonymously (no auth) — mirrors the
-- existing WITH CHECK (true) pattern used for booking_requests / fail_kit_requests.
DROP POLICY IF EXISTS "Anyone can create a valley lead" ON public.valley_leads;
CREATE POLICY "Anyone can create a valley lead"
  ON public.valley_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update their valley lead progress" ON public.valley_leads;
CREATE POLICY "Anyone can update their valley lead progress"
  ON public.valley_leads FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read valley leads" ON public.valley_leads;
CREATE POLICY "Admins can read valley leads"
  ON public.valley_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete valley leads" ON public.valley_leads;
CREATE POLICY "Admins can delete valley leads"
  ON public.valley_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE                 ON public.valley_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.valley_leads TO authenticated;

-- ============================================================
-- 11. promo_code_redemptions — RECONSTRUCTED from
--     src/pages/admin/AdminPromoCodes.tsx, BookSession.tsx, FailKitRequest.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id              uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id   uuid          NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  code            text          NOT NULL,
  email           text,
  service_key     text,
  related_type    text,
  related_id      text,
  discount_type   text,
  discount_value  numeric(10,2),
  redeemed_at     timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.promo_code_redemptions TO service_role;

-- Redemptions are recorded at the moment of a public booking/fail-kit
-- submission (anonymous), mirroring the request flows themselves.
DROP POLICY IF EXISTS "Anyone can record a promo redemption" ON public.promo_code_redemptions;
CREATE POLICY "Anyone can record a promo redemption"
  ON public.promo_code_redemptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read promo redemptions" ON public.promo_code_redemptions;
CREATE POLICY "Admins can read promo redemptions"
  ON public.promo_code_redemptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT        ON public.promo_code_redemptions TO anon;
GRANT SELECT, INSERT ON public.promo_code_redemptions TO authenticated;

-- ============================================================
-- 12. report_requests — RECONSTRUCTED from src/pages/Contact.tsx,
--     src/pages/admin/AdminReportQueue.tsx, AdminRevenue.tsx,
--     AdminActionCenter.tsx, AdminWorkflowAnalytics.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_requests (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  valley_lead_id        uuid          REFERENCES public.valley_leads(id) ON DELETE SET NULL,
  assessment_id         uuid          REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  full_name             text          NOT NULL,
  email                 text          NOT NULL,
  company               text,
  report_type           text          NOT NULL DEFAULT 'valley_report',
  risk_score            integer,
  risk_level            text,
  primary_failure_mode  text,
  workflow_status       text          NOT NULL DEFAULT 'pending_review',
  payment_status        text          NOT NULL DEFAULT 'pending',
  original_price        numeric(10,2) DEFAULT 0,
  discount_value        numeric(10,2) DEFAULT 0,
  final_price           numeric(10,2) DEFAULT 0,
  promo_code            text,
  promo_code_id         uuid          REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  admin_notes           text,
  scheduled_for         timestamptz,
  approved_at           timestamptz,
  sent_at               timestamptz,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT report_requests_workflow_status_check
    CHECK (workflow_status IN ('pending_review','draft_ready','approved','scheduled','sent','rejected')),
  CONSTRAINT report_requests_payment_status_check
    CHECK (payment_status IN ('pending','paid','free','waived','failed'))
);

ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.report_requests TO service_role;

DROP POLICY IF EXISTS "Anyone can submit a report request" ON public.report_requests;
CREATE POLICY "Anyone can submit a report request"
  ON public.report_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage report requests" ON public.report_requests;
CREATE POLICY "Admins manage report requests"
  ON public.report_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT                         ON public.report_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_requests TO authenticated;

DROP TRIGGER IF EXISTS report_requests_updated_at ON public.report_requests;
CREATE TRIGGER report_requests_updated_at
  BEFORE UPDATE ON public.report_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 13. activity_log — RECONSTRUCTED from src/hooks/useLogActivity.ts,
--     src/lib/workflowEngine.ts, src/pages/admin/AdminActivityLog.tsx
--     (written by trigger functions that run as the inserting role,
--     not SECURITY DEFINER — anon/authenticated need INSERT)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email     text,
  action          text        NOT NULL,
  entity_type     text,
  entity_id       text,
  description     text,
  metadata        jsonb       DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.activity_log TO service_role;

DROP POLICY IF EXISTS "Anyone can write activity log entries" ON public.activity_log;
CREATE POLICY "Anyone can write activity log entries"
  ON public.activity_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read activity log" ON public.activity_log;
CREATE POLICY "Admins can read activity log"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT        ON public.activity_log TO anon;
GRANT SELECT, INSERT ON public.activity_log TO authenticated;

-- ============================================================
-- 14. validate_promo_code() RPC — RECONSTRUCTED from the call sites
--     in src/pages/BookSession.tsx and src/pages/FailKitRequest.tsx
--     (argument names/shape and return shape taken from those callers)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  input_code        text,
  input_service_key text,
  input_email       text DEFAULT NULL
)
RETURNS TABLE (
  valid          boolean,
  promo_code_id  uuid,
  discount_type  text,
  discount_value numeric,
  title          text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pc record;
  customer_redemptions integer;
BEGIN
  SELECT * INTO pc
  FROM public.promo_codes
  WHERE upper(code) = upper(input_code)
    AND active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
    AND (service_key = input_service_key OR service_key = 'all_services')
  LIMIT 1;

  IF pc.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  IF pc.max_uses IS NOT NULL AND pc.used_count >= pc.max_uses THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text;
    RETURN;
  END IF;

  IF pc.max_uses_per_customer IS NOT NULL AND input_email IS NOT NULL THEN
    SELECT count(*) INTO customer_redemptions
    FROM public.promo_code_redemptions
    WHERE promo_code_id = pc.id AND email = input_email;

    IF customer_redemptions >= pc.max_uses_per_customer THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, NULL::text;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT true, pc.id, pc.discount_type, pc.discount_value, pc.title;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, text, text) TO anon, authenticated;
