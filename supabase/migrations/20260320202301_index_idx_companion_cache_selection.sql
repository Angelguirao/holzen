
-- =============================================
-- Phase 1: Companion System Schema Evolution
-- =============================================

-- 1. Expand companion_cache with richer metadata
ALTER TABLE public.companion_cache
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS title_norm text,
  ADD COLUMN IF NOT EXISTS topic_slug text,
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS source_kind text,
  ADD COLUMN IF NOT EXISTS source_title text,
  ADD COLUMN IF NOT EXISTS source_author text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_host text,
  ADD COLUMN IF NOT EXISTS citations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS market_regime text,
  ADD COLUMN IF NOT EXISTS emotion_bucket text,
  ADD COLUMN IF NOT EXISTS automated_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_flags jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbs_up integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbs_down integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_served_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Index for cache selection queries
CREATE INDEX IF NOT EXISTS idx_companion_cache_selection
  ON public.companion_cache (companion_type, quality_score DESC, used_count ASC, last_served_at ASC NULLS FIRST)
  WHERE quality_score >= 2;

-- Index for dedup by fingerprint
CREATE INDEX IF NOT EXISTS idx_companion_cache_fingerprint
  ON public.companion_cache (fingerprint)
  WHERE fingerprint IS NOT NULL;

-- Index for dedup by title_norm
CREATE INDEX IF NOT EXISTS idx_companion_cache_title_norm
  ON public.companion_cache (companion_type, title_norm)
  WHERE title_norm IS NOT NULL;

-- Index for TTL cleanup
CREATE INDEX IF NOT EXISTS idx_companion_cache_expires
  ON public.companion_cache (expires_at)
  WHERE expires_at IS NOT NULL;

-- 2. Create companion_serves table (tracks exactly what each user saw)
CREATE TABLE public.companion_serves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reflection_id uuid REFERENCES public.reflections(id) ON DELETE SET NULL,
  companion_type text NOT NULL,
  serve_source text NOT NULL CHECK (serve_source IN ('live', 'cache', 'curated', 'empty')),
  cache_entry_id uuid REFERENCES public.companion_cache(id) ON DELETE SET NULL,
  content_fingerprint text,
  content_title text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_serves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own serves"
  ON public.companion_serves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role inserts from edge functions, so no authenticated INSERT policy needed
-- But allow edge functions via service role

CREATE INDEX idx_companion_serves_user_recency
  ON public.companion_serves (user_id, companion_type, created_at DESC);

CREATE INDEX idx_companion_serves_cache_entry
  ON public.companion_serves (cache_entry_id)
  WHERE cache_entry_id IS NOT NULL;

-- 3. Create generation_attempts table (latency, cost, failure tracking)
CREATE TABLE public.generation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_type text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  attempt_order integer NOT NULL DEFAULT 1,
  status text NOT NULL CHECK (status IN ('success', 'failure', 'timeout', 'quality_rejected')),
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  error_message text,
  quality_gate_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_attempts ENABLE ROW LEVEL SECURITY;

-- No user-facing reads needed; this is internal observability
-- Service role only access

CREATE INDEX idx_generation_attempts_type_time
  ON public.generation_attempts (companion_type, created_at DESC);

CREATE INDEX idx_generation_attempts_status
  ON public.generation_attempts (status, created_at DESC);
