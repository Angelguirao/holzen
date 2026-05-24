# Backup / Restore Drill — Quarterly

Untested backups don't exist. Run this drill every 3 months; document outcomes in an entry at the bottom.

## Scope

**After platform exit:** Holzen uses **owned Supabase projects** (staging + prod). Use the Supabase Dashboard for PITR, backups, and restore drills. See [production-supabase-setup.md](production-supabase-setup.md) and [staging-supabase-setup.md](staging-supabase-setup.md).

**Before exit (legacy):** Lovable-managed Supabase limited direct dashboard access until the project was claimed. That path is deprecated — [platform-exit-runbook.md](platform-exit-runbook.md).

Data categories:

| Data | Primary store | Backup mechanism | Restore mechanism |
|---|---|---|---|
| Postgres schema + rows | Supabase Postgres | Daily automatic PITR (Supabase plan) | Supabase Dashboard → Database → Backups |
| Edge function source | Git (this repo) | Git history | `git checkout` + redeploy via CI / `supabase functions deploy` |
| Edge function secrets | Supabase Edge secrets | **Manual only** — record in a password manager | Paste back into Supabase Dashboard → Edge Functions → Secrets |
| Frontend build | Vercel deployment history | Vercel retains prior deployments | Vercel Instant Rollback to previous production deploy |
| Sentry events | Sentry | Vendor-owned | — |
| PostHog events | PostHog | Vendor-owned | — |
| BetterStack logs | BetterStack | Vendor retention (tier-dependent) | — |
| Audit log | `audit_log` table | Same as other Postgres rows | Same as DB restore |

Frontend static assets are reproducible from Git + Vercel; no separate asset backup needed.

## Quarterly drill — DB PITR

**Preconditions:** Owned Supabase project with dashboard access (staging clone recommended for drills).

1. **Pick a restore point** ~1 hour before now.
2. **PITR restore** to a **new** staging project: Supabase Dashboard → Database → Backups → Point in Time → choose timestamp → restore.
3. **Verify row counts** on the restored project against expected:
   - `auth.users` count stable.
   - `pause_instances` count.
   - `companion_serves` count.
   - `generation_attempts` count (last 24h).
   - `audit_log` count (last 7 days).
4. **Sanity check a user journey** — recent `user_id` from `audit_log`; confirm `pause_instances` and `companion_serves` rows exist.
5. **Tear down** the drill staging project when done.
6. **Record the drill** in the log at the bottom of this doc.

**Target RTO:** 4 hours to a functional staging restore. **Target RPO:** 1 hour of data loss max.

## Quarterly drill — Edge secrets

Supabase Edge secrets are not exported automatically.

1. Open **Supabase Dashboard → Edge Functions → Secrets** (prod; mirror checklist for staging).
2. Verify each of these is present (list should match [observability-setup.md](observability-setup.md)):
   - `SENTRY_DSN_EDGES`, `SENTRY_RELEASE`, `SENTRY_ENVIRONMENT`
   - `LOG_DRAIN_URL`, `LOG_DRAIN_TOKEN`
   - `SLACK_WEBHOOK_URL`
   - `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`
   - `GOOGLE_AI_API_KEY`, `OPENROUTER_API_KEY` (optional failover)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `PERPLEXITY_API_KEY`, `CRON_SECRET`
   - Vault: `holzen_cron_service_role` for pg_cron HTTP auth
3. Confirm each value is also stored in the team password manager.
4. **Vercel:** confirm `VITE_*` observability vars match [observability-setup.md](observability-setup.md).

## Quarterly drill — Source code

`git clone` sanity — confirms we can rebuild from scratch:

1. Clone into a throwaway directory.
2. `npm install && npm run build`. Build must succeed (set `VITE_SUPABASE_*` or use hosted fallbacks per README).
3. `npm run test`. Full test suite must pass.
4. `npm run check:edge`. Deno type checking passes on all edge functions (when Deno installed).

## If a real restore is needed (non-drill)

Follow the same PITR steps, but skip "tear down". Instead:

1. Point Vercel production env at the restored Supabase URL/keys **or** promote the restored project per your runbook.
2. Re-sync Edge secrets from the password manager.
3. Re-run pg_cron schedules via SQL (see [cron-setup.md](cron-setup.md)) — cron jobs do **not** survive PITR automatically.
4. Verify `SENTRY_DSN_EDGES` and `VITE_SENTRY_DSN` still target the correct Sentry project.
5. Notify users in-app if downtime exceeded 10 min.

## Drill log

| Date (UTC) | Outcome | Notes / issues |
|---|---|---|
| _(populate on first drill)_ | | |

