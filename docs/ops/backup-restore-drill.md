# Backup / Restore Drill — Quarterly

Untested backups don't exist. Run this drill every 3 months; document outcomes in an entry at the bottom.

## Scope

Holzen runs on **Lovable-managed Supabase**. Direct dashboard access is limited, so this drill describes what's possible and what's blocked until we claim the project (`Option A` in the plan's Decision 3).

Data categories:

| Data | Primary store | Backup mechanism | Restore mechanism |
|---|---|---|---|
| Postgres schema + rows | Supabase Postgres | Daily automatic PITR (Supabase default, Lovable tier-dependent) | Request via Lovable support or, once claimed, Supabase Dashboard → Database → Backups |
| Edge function source | Git (this repo) | Git history | `git checkout` + re-sync via Lovable |
| Edge function secrets | Lovable secrets UI | **Manual only** — record in a password manager | Paste back into Lovable secrets UI |
| Sentry events | Sentry | Not our problem (vendor-owned) | — |
| PostHog events | PostHog | Vendor-owned; optional export via PostHog API | — |
| BetterStack logs | BetterStack | Vendor retention (7/30/90 days tier-dependent) | — |
| Audit log | `audit_log` table | Same as other rows | Same |

Frontend static assets are reproducible from Git; no backup needed.

## Quarterly drill — DB PITR

**Preconditions**: You must have (or arrange with Lovable support) the ability to restore to a staging project.

1. **Pick a restore point** ~1 hour before now.
2. **Request a PITR restore** to a staging project. If dashboard access is available, Supabase Dashboard → Database → Backups → Point in Time → choose timestamp → restore to a **new** project. If not, open a support ticket with Lovable (include: project ID, target restore time UTC, reason "quarterly drill").
3. **Verify row counts** on the restored project against expected:
   - `auth.users` count stable (grew since the restore point should reflect).
   - `pause_instances` count (Pause V2 canonical pause rows).
   - `companion_serves` count.
   - `generation_attempts` count (last 24h).
   - `audit_log` count (last 7 days).
4. **Sanity check a user journey**:
   - Pick a recent `user_id` from `audit_log`.
   - `SELECT * FROM pause_instances WHERE user_id = '<id>' ORDER BY created_at DESC LIMIT 5;` — rows exist.
   - `SELECT * FROM companion_serves WHERE user_id = '<id>' ORDER BY created_at DESC LIMIT 5;` — rows exist.
5. **Tear down the staging project** (or let it auto-expire if Lovable trial).
6. **Record the drill** in the log at the bottom of this doc.

**Target RTO**: 4 hours to a functional staging restore. **Target RPO**: 1 hour of data loss max.

## Quarterly drill — Edge secrets

Lovable secrets are not exported automatically.

1. Open Lovable → Cloud → Secrets.
2. Verify each of these is present (list should match `observability-setup.md` inputs):
   - `SENTRY_DSN_EDGES`, `SENTRY_RELEASE`, `SENTRY_ENVIRONMENT`
   - `LOG_DRAIN_URL`, `LOG_DRAIN_TOKEN`
   - `SLACK_WEBHOOK_URL`
   - `LOVABLE_API_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `PERPLEXITY_API_KEY`, `LOVABLE_API_KEY` (or whichever model keys are in use)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (set automatically by platform)
   - Vault: `holzen_cron_service_role` for pg_cron HTTP auth
3. Confirm each value is also stored in the team password manager with the entry name = env key name.
4. If an entry is missing from the password manager, add it **before** leaving this drill.

## Quarterly drill — Source code

`git clone` sanity — confirms we can rebuild from scratch:

1. Clone into a throwaway directory.
2. `npm install && npm run build`. Build must succeed with `.env.example` values only (it won't connect to Supabase, but it must compile).
3. `npm run test`. Full test suite must pass.
4. `npm run check:edge`. Deno type checking passes on all edge functions.

## If a real restore is needed (non-drill)

Follow the same steps, but skip "tear down". Instead:

1. Promote the staging project to production (via Lovable support) OR point the frontend at the staging URL temporarily.
2. Re-sync environment secrets from the password manager to the restored project's Lovable Cloud → Secrets.
3. Re-run pg_cron schedules via SQL (see [cron-setup.md](cron-setup.md)) — cron jobs do NOT survive a PITR restore automatically.
4. Verify [Sentry] edge DSN points at the same project (if not, edges on the restored instance emit to the wrong Sentry project — update `SENTRY_DSN_EDGES`).
5. Notify users in-app via an AppShell banner if downtime exceeded 10 min.

## Drill log

| Date (UTC) | Outcome | Notes / issues |
|---|---|---|
| _(populate on first drill)_ | | |
