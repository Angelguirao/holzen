-- Partial index for CompanionFeedback dedup queries.
-- The query filters analytics_events by metadata->>'reflection_id' and
-- metadata->>'companion_type' for event = 'companion_feedback', which
-- previously did a full table scan. This index makes it O(log n).
CREATE INDEX IF NOT EXISTS idx_analytics_events_feedback
  ON public.analytics_events ((metadata->>'reflection_id'), (metadata->>'companion_type'))
  WHERE event = 'companion_feedback';
