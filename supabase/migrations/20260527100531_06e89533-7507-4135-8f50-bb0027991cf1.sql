
CREATE TABLE public.founder_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  stage TEXT,
  sector TEXT,
  country TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT,
  blind_spots TEXT[],
  insight TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.founder_assessments TO anon, authenticated;
GRANT ALL ON public.founder_assessments TO service_role;

ALTER TABLE public.founder_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an assessment"
ON public.founder_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
