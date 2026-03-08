
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  quote text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Users can insert their own testimonial
CREATE POLICY "Users can insert own testimonial"
  ON public.testimonials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own testimonials
CREATE POLICY "Users can view own testimonials"
  ON public.testimonials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can read approved testimonials (for landing page)
CREATE POLICY "Anyone can read approved testimonials"
  ON public.testimonials FOR SELECT TO anon
  USING (approved = true);

-- Users can delete their own testimonials
CREATE POLICY "Users can delete own testimonials"
  ON public.testimonials FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
