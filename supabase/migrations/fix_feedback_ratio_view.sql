-- Fix v_companion_feedback_ratio to read from analytics_events (where feedback is actually stored)
-- instead of companion_cache.thumbs_up/thumbs_down (which are never populated).
--
-- The CompanionFeedback component writes to analytics_events with:
--   event = 'companion_feedback'
--   metadata = { companion_type, cache_type, vote: 'up'|'down', cache_id, reflection_id }

CREATE OR REPLACE VIEW public.v_companion_feedback_ratio AS
SELECT
  metadata->>'companion_type' AS companion_type,
  COUNT(*) FILTER (WHERE metadata->>'vote' = 'up') AS total_thumbs_up,
  COUNT(*) FILTER (WHERE metadata->>'vote' = 'down') AS total_thumbs_down,
  COUNT(*) AS items_with_feedback,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->>'vote' = 'up')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS approval_pct
FROM analytics_events
WHERE event = 'companion_feedback'
  AND metadata->>'vote' IS NOT NULL
GROUP BY metadata->>'companion_type';

ALTER VIEW public.v_companion_feedback_ratio SET (security_invoker = true);
