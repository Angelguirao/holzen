-- Append-only: v_pause_full — flag brief ritual instances for stats (ratio brief vs deep).
-- Matches `pause_evaluate_transitions` brief detection on `initial_emotion_logged.payload.brief_ritual`.

CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT
  pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged')) AS has_shift_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged')) AS has_outcome_logged,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_mood,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_mood,
  (SELECT payload->>'outcome' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged' ORDER BY e.created_at DESC LIMIT 1) AS outcome,
  (SELECT payload->>'text' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated' ORDER BY e.created_at DESC LIMIT 1) AS note_text,
  (SELECT ARRAY(SELECT jsonb_array_elements_text(payload->'tags')) FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'tag_updated' ORDER BY e.created_at DESC LIMIT 1) AS tags,
  COALESCE((SELECT (payload->>'is_favorite')::boolean FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'favorite_toggled' ORDER BY e.created_at DESC LIMIT 1), false) AS is_favorite,
  (SELECT count(*) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true)::int AS counted_companion_count,
  (SELECT COALESCE(array_agg(DISTINCT ce.companion_type), ARRAY[]::text[]) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true) AS counted_companion_types,
  (SELECT content->>'message' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text' LIMIT 1) AS reflection_text,
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku' LIMIT 1) AS haiku_text,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS initial_emotion_intensity,
  (SELECT NULLIF(trim(both from (e.payload->>'shift_intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity,
  (EXISTS (
    SELECT 1
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id
       AND e.step_type = 'initial_emotion_logged'
       AND (
         (e.payload->'brief_ritual') = 'true'::jsonb
         OR lower(trim(COALESCE(e.payload->>'brief_ritual', ''))) IN ('true', 't', '1')
       )
  )) AS is_brief_ritual
FROM public.pause_instances pi;

COMMENT ON VIEW public.v_pause_full IS
  'Rich join of pause_instances + step presence + companion counts + artifact text + latest mood/intensity from step payloads. is_brief_ritual: any initial_emotion_logged tags brief_ritual (same predicate as pause_evaluate_transitions).';

-- Dependent views select vf.* from v_pause_full; PostgreSQL does not auto-extend their
-- column lists when the base view gains columns — recreate so archive queries see is_brief_ritual.

CREATE OR REPLACE VIEW public.v_pause_archive_pauses AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND NOT (
    (
      vf.state = 'expired'
      AND vf.engaged_at IS NULL
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
    OR (vf.state = 'dismissed' AND vf.engaged_at IS NULL)
  );

ALTER VIEW public.v_pause_archive_pauses SET (security_invoker = true);

COMMENT ON VIEW public.v_pause_archive_pauses IS
  'Archive Pauses tab: `v_pause_full` rows excluding open states and echo-only instances.';

GRANT SELECT ON public.v_pause_archive_pauses TO authenticated;
GRANT SELECT ON public.v_pause_archive_pauses TO service_role;

CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND vf.engaged_at IS NULL
  AND (
    vf.state = 'dismissed'
    OR (
      vf.state = 'expired'
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  );

ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);

COMMENT ON VIEW public.v_pause_archive_echoes IS
  'Archive Echoes tab: `v_pause_full` echo-eligible instances (terminal, never engaged).';

GRANT SELECT ON public.v_pause_archive_echoes TO authenticated;
GRANT SELECT ON public.v_pause_archive_echoes TO service_role;
