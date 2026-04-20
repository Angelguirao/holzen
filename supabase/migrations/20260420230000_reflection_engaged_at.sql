-- ============================================================================
-- reflections.engaged_at — the timestamp of real user engagement.
--
-- Problem this solves:
--   `created_at` is set when a row is INSERTed into public.reflections. For
--   manual pauses that's ~the moment the user engaged, but for cron-generated
--   rows (source = 'cron_volatility', see 20260420220000) it's the moment the
--   notification fired. If a user acts on a push hours or days later, every
--   stats surface that buckets by `created_at` (streak heatmap, weekly trends,
--   period comparisons) drops that engagement into the wrong day.
--
--   Any surface that counts "completed pauses" currently has to trust that
--   notification dispatch ≈ engagement moment, which is wrong.
--
-- What this migration does:
--   1) Adds reflections.engaged_at timestamptz.
--   2) Installs a BEFORE INSERT/UPDATE trigger that stamps engaged_at the
--      first time `outcome` transitions from null/empty → set. Once written
--      it's stable; subsequent outcome edits don't rewrite it.
--   3) Backfills engaged_at = created_at for every row that already had a
--      recorded outcome at migration time. This is the best approximation we
--      have for historical rows — all manual pauses engaged ≈ created, and
--      pre-existing cron rows that were completed were (almost always)
--      completed very close to creation too. Orphan rows stay NULL.
--   4) Rebuilds v_reflections_completed / v_reflections_engaged so their
--      `SELECT *` captures the new column. (Postgres views bind column lists
--      at creation time, so a plain ALTER TABLE wouldn't expose engaged_at.)
--   5) Adds (user_id, engaged_at DESC) index to support the common query
--      shape: "recent completed pauses for this user."
--
-- Downstream: src/lib/engaged-pause.ts exposes a `pauseTimestamp(r)` helper
-- returning `engaged_at ?? created_at`, and every user-facing time-bucket
-- surface (streak heatmap, weekly trends, period comparison, calendar) uses
-- it instead of touching `created_at` directly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Column
-- ---------------------------------------------------------------------------
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS engaged_at timestamptz;

COMMENT ON COLUMN public.reflections.engaged_at IS
  'First moment the user recorded a decision (outcome transitioned null→set). '
  'NULL for ignored-notification orphans. Prefer this over created_at for any '
  'user-facing time bucket; see src/lib/engaged-pause.ts#pauseTimestamp.';

-- ---------------------------------------------------------------------------
-- 2) Trigger: set engaged_at on the first outcome-set transition.
-- ---------------------------------------------------------------------------
-- Semantics:
--   INSERT with outcome already set      → engaged_at = now()  (manual pause
--                                          path, where client inserts with
--                                          the whole flow in one shot).
--   UPDATE null/empty → non-empty outcome→ engaged_at = now()  (cron row the
--                                          user later engaged with).
--   UPDATE between two non-empty outcomes→ engaged_at unchanged (editing the
--                                          decision shouldn't shift time
--                                          buckets or rewrite history).
--   UPDATE non-empty → null/empty        → engaged_at unchanged (we keep the
--                                          original engagement moment even if
--                                          the user clears the outcome; this
--                                          is conservative and avoids the
--                                          row silently disappearing from
--                                          streaks if an outcome is briefly
--                                          nulled during an edit flow).
--
-- Explicit engaged_at values supplied by the caller are respected (so tests
-- and backfills can seed specific timestamps).
CREATE OR REPLACE FUNCTION public.set_reflection_engaged_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Respect explicit values.
  IF TG_OP = 'INSERT' THEN
    IF NEW.engaged_at IS NOT NULL THEN
      RETURN NEW;
    END IF;
    IF NEW.outcome IS NOT NULL AND NEW.outcome <> '' THEN
      NEW.engaged_at := now();
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.engaged_at IS DISTINCT FROM OLD.engaged_at THEN
    -- caller is explicitly adjusting it; don't overwrite
    RETURN NEW;
  END IF;

  IF OLD.engaged_at IS NULL
     AND NEW.outcome IS NOT NULL AND NEW.outcome <> ''
     AND (OLD.outcome IS NULL OR OLD.outcome = '')
  THEN
    NEW.engaged_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reflections_set_engaged_at ON public.reflections;
