-- Rewrite pg_cron commands that still target the retired Lovable Cloud project URL.
-- Requires vault secret holzen_project_url = https://<ref>.supabase.co (no trailing slash).
-- See docs/ops/staging-supabase-setup.md §1b and docs/ops/cron-setup.md.

SET search_path = public;

DO $$
DECLARE
  v_url text;
  v_legacy text := 'https://edgbwdecaoottowliimu.supabase.co';
  v_updated int;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'holzen_project_url'
  LIMIT 1;

  IF v_url IS NULL OR btrim(v_url) = '' THEN
    RAISE NOTICE 'Skip pg_cron URL rewrite: vault secret holzen_project_url not set';
    RETURN;
  END IF;

  v_url := rtrim(btrim(v_url), '/');

  UPDATE cron.job
  SET command = replace(command, v_legacy, v_url)
  WHERE command LIKE '%' || v_legacy || '%';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'pg_cron URL rewrite: % job(s) updated to %', v_updated, v_url;
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron not available — skip URL rewrite';
END$$;
