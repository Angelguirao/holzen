-- Normalize reflections.outcome values so "hold" and "held" mean the same thing.
--
-- Background: two writers disagreed on the string for a hold outcome.
--   - src/components/OutcomePrompt.tsx (library "What did you do?" prompt)
--     writes 'held', matching the majority of TS analytics (DecisionQualityCard,
--     StatsTrends, PeriodComparison, BadgesPanel, MilestoneTimeline,
--     VolatilityToleranceCard, use-holzen-score, skill-detection, and the
--     weekly-digest / monthly-report / reflection-insights edge functions).
--   - src/components/BulkHoldCard.tsx (home "X pauses while you were away"
--     bulk action) wrote 'hold'.
--   - public.get_holzen_number() counted 'hold' + 'nothing', so it excluded
--     every 'held' outcome logged from the library and only credited bulk
--     holds from home.
--
-- The frontend has been updated to write 'held' in both places. This migration:
--   1) Backfills historical rows from 'hold' -> 'held'.
--   2) Replaces get_holzen_number() to count 'held' + 'nothing'.

-- 1) Backfill existing data.
UPDATE public.reflections
SET outcome = 'held'
WHERE outcome = 'hold';

-- 2) Keep the Holzen number in sync with the rest of the app.
CREATE OR REPLACE FUNCTION public.get_holzen_number()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE outcome IS NOT NULL),
    'held_steady', COUNT(*) FILTER (WHERE outcome IN ('held', 'nothing')),
    'percent', CASE
      WHEN COUNT(*) FILTER (WHERE outcome IS NOT NULL) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE outcome IN ('held', 'nothing'))::numeric /
         COUNT(*) FILTER (WHERE outcome IS NOT NULL)::numeric) * 100
      )
    END,
    'calculated_at', now()
  )
  FROM reflections
  WHERE created_at >= (now() - interval '7 days')
    AND outcome IS NOT NULL;
$$;
