
CREATE OR REPLACE FUNCTION public.find_similar_reflection(
  _user_id uuid,
  _reflection_id uuid,
  _min_age_days int DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  message text,
  context text,
  mood text,
  outcome text,
  tags text[],
  created_at timestamptz,
  note text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _source_context text;
  _source_created timestamptz;
  _direction text;
  _change_pct numeric;
BEGIN
  -- Get the source reflection
  SELECT r.context, r.created_at
  INTO _source_context, _source_created
  FROM reflections r
  WHERE r.id = _reflection_id AND r.user_id = _user_id;

  IF _source_context IS NULL THEN
    RETURN;
  END IF;

  -- Parse direction from context (e.g. "BTC is down 1.4%")
  IF _source_context ILIKE '%is down%' THEN
    _direction := 'down';
  ELSIF _source_context ILIKE '%is up%' THEN
    _direction := 'up';
  ELSE
    RETURN;
  END IF;

  -- Extract the percentage number
  SELECT (regexp_matches(_source_context, '(?:up|down)\s+(\d+\.?\d*)%', 'i'))[1]::numeric
  INTO _change_pct;

  IF _change_pct IS NULL THEN
    RETURN;
  END IF;

  -- Find the closest matching reflection at least _min_age_days old
  RETURN QUERY
  SELECT
    r.id,
    r.message,
    r.context,
    r.mood,
    r.outcome,
    r.tags,
    r.created_at,
    r.note
  FROM reflections r
  WHERE r.user_id = _user_id
    AND r.id != _reflection_id
    AND r.context IS NOT NULL
    AND r.created_at < (_source_created - make_interval(days => _min_age_days))
    AND (
      (_direction = 'down' AND r.context ILIKE '%is down%')
      OR (_direction = 'up' AND r.context ILIKE '%is up%')
    )
  ORDER BY
    ABS(
      (regexp_matches(r.context, '(?:up|down)\s+(\d+\.?\d*)%', 'i'))[1]::numeric - _change_pct
    ) ASC NULLS LAST,
    r.created_at DESC
  LIMIT 1;
END;
$$;
