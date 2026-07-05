-- One-time bootstrap for owned holzen-staging / holzen-prod (SQL Editor, postgres role).
-- Run holzen_project_url BEFORE `npm run staging:db-push` so pg_cron rewrite migration applies.
-- Replace <PROJECT_REF> and URLs per project.

-- Staging: ksplyxxdvandkwzundql
-- Prod:    geqkxsnyqvhtascjghuu

SELECT vault.create_secret(
  'https://<PROJECT_REF>.supabase.co',
  'holzen_project_url',
  'Owned Supabase project base URL for pg_cron HTTP targets'
);

-- After migrations + edge deploy, store cron bearer in Vault (pick one):
-- SELECT vault.create_secret('<SERVICE_ROLE_JWT>', 'holzen_cron_service_role');
-- SELECT vault.create_secret('<random CRON_SECRET>', 'CRON_SECRET');

-- Reschedule HTTP crons (do NOT rely on UPDATE cron.job — 42501 on hosted):
-- npm run staging:reschedule-crons
