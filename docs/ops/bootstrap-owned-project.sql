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

-- After migrations + edge deploy (service_role from Dashboard → Settings → API):
-- SELECT vault.create_secret('<SERVICE_ROLE_JWT>', 'holzen_cron_service_role');

-- If holzen_project_url was added AFTER db push, re-run cron URL rewrite:
-- UPDATE cron.job
-- SET command = replace(command, 'https://edgbwdecaoottowliimu.supabase.co', '<YOUR_PROJECT_URL>')
-- WHERE command LIKE '%edgbwdecaoottowliimu%';
