-- ============================================================
-- booking_session_workflow
-- Extends booking_requests and advisory_sessions for the
-- full Booking → Confirm → Session workflow.
-- ============================================================

-- ── booking_requests: confirmation columns ─────────────────
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS confirmed_date       date,
  ADD COLUMN IF NOT EXISTS confirmed_time       text,
  ADD COLUMN IF NOT EXISTS scheduled_at         timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_method       text,
  ADD COLUMN IF NOT EXISTS meeting_link         text,
  ADD COLUMN IF NOT EXISTS converted_session_id uuid
    REFERENCES public.advisory_sessions(id) ON DELETE SET NULL;

-- ── advisory_sessions: booking source + meeting columns ────
ALTER TABLE public.advisory_sessions
  ADD COLUMN IF NOT EXISTS source_booking_id uuid,
  ADD COLUMN IF NOT EXISTS meeting_method    text,
  ADD COLUMN IF NOT EXISTS meeting_link      text;
