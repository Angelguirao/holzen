-- Roll up zoom_out + zoom_out_deep_time in feedback stats so the admin dashboard
-- shows one "Zoom Out" line (matches how users think about the feature; historical
-- events used cache_type zoom_out_deep_time incorrectly for all zoom thumbs).

CREATE OR REPLACE VIEW public.v_companion_feedback_ratio AS
SELECT
  CASE
    WHEN COALESCE(metadata->>'cache_type', metadata->>'companion_type') IN ('zoom_out', 'zoom_out_deep_time')
    THEN 'zoom_out'
    ELSE COALESCE(metadata->>'cache_type', metadata->>'companion_type')
  END AS companion_type,
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
GROUP BY 1;

ALTER VIEW public.v_companion_feedback_ratio SET (security_invoker = true);

-- Daily feedback breakdown: same zoom merge so period stats match the ratio view
CREATE OR REPLACE VIEW public.v_companion_feedback_per_day AS
SELECT
  DATE(created_at) AS day,
  CASE
    WHEN COALESCE(metadata->>'cache_type', metadata->>'companion_type') IN ('zoom_out', 'zoom_out_deep_time')
    THEN 'zoom_out'
    ELSE COALESCE(metadata->>'cache_type', metadata->>'companion_type')
  END AS companion_type,
  metadata->>'vote' AS vote,
  COUNT(*) AS vote_count
FROM analytics_events
WHERE event = 'companion_feedback'
  AND metadata->>'vote' IS NOT NULL
  AND created_at >= now() - interval '90 days'
GROUP BY DATE(created_at), 2, metadata->>'vote'
ORDER BY day DESC;

ALTER VIEW public.v_companion_feedback_per_day SET (security_invoker = true);
