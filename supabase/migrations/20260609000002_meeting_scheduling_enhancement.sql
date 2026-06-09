-- ============================================================
-- meeting_scheduling_enhancement
-- Adds session_instructions, calendar readiness fields,
-- updates meeting method defaults, and activity log triggers
-- for advisory sessions.
-- ============================================================

-- ── advisory_sessions: new columns ───────────────────────────

ALTER TABLE public.advisory_sessions
  ADD COLUMN IF NOT EXISTS session_instructions text,
  ADD COLUMN IF NOT EXISTS calendar_event_id    text,
  ADD COLUMN IF NOT EXISTS calendar_provider    text;

-- Calendar provider check constraint
ALTER TABLE public.advisory_sessions
  DROP CONSTRAINT IF EXISTS advisory_sessions_calendar_provider_check;

ALTER TABLE public.advisory_sessions
  ADD CONSTRAINT advisory_sessions_calendar_provider_check
  CHECK (
    calendar_provider IS NULL OR
    calendar_provider IN ('google_calendar', 'microsoft_calendar', 'calendly')
  );

-- Default meeting_method to Google Meet
ALTER TABLE public.advisory_sessions
  ALTER COLUMN meeting_method SET DEFAULT 'Google Meet';

ALTER TABLE public.booking_requests
  ALTER COLUMN meeting_method SET DEFAULT 'Google Meet';

-- ── Activity log trigger for advisory_sessions ─────────────

CREATE OR REPLACE FUNCTION public.advisory_sessions_activity_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Session created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
    VALUES (
      'session_created',
      'advisory_session',
      NEW.id::text,
      'تم إنشاء جلسة لـ ' || NEW.founder_name,
      jsonb_build_object(
        'founder_name',  NEW.founder_name,
        'session_type',  NEW.session_type,
        'meeting_method', NEW.meeting_method
      )
    );
    RETURN NEW;
  END IF;

  -- Updates
  IF TG_OP = 'UPDATE' THEN

    -- Meeting link added
    IF (OLD.meeting_link IS NULL OR OLD.meeting_link = '') AND
       (NEW.meeting_link IS NOT NULL AND NEW.meeting_link <> '') THEN
      INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
      VALUES (
        'meeting_link_added',
        'advisory_session',
        NEW.id::text,
        'تم إضافة رابط الاجتماع لجلسة ' || NEW.founder_name,
        jsonb_build_object(
          'founder_name',  NEW.founder_name,
          'meeting_method', NEW.meeting_method,
          'meeting_link',   NEW.meeting_link
        )
      );

    -- Meeting link updated
    ELSIF (OLD.meeting_link IS NOT NULL AND OLD.meeting_link <> '') AND
          (NEW.meeting_link IS NOT NULL AND NEW.meeting_link <> '') AND
          OLD.meeting_link <> NEW.meeting_link THEN
      INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
      VALUES (
        'meeting_link_updated',
        'advisory_session',
        NEW.id::text,
        'تم تحديث رابط الاجتماع لجلسة ' || NEW.founder_name,
        jsonb_build_object(
          'founder_name',  NEW.founder_name,
          'meeting_method', NEW.meeting_method,
          'new_link',       NEW.meeting_link
        )
      );
    END IF;

    -- Session rescheduled (scheduled_at changed)
    IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at AND NEW.scheduled_at IS NOT NULL THEN
      INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
      VALUES (
        'session_rescheduled',
        'advisory_session',
        NEW.id::text,
        'تم إعادة جدولة جلسة ' || NEW.founder_name,
        jsonb_build_object(
          'founder_name',    NEW.founder_name,
          'old_scheduled_at', OLD.scheduled_at,
          'new_scheduled_at', NEW.scheduled_at
        )
      );
    END IF;

    -- Session cancelled
    IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'cancelled' THEN
      INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
      VALUES (
        'session_cancelled',
        'advisory_session',
        NEW.id::text,
        'تم إلغاء جلسة ' || NEW.founder_name,
        jsonb_build_object(
          'founder_name', NEW.founder_name,
          'session_type', NEW.session_type
        )
      );
    END IF;

    -- Session completed
    IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'completed' THEN
      INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
      VALUES (
        'session_completed',
        'advisory_session',
        NEW.id::text,
        'تم إكمال جلسة ' || NEW.founder_name,
        jsonb_build_object(
          'founder_name', NEW.founder_name,
          'session_type', NEW.session_type
        )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS advisory_sessions_activity_log_trigger ON public.advisory_sessions;
CREATE TRIGGER advisory_sessions_activity_log_trigger
  AFTER INSERT OR UPDATE ON public.advisory_sessions
  FOR EACH ROW EXECUTE FUNCTION public.advisory_sessions_activity_log();
