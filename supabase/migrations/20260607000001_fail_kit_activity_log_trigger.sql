-- ============================================================
-- fail_kit_requests — log "Fail Kit Requested" on creation
-- (status-change events — Approved/Delivered/Closed — are
--  already logged by executeTransition's activity_log insert)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_fail_kit_requested()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_log (action, entity_type, entity_id, description, metadata)
  VALUES (
    'fail_kit_requested',
    'fail_kit_request',
    NEW.id::text,
    'طلب حقيبة فشل جديد من ' || NEW.full_name,
    jsonb_build_object('request_number', NEW.request_number, 'email', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER fail_kit_requests_log_requested
  AFTER INSERT ON public.fail_kit_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_fail_kit_requested();
