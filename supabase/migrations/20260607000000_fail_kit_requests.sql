-- ============================================================
-- fail_kit_requests — Fail Kit operational foundation
-- Sprint 3A: table, request numbering, status workflow,
-- service registration ($19), promo-code support.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fail_kit_requests (
  id                  uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number      text          UNIQUE,

  full_name           text          NOT NULL,
  email               text          NOT NULL,
  country             text,

  assessment_id       uuid          REFERENCES public.founder_assessments(id) ON DELETE SET NULL,
  valley_lead_id      uuid          REFERENCES public.valley_leads(id) ON DELETE SET NULL,

  risk_score          integer,
  failure_category    text,
  severity            text,
  urgency_level       text,
  status              text          NOT NULL DEFAULT 'requested',
  recommended_service text,

  payment_status      text          NOT NULL DEFAULT 'pending',
  price               numeric(10,2) NOT NULL DEFAULT 19,
  discount            numeric(10,2),
  final_price         numeric(10,2),

  assigned_to         text,
  admin_notes         text,

  -- Workflow-engine bookkeeping (mirrors report_requests/booking_requests)
  previous_status     text,
  updated_by          text,

  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT fail_kit_requests_failure_category_check
    CHECK (failure_category IS NULL OR failure_category IN
      ('Founder Conflict','Cash Burn','Product Market Fit','Fundraising','Team Issues','Operations')),
  CONSTRAINT fail_kit_requests_severity_check
    CHECK (severity IS NULL OR severity IN ('Low','Medium','High','Critical')),
  CONSTRAINT fail_kit_requests_urgency_level_check
    CHECK (urgency_level IS NULL OR urgency_level IN ('Green','Yellow','Red','Black')),
  CONSTRAINT fail_kit_requests_status_check
    CHECK (status IN ('requested','under_review','approved','scheduled','delivered','follow_up','closed')),
  CONSTRAINT fail_kit_requests_payment_status_check
    CHECK (payment_status IN ('pending','paid','free','waived','failed'))
);

ALTER TABLE public.fail_kit_requests ENABLE ROW LEVEL SECURITY;

-- Public: insert only (no auth required — submitted from the public site)
CREATE POLICY "Anyone can submit a fail kit request"
  ON public.fail_kit_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated admins: full access (guarded by has_role helper)
CREATE POLICY "Admins can read fail kit requests"
  ON public.fail_kit_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fail kit requests"
  ON public.fail_kit_requests FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fail kit requests"
  ON public.fail_kit_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT                         ON public.fail_kit_requests TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.fail_kit_requests TO authenticated;
GRANT ALL                            ON public.fail_kit_requests TO service_role;

-- Auto-update updated_at (reuses existing helper from booking_requests migration)
CREATE TRIGGER fail_kit_requests_updated_at
  BEFORE UPDATE ON public.fail_kit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Human-readable request numbering: FK-00001, FK-00002, … ─────────────────

CREATE SEQUENCE IF NOT EXISTS public.fail_kit_request_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.set_fail_kit_request_number()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'FK-' || lpad(nextval('public.fail_kit_request_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fail_kit_requests_set_number
  BEFORE INSERT ON public.fail_kit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_fail_kit_request_number();

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_fail_kit_requests_status     ON public.fail_kit_requests(status);
CREATE INDEX IF NOT EXISTS idx_fail_kit_requests_urgency    ON public.fail_kit_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_fail_kit_requests_created_at ON public.fail_kit_requests(created_at DESC);

-- ── Register Fail Kit as a service ($19, promo-code enabled) ───────────────

INSERT INTO public.services
  (service_name, service_key, category, price, accepts_promo_codes, active, sort_order)
VALUES
  ('Fail Kit', 'fail_kit', 'report', 19, true, true, 6)
ON CONFLICT (service_key) DO NOTHING;

-- Allow promo codes to target the fail_kit service
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_service_key_check;
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_service_key_check
  CHECK (service_key = ANY (ARRAY[
    'valley_report','founder_call','startup_autopsy','emergency_session',
    'three_month_plan','fail_kit','all_services'
  ]::text[]));
