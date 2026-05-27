CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote text NOT NULL,
  author_name text NOT NULL,
  author_role text,
  company text,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published testimonials are viewable by everyone"
ON public.testimonials
FOR SELECT
USING (published = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.testimonials (quote, author_name, author_role, company, order_index) VALUES
('He didn''t tell me what I wanted to hear. He told me what I had been avoiding for eight months. That conversation cost me my pride and saved my company.', 'Founder', 'Series A · FinTech', 'Riyadh', 1),
('Most advisors validate you. He audits you. I walked in pitching a vision and walked out understanding I was running from a decision, not toward one.', 'Co-founder & CEO', 'Seed · B2B SaaS', 'Dubai', 2),
('I thought I needed a strategy. I needed someone to name the thing my team was too polite to say. Ninety minutes. No slides. The clearest I''ve felt in two years.', 'Solo Founder', 'Bootstrapped · Marketplace', 'Cairo', 3),
('You don''t leave the session motivated. You leave the session honest. That''s rarer and worth more.', 'Founder', 'Pre-Seed · Healthtech', 'Jeddah', 4),
('He read my deck for four minutes and asked one question I couldn''t answer. The next month was the hardest and most useful month of the company.', 'CEO', 'Series A · Logistics', 'Riyadh', 5);