# Database data migration and local snapshots

**Status:** Operational reference for platform exit and day-to-day debugging.

**Related:** [platform-exit-runbook.md](platform-exit-runbook.md) Phase 3, [backup-restore-drill.md](backup-restore-drill.md), [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md).

---

## Three Supabase projects

| Ref | Role |
|-----|------|
| `edgbwdecaoottowliimu` | Legacy **Lovable-managed** prod (historical pg_cron URLs in old migrations) |
| `ksplyxxdvandkwzundql` | Owned **holzen-staging** |
| `geqkxsnyqvhtascjghuu` | Owned **holzen-prod** |

**Schema** always comes from Git: `supabase db push` replays `supabase/migrations/*.sql`.

**Data** is separate — only needed when live users/subscriptions still live on the legacy project and owned prod is empty.

---

## When you need a data migration

Run row-count sanity checks on both projects (SQL Editor):

```sql
SELECT count(*) AS users FROM auth.users;
SELECT count(*) FROM public.profiles;
SELECT count(*) FROM public.pause_instances;
```

| Situation | Action |
|-----------|--------|
| Owned prod already has users (claimed/transferred project) | **Skip pg_dump** — verify secrets and DNS only |
| Legacy has data, owned prod is empty | One-time cutover (below) |
| Local dev only | `npm run supabase:reset` + optional pull from staging |

**Prefer claim/transfer first:** Supabase Dashboard on the Lovable project → transfer to your org. If the project ref and data stay intact, you avoid pg_dump entirely.

---

## One-time prod cutover (legacy → owned)

### Before you start

1. **Freeze writes** on legacy prod (maintenance banner / read-only window).
2. **Schema on target:** `npx supabase link --project-ref geqkxsnyqvhtascjghuu` then `supabase db push`.
3. **Bootstrap vault + crons:** [bootstrap-owned-project.sql](bootstrap-owned-project.sql), [cron-setup.md](cron-setup.md).
4. **Deploy edges + secrets** on prod per [production-supabase-setup.md](production-supabase-setup.md).
5. Copy [`.env.db.example`](../../.env.db.example) → `.env.db.local` with session-pooler URIs (port **5432**).

### Run migration

Requires **Git Bash / WSL / macOS / Linux** and `pg_dump` + `psql` on PATH:

```bash
npm run db:migrate-prod
# non-interactive:
CONFIRM=1 npm run db:migrate-prod
```

Script: [`scripts/migrate-prod-data.sh`](../../scripts/migrate-prod-data.sh)

**What it does:**

1. Dumps `auth.users` + `auth.identities` (preserves UUIDs for FKs)
2. Dumps `public` data-only, excluding:
   - Tier B tables dropped at pause-first launch (`user_badges`, `practice_entries`, …)
   - Telemetry tables by default (`analytics_events`, `generation_attempts`, …)
3. Remaps legacy `content_library` → `companion_catalog`
4. Restores into `NEW_DATABASE_URL`
5. Saves artifacts under `backups/migrate-prod-<timestamp>/` (gitignored)

Set `INCLUDE_TELEMETRY=1` to also migrate telemetry tables.

### Not included in pg_dump

| Item | Recovery |
|------|----------|
| Storage bucket files | Supabase Storage CLI / manual copy between projects |
| Edge secrets | Password manager → Supabase Dashboard |
| Vault secrets (`holzen_cron_service_role`, …) | [bootstrap-owned-project.sql](bootstrap-owned-project.sql) |
| pg_cron schedules | [cron-setup.md](cron-setup.md) / `npm run staging:reschedule-crons` pattern for prod |
| Realtime publications | Re-apply `ALTER PUBLICATION` if you added custom tables |

### After restore

1. Row-count verification on prod
2. Vercel `VITE_SUPABASE_*` → redeploy
3. Stripe live webhook → `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook`
4. Google OAuth redirect URLs
5. Smoke: login, pause, subscription portal

---

## Local snapshots (staging / prod → Docker)

For debugging with real-ish data without touching prod schema:

```bash
# 1. Schema locally
npm run supabase:reset

# 2. Pull snapshot (PII — never commit backups/)
npm run db:pull:staging
# or: npm run db:pull:prod

# 3. Restore into local stack
npm run db:restore:local -- backups/pull-staging-<timestamp>
npm run dev:local
```

Scripts:

| npm script | Script |
|------------|--------|
| `db:pull:staging` | [`scripts/db-pull-remote.sh`](../../scripts/db-pull-remote.sh) staging |
| `db:pull:prod` | [`scripts/db-pull-remote.sh`](../../scripts/db-pull-remote.sh) prod |
| `db:restore:local` | [`scripts/db-restore-local.sh`](../../scripts/db-restore-local.sh) |

Add `--include-telemetry` when invoking the shell script directly for full telemetry tables.

**Default dev path (no remote pull):** `npm run supabase:reset` + `npm run dev:staging` hits hosted staging API — enough for most feature work.

---

## Lovable editor-only reminder

Lovable changes **work** for UI when:

- Edits land on `feature/*` → PR → `staging` → `main`
- Lovable does **not** auto-sync SQL/functions to any Supabase project
- Lovable preview uses **staging** `VITE_SUPABASE_*`, not Lovable Cloud DB

See [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md) § Optional Lovable editor.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `relation already exists` on restore | Target already has data — truncate or use empty project after `db push` only |
| `column … does not exist` | Schema mismatch — ensure target ran latest migrations before data restore |
| `content_library` vs `companion_catalog` | Migration script remaps automatically; re-run catalog dump if needed |
| `pg_dump: command not found` | Install [PostgreSQL client tools](https://www.postgresql.org/download/) |
| Restore fails on Windows cmd | Use **Git Bash** (same as `npm run check:prepush`) |
