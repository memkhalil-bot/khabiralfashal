-- ============================================================
-- Admin roles infrastructure for /admin dashboard
-- Run this once in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/jdbydwyzydjuyjhgepvz/sql/new
-- ============================================================

-- 1. user_roles table
--    Stores which Supabase Auth users have the 'admin' role.
--    Never store roles on the profiles table — keep them here.
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

-- Authenticated users can read their own roles only
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2. has_role() — security-definer helper
--    Queries user_roles with elevated privileges so RLS on
--    other tables can call it without needing a JOIN.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
$$;

-- ============================================================
-- 3. founder_assessments — admin SELECT policy
--    Migration 20260527104926 revoked SELECT from anon/authenticated.
--    We restore SELECT for authenticated but gate it with has_role().
-- ============================================================
GRANT SELECT ON public.founder_assessments TO authenticated;

CREATE POLICY "Admins can read all assessments"
  ON public.founder_assessments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. testimonials — full admin CRUD
--    Public SELECT is already in place (published = true).
--    These policies allow admins to create / update / delete.
-- ============================================================
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;

CREATE POLICY "Admins can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. Seed yourself as admin
--    After running this migration, go to Supabase Dashboard →
--    Authentication → Users, find your user's UUID, then run:
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('<your-user-uuid>', 'admin');
--
--    Or enable email/password sign-up in Auth → Providers,
--    sign up at /admin/login, then insert your UUID above.
-- ============================================================
