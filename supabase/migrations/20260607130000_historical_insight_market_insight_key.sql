-- Pre-release: rename Look Back fallback/cache JSON key btcInsight -> marketInsight.
-- Client and edges dual-read legacy rows until this migration runs.

UPDATE public.companion_fallbacks
SET payload = (payload - 'btcInsight') || jsonb_build_object('marketInsight', payload->'btcInsight')
WHERE pool_type = 'history'
  AND payload ? 'btcInsight'
  AND NOT (payload ? 'marketInsight');

UPDATE public.companion_cache
SET content = (content - 'btcInsight') || jsonb_build_object('marketInsight', content->'btcInsight')
WHERE companion_type = 'historical_insight'
  AND content ? 'btcInsight'
  AND NOT (content ? 'marketInsight');