CREATE TRIGGER trg_reflections_set_engaged_at
  BEFORE INSERT OR UPDATE ON public.reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reflection_engaged_at();

-- ---------------------------------------------------------------------------
-- 3) Backfill historical rows.
-- ---------------------------------------------------------------------------
-- Best-approximation: rows with a recorded outcome at migration time have
-- engaged_at := created_at. Orphan rows (no outcome) stay NULL — they never
-- counted toward metrics anyway.
UPDATE public.reflections
SET engaged_at = created_at
WHERE engaged_at IS NULL
  AND outcome IS NOT NULL
  AND outcome <> '';

-- ---------------------------------------------------------------------------
-- 4) Rebuild the engagement views so `SELECT *` exposes engaged_at.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_reflections_completed;
CREATE VIEW public.v_reflections_completed AS
SELECT *
FROM public.reflections r
WHERE r.outcome IS NOT NULL
  AND r.outcome <> '';
ALTER VIEW public.v_reflections_completed SET (security_invoker = true);

DROP VIEW IF EXISTS public.v_reflections_engaged;
CREATE VIEW public.v_reflections_engaged AS
SELECT *
FROM public.reflections r
WHERE r.breathing_completed = true
  AND r.mood IS NOT NULL AND r.mood <> ''
  AND r.mood_after IS NOT NULL AND r.mood_after <> ''
  AND r.outcome IS NOT NULL AND r.outcome <> '';
ALTER VIEW public.v_reflections_engaged SET (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 4b) Rebuild v_reflection_with_companions to expose engaged_at to clients.
-- This view has an explicit column list (not SELECT *), so we must re-CREATE
-- it whenever reflections gains a column that UI code needs. The body is a
-- verbatim copy of migration 20260329200000 plus engaged_at; keep them in
-- sync if that view is ever modified again.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_reflection_with_companions;

CREATE VIEW public.v_reflection_with_companions
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.user_id,
  r.message,
  r.context,
  r.created_at,
  r.engaged_at,
  r.is_favorite,
  r.haiku,
  r.outcome,
  r.mood,
  r.note,
  r.tags,
  r.breathing_completed,
  r.haiku_read,
  r.mood_after,
  r.grounding_read,
  r.grounding_title,
  r.grounding_body,
  sc.content ->> 'title' AS signal_title,
  sc.content ->> 'body' AS signal_body,
  sc.content ->> 'source' AS signal_source,
  sc.content ->> 'url' AS signal_url,
  sc.read AS signal_read,
  sc.content ->> 'title' AS companion_signal_title,
  sc.content ->> 'body' AS companion_signal_body,
  sc.content ->> 'source' AS companion_signal_source,
  sc.content ->> 'url' AS companion_signal_url,
  sc.read AS companion_signal_read,
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  hc.content AS history_insight_data,
  hc.read AS history_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  COALESCE(zc.content, zdt.content) AS zoom_out_data,
  COALESCE(zc.read, zdt.read) AS zoom_out_read,
  COALESCE(zc.content, zdt.content) AS companion_zoom_out_data,
  COALESCE(zc.read, zdt.read) AS companion_zoom_out_read,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'signal'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_signal,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'ground_nudge'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_ground_nudge,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'historical_insight'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_historical_insight,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id
      AND cs.companion_type IN ('zoom_out', 'zoom_out_deep_time')
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_zoom_out
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out'
LEFT JOIN reflection_companions zdt ON zdt.reflection_id = r.id AND zdt.companion_type = 'zoom_out_deep_time';

-- ---------------------------------------------------------------------------
-- 5) Index for the common "recent completed pauses for user X" query shape.
-- ---------------------------------------------------------------------------
-- Partial index: only indexes completed rows, matching the queries that
-- consume engaged_at. Orphan rows stay out.
CREATE INDEX IF NOT EXISTS idx_reflections_user_engaged_at
  ON public.reflections (user_id, engaged_at DESC)
  WHERE outcome IS NOT NULL AND outcome <> '';
