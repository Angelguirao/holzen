
-- Custom ritual templates created by users
CREATE TABLE public.ritual_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ritual_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ritual templates"
  ON public.ritual_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add steps_completed JSONB to ritual_completions for tracking per-step data
ALTER TABLE public.ritual_completions
  ADD COLUMN IF NOT EXISTS steps_completed JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_template_id UUID REFERENCES public.ritual_templates(id) ON DELETE SET NULL;

-- Trigger to update updated_at on ritual_templates
CREATE TRIGGER update_ritual_templates_updated_at
  BEFORE UPDATE ON public.ritual_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
