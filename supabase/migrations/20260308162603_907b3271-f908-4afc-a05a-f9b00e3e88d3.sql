
-- Add category to signal_sources (signal vs learning)
ALTER TABLE public.signal_sources ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'signal';

-- Add category to user_signal_preferences  
ALTER TABLE public.user_signal_preferences ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'signal';

-- Update existing signal_sources with appropriate categories based on type
-- Books and research-oriented sources → learning
UPDATE public.signal_sources SET category = 'learning' WHERE type IN ('book');
