
CREATE OR REPLACE FUNCTION public.get_holzen_number()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE outcome IS NOT NULL),
    'held_steady', COUNT(*) FILTER (WHERE outcome IN ('hold', 'nothing')),
    'percent', CASE 
      WHEN COUNT(*) FILTER (WHERE outcome IS NOT NULL) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE outcome IN ('hold', 'nothing'))::numeric /
         COUNT(*) FILTER (WHERE outcome IS NOT NULL)::numeric) * 100
      )
    END,
    'calculated_at', now()
  )
  FROM reflections
  WHERE created_at >= (now() AT TIME ZONE 'UTC')::date
    AND outcome IS NOT NULL;
$$;
