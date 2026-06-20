-- ============================================================
-- valley_leads — Phase 1 workflow tracking
--
-- Adds the columns needed to track a founder's progress through
-- the Valley diagnostic in real time (not just at completion),
-- and to record interest in a session CTA (as opposed to the
-- report CTA, which already has its own requested_report flag).
-- ============================================================

ALTER TABLE public.valley_leads
  ADD COLUMN IF NOT EXISTS current_step        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_score_so_far    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requested_session    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_intent       text;
