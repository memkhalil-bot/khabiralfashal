-- ============================================================
-- fail_kit_requests — Sprint 3B additions for the public
-- request flow: mini-assessment answers + promo code tracking
-- (mirrors promo_code/promo_code_id columns on report_requests
-- and booking_requests).
-- ============================================================

ALTER TABLE public.fail_kit_requests
  ADD COLUMN IF NOT EXISTS mini_assessment_answers jsonb,
  ADD COLUMN IF NOT EXISTS promo_code              text,
  ADD COLUMN IF NOT EXISTS promo_code_id           uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL;
