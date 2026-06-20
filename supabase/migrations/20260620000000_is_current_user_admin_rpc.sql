-- ============================================================
-- is_current_user_admin() — fast, security-definer admin check
--
-- The client-side `checkAdmin()` query (select role from user_roles
-- where user_id = eq AND role = eq) was timing out repeatedly in
-- production (8s+), which cascaded into login/dashboard redirect
-- loops. This RPC moves the lookup server-side:
--   - uses auth.uid() directly, no client-supplied user_id
--   - SECURITY DEFINER + STABLE so the planner can cache the plan
--   - returns a plain boolean, smallest possible payload
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
