
-- Tighten INSERT policy: require valid-looking email and non-empty answers
DROP POLICY IF EXISTS "Anyone can submit an assessment" ON public.founder_assessments;

CREATE POLICY "Anyone can submit a valid assessment"
ON public.founder_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND answers IS NOT NULL
  AND jsonb_typeof(answers) = 'object'
  AND risk_score BETWEEN 0 AND 100
);

-- Explicitly ensure no client role can read submissions. RLS already denies by
-- default with no SELECT policy, but revoke table-level grants too as defense
-- in depth so even a future permissive policy can't accidentally expose data.
REVOKE SELECT, UPDATE, DELETE ON public.founder_assessments FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.founder_assessments FROM authenticated;

-- Keep INSERT grant for submission flow
GRANT INSERT ON public.founder_assessments TO anon, authenticated;
GRANT ALL ON public.founder_assessments TO service_role;
