# Deployment & Sync Guide

How GitHub merges deploy Holzen to **owned Supabase** + **Vercel**, and how to avoid surprises.

**Repo integration:** This checklist is referenced from [AGENTS.md](../../AGENTS.md) (humans + AI) and enforced for Cursor via [`.cursor/rules/deployment-sync.mdc`](../../.cursor/rules/deployment-sync.mdc) (`alwaysApply`). Run it before every push that touches app code, migrations, or edge functions.

**Branch model:** `feature/* → staging → main`. See [branch-model.md](branch-model.md). **CI/CD map:** [cicd-overview.md](cicd-overview.md). **Platform exit:** [platform-exit-runbook.md](platform-exit-runbook.md) · [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md) (optional Lovable editor only — not prod host).

## What happens on merge / deploy

| Artifact | How it deploys | Goes live when |
|----------|----------------|----------------|
| `supabase/migrations/*.sql` | GitHub Actions `deploy-backend` job → `supabase db push` | After migration apply succeeds on target project |
| `supabase/functions/*/index.ts` | Same job → [`deploy-active-edge-functions.mjs`](../../scripts/deploy-active-edge-functions.mjs) | After edge deploy completes |
| `supabase/config.toml` | Merged into project config on edge deploy | With edge deploy |
| Frontend (`src/`, `index.html`, etc.) | GitHub Actions `deploy-frontend` → [`vercel-ci-deploy.mjs`](../../scripts/vercel-ci-deploy.mjs) **after** backend | After Vercel build succeeds |
| PR previews | Vercel Git integration (automatic; not Actions) | On PR open/sync |

**Key insight:** `main` and `staging` **do not** auto-deploy from Vercel Git ([vercel.json](../../vercel.json) `git.deploymentEnabled`) — Actions runs **backend first, then frontend** so the SPA never races migrations/edges. PR previews on feature branches still auto-deploy via Vercel.

### When CI or Supabase reports a migration error (ownership / “must be owner”)

Migration apply uses the linked Supabase project’s
migration role. If a migration fails with **“must be owner of table …”** (for
example `pause_instances`), the batch can **stop partway**: later migrations
do not run, while the Git tip still moves forward. **Do not** treat edge or
frontend deploy as success until migrations are green.

**What to do:** apply the failing migration (or a corrective migration) using a
role that **owns** the object — typically the Supabase **SQL Editor** as a
dashboard admin, **`supabase db push`** / **`supabase migration up`** with the
linked project and correct credentials, or a one-time
`ALTER TABLE … OWNER TO …` / support ticket if ownership drifted after a
restore. Re-run **`npm run supabase:reset`** locally after fixing historical
files so `check:view-migrations` + full chain stay honest.

## Hosted env files vs Edge secrets

| What | Where it runs | Where you set it (hosted) | When changes take effect |
|------|---------------|---------------------------|---------------------------|
| `VITE_*` | Browser (built SPA) | **Vercel** project env (prod/preview); local `.env` for dev | Next Vercel deploy (or local `npm run dev`) |
| Edge secrets (`GOOGLE_AI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, Stripe keys, …) | Supabase Edge | **Supabase Dashboard → Edge Functions → Secrets** (per project) | Next function invocation after secret update |

**Important:** Files like `.env.example`, `.env.prod`, or `.env` in this repo **only affect the frontend build** when you run Vite locally (or when Vercel/CI loads them). They are **not** read by deployed Edge functions. Configure edge secrets in the **Supabase dashboard** for staging and prod separately.

**Local development only:** `supabase functions serve` can load `supabase/.env` (gitignored). That path does not apply to hosted runs.

## Safe workflow for local / CI development

### 1. Migrations

**Rule:** Never push a migration you haven't tested locally or on staging first.

```sh
# Test locally with Docker
npm run supabase:start
npm run supabase:reset          # re-applies all migrations from scratch

# Verify the migration works
psql "postgresql://postgres:postgres@127.0.0.1:55422/postgres" -f supabase/migrations/XXXX_my_change.sql
```

**Naming:** Supabase sorts migrations lexicographically. Use the timestamp format:
```
supabase/migrations/20260407120000_add_foo_column.sql
```

**Views that wrap `v_pause_full`:** If a migration **`CREATE OR REPLACE`s `public.v_pause_full`** with **new trailing columns**, any view defined as **`SELECT vf.* FROM public.v_pause_full vf …`** (e.g. **`v_pause_archive_pauses`**, **`v_pause_archive_echoes`**) must be **recreated in the same or a follow-up migration** — PostgreSQL does not auto-expand dependent `SELECT *` view column lists. Run **`npm run check:view-migrations`** and follow **`docs/ops/migration-view-safety.md`**.

**Destructive changes (DROP, ALTER TYPE, column removal):**
- Always check that no edge function or frontend code references the removed column/type.
- Deploy code changes **before** (or in the same commit as) the migration that removes what the code no longer uses.
- If you must do it in two steps: first deploy code that stops using the column, then push the migration that drops it.

**Migration conflicts:**
- If two branches both add migrations with similar timestamps, Supabase may reject the second. Rebase or rename the timestamp before merging.

### 2. Edge functions

**Rule:** Every edge function must have a `[functions.<name>]` block in `supabase/config.toml`. Missing entries cause silent 401s or deployment skips.

```toml
# supabase/config.toml — add for every new function
[functions.my-new-function]
verify_jwt = false
```

**Common issues after sync:**
- **401 on invoke** → missing `config.toml` entry, or `verify_jwt` still `true` for a cron/service function.
- **"Function not found"** → the folder name doesn't match the config block name, or the function wasn't deployed (check Cloud → Edge Functions tab).
- **Stale code** → Redeploy from Supabase Dashboard → Edge Functions, or push a trivial commit to re-trigger CI.

**Secrets:** Edge functions read secrets from the Supabase environment, not from repo `.env` files. See [Hosted env files vs Edge secrets](#hosted-env-files-vs-edge-secrets). If you add a new secret dependency:
1. Document it in your PR / commit message.
2. Add the secret via **Supabase Dashboard → Edge Functions → Secrets** **before** the code that uses it goes live (staging first, then prod).
3. If the secret is missing at runtime, the function will fail silently or throw — check Edge Function logs.

### 3. Frontend

Vercel deploys on merge; preview builds run on PRs. Changing `VITE_*` in Vercel requires a redeploy. But:
- If your frontend references a new DB column or edge function, deploy backend/migrations to that environment **before** shipping the frontend that depends on them.
- If you remove a column the frontend still references, users on the old bundle will break until Vercel serves the new build.

See [vercel-frontend-setup.md](vercel-frontend-setup.md).

### 4. config.toml

- **`project_id`** in the checked-in `config.toml` is **not** the frontend target selector. Browser traffic follows `VITE_SUPABASE_*`, while CLI `--linked` commands follow the machine/CI link target from `supabase link --project-ref ...`.
- In this repo, `config.toml` stays checked in with the prod ref; staging work is selected by linking staging locally or in CI.
- Only add `[functions.*]` blocks for new edge functions.
- Don't remove existing function blocks unless you're also deleting the function folder.

## Pre-push checklist

```
□ Local tests pass                          npm run test
□ Production build succeeds                 npm run build (runs **`check:version-sync`** via **`prebuild`**)
□ Lint is clean on changed files            npm run lint
□ View migrations safe (OR REPLACE VIEW)   npm run check:view-migrations
□ Edge functions type-check                 npm run check:edge
□ Edge handlers wrapped for logging         npm run check:edge-logging
□ EdgeCoverage manifest matches config      npm run check:edge-coverage-manifest
□ New migrations tested locally             npm run supabase:reset
□ New edge functions have config.toml entry
□ New secrets documented / already added
□ No destructive DB changes without code-first deploy
□ Frontend doesn't reference columns/functions that don't exist yet
□ **New DB columns used by code** — use `as unknown as T` pattern (see below)
□ **AI provider pricing** — if the last entry in `docs/systems/costs/ai-cost-model.md` §10 is **> 90 days old**, re-verify Perplexity + Google Gemini list prices via Context7, update `DEFAULT_COST_MAP` in `supabase/functions/_shared/observe.ts`, and add a changelog entry. See §1.3 of the cost doc for the drift policy.
```

### Combined local gate (`npm run check:prepush`)

**Why these checks exist:** each guard maps to an architectural capability (pause-first scope, edge observability, modular monolith folders, etc.). See [architectural-fitness-functions.md](../fundamentals/architectural-fitness-functions.md) for the full catalog; this section lists **what to run** before push.

`npm run check:prepush` runs `scripts/pre-push-check.sh`: edge release stamp (**`node scripts/stamp-edge-release.mjs`**, same effect as **`npm run stamp:release`**), **`npm run check:view-migrations`** (unsafe `CREATE OR REPLACE VIEW` patterns), every `supabase/functions/<name>/` has a matching `[functions.<name>]` in `config.toml`, **`npm run check:edge`** (skips if Deno missing), **`npm run check:edge-logging`**, **`npm run check:edge-coverage-manifest`**, **`npm run check:active-surface`**, **`npm run check:no-phase-labels`**, **`npm run check:invoke-edge-allowlist`**, **`npm run check:env-docs`**, **`npm run test`**, **`npm run build`** (which runs **`prebuild`** → **`npm run check:version-sync`**), and (when Docker + Supabase CLI are available) a local **`supabase db reset`**. **Requires `bash`** — on Windows use **Git Bash** or **WSL** (PowerShell alone will not run this script). For the full CI gate (coverage + JUnit), also run **`npm run test:ci`** before high-stakes pushes.

**Optional deeper probe** after changing request logging / `x-cid` behavior: **`npm run smoke:edge-logging`** — OPTIONS each HTTP edge URL and assert `x-cid` round-trip (and optionally BetterStack query when `LOG_DRAIN_QUERY_*` are set). See **`supabase/functions/README.md`**.

### TypeScript types lag behind migrations (build-breaking chicken-and-egg)

**Problem:** `src/integrations/supabase/types.ts` is auto-generated from the **live database**. When a migration adds a column and code references it in the same commit, the types file doesn't include the new column yet → TypeScript `SelectQueryError` → **build fails** → migration and edge function deployment are blocked too (because the build gate prevents deployment).

**Prevention (code pattern):**

When querying columns that were added in a recent migration, cast through `unknown` so the build never breaks on stale types:

```typescript
// ❌ Breaks when types.ts hasn't regenerated yet
const data = result.data as MyRow[];

// ✅ Resilient — works before AND after types catch up
const data = result.data as unknown as MyRow[];
```

Define your own interface for the expected shape and cast through `unknown`. The runtime query will work as long as the migration has been applied; the build won't break even if it hasn't.

**Prevention (workflow):**

1. **Same-commit migrations + code:** Always use `as unknown as T` for queries touching new columns.
2. **Two-commit approach (safest):** Push the migration first, wait for staging/prod to apply it and regenerate types, then push the code that uses the new columns.
3. **Wrap in try/catch** when the table or column genuinely might not exist yet (pre-migration graceful degradation).
4. **`npm run gen:types`** — Regenerates `src/integrations/supabase/types.ts` from the **linked** project (`supabase login` or `SUPABASE_ACCESS_TOKEN`). Run after schema-changing migrations so the repo matches production.

### Migrations that unlock Edge code (same push)

Some Edge functions assume columns already exist — e.g. **`fetch-source-feeds`** orders and updates `signal_sources.last_fetch_feeds_at`, and may insert `content_library.original_url` / `original_publication`. If the deployed function runs **before** those migrations finish, PostgREST can return **400/500** ("column does not exist") on the `signal_sources` select or update.

**Mitigation:**

1. **Normal CI / `db push`** usually applies migrations in timestamp order before traffic hits new code; if you see column errors right after deploy, open **Database → Migrations** and confirm pending migrations are applied, then **re-invoke** the function or redeploy.
2. **High-stakes prod:** Ship **migrations-only** first (or run the SQL from new migration files in the SQL editor), verify schema, then merge the function commit — matches the guide's order-of-operations mindset.
3. **Optional Edge secrets** (no deploy blocker if unset): `FETCH_FEEDS_MAX_SOURCES`, `FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE`, `FETCH_FEEDS_ARTICLE_DELAY_MS` — defaults apply; add in **Supabase → Secrets** only for launch backfills.

**`npm run check:edge`:** Runs `scripts/check-edge.mjs` (`deno check` on every `supabase/functions/*/index.ts` except `_shared`). It resolves the Deno binary from PATH, then `DENO_INSTALL/bin`, then `~/.deno/bin` (official installer default). Uses `--no-lock` so it does not write a root `deno.lock`. If Deno is missing entirely, the script exits 0 with a skip message.

**`npm run check:edge-logging`:** Runs `scripts/check-edge-logging.mjs` — a fast regex guard that HTTP-serving edge entrypoints wrap handlers in `withRequestLogging` (BetterStack + Sentry path). CI runs it via `npm run test:ci`; **`npm run check:prepush`** runs it too.

**`npm run check:view-migrations`:** Runs `scripts/lint-view-migrations.mjs` — fails when a migration would break Postgres by renaming/dropping columns on `CREATE OR REPLACE VIEW` without a prior `DROP VIEW`. **`npm run check:prepush`** runs it first (after the edge release stamp).

**`npm run check:edge-coverage-manifest`:** Runs `scripts/verify-edge-coverage-manifest.mjs` — every `[functions.<name>]` in `supabase/config.toml` must appear in `src/screens/ops/EdgeCoverageScreen.tsx` `COVERAGE` (and extras are forbidden). CI runs this via `npm run test:ci`. It is also included in **`npm run check:prepush`** (see **Combined local gate** above). Update the `COVERAGE` row flags when you change observability patterns in a function's `index.ts`.

**`npm run check:version-sync`:** Runs `scripts/check-version-sync.mjs` — compares **`package.json` `version`** to the latest **`changelog_entries`** row (PostgREST). **`npm run build`** runs it automatically via the **`prebuild`** hook.

**`npm run stamp:release` / `npm run check:release-stamp`:** `scripts/stamp-edge-release.mjs` keeps **`EDGE_RELEASE`** in **`supabase/functions/_shared/release.ts`** aligned with **`git rev-parse --short=12 HEAD`** for edge Sentry/BetterStack release tags. **`npm run check:release-stamp`** fails if that file is stale (read-only). **`npm run check:prepush`** runs the stamp step first (warns if the file changed so you can commit).

## Troubleshooting

### Migration failed on sync

**Symptom:** CI or Supabase shows a migration error, or the app crashes with "column X does not exist."

**Diagnosis:**
1. Open Supabase Dashboard → Database to check the current schema.
2. Compare with your `supabase/migrations/` folder — is the latest migration applied?

**Fix:**
- If the migration has a syntax error, push a corrected migration file. Supabase won't re-run a migration with the same filename, so you may need a new migration that fixes the issue.
- If the migration conflicted with existing data (e.g. NOT NULL on a column with NULLs), push a data-fix migration first:
  ```sql
  UPDATE my_table SET my_col = 'default' WHERE my_col IS NULL;
  ALTER TABLE my_table ALTER COLUMN my_col SET NOT NULL;
  ```

### Edge function returns 401

**Symptom:** Calling the function returns `{"error":"Invalid JWT"}` or just 401.

**Checklist:**
1. Does `supabase/config.toml` have a `[functions.<name>]` block?
2. Is `verify_jwt = false` set for service/cron functions?
3. Is the `Authorization: Bearer <token>` header correct? Cron functions expect `CRON_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`.
4. Was the function actually deployed? Check Cloud → Edge Functions.

### Edge function returns 500

**Symptom:** Function is deployed but errors at runtime.

**Checklist:**
1. Check Edge Function logs (Cloud → Edge Functions → Logs).
2. Missing secret? Add it via Cloud → Secrets.
3. Missing DB column? A migration may not have been applied — see above.
4. Import error? Ensure all `import` URLs use `https://esm.sh/` (not `npm:` specifiers).

### Frontend shows stale data / missing features after deploy

**Symptom:** Vercel deployed but the UI doesn't reflect your latest code.

**Fix:**
- Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`).
- Check that the service worker isn't caching old assets — clear site data if needed.
- Verify the Vercel deployment succeeded and `VITE_APP_VERSION` matches the expected Git SHA.

### GitHub → Vercel / Supabase deploy seems stuck

**Symptom:** You merged but staging or prod didn't update.

**Checklist:**
1. **Vercel:** Check the deployment for the commit on the correct branch (`main` = prod).
2. **Supabase:** Confirm GitHub Actions (or manual `supabase db push` / `functions deploy`) ran for the target project.
3. Check GitHub Actions logs for failed migration or edge deploy steps.
4. Re-run the failed workflow or push an empty commit after fixing the root cause.

### CRON_SECRET mismatch (cron jobs return 401)

**Symptom:** Scheduled jobs fail with 401. Manual curl with the secret also fails.

**Root cause:** The `CRON_SECRET` in the edge function environment doesn't match the value used in `pg_cron`'s `Authorization` header.

**Fix:**
1. Check what value `pg_cron` sends:
   ```sql
   SELECT command FROM cron.job WHERE jobname LIKE '%volatility%';
   ```
   The `Authorization` header in the command shows the token (or a vault reference).
2. If it uses `vault.decrypted_secrets`:
   ```sql
   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';
   ```
3. Make sure the edge function secret matches exactly. Update via Supabase → Edge Functions → Secrets if needed.
4. After updating, redeploy edge functions (push a commit or use Cloud UI).

## Order-of-operations for breaking changes

When you need to rename a column, change a type, or remove a function:

1. **Deploy code that handles both old and new** (e.g. reads from new column, falls back to old).
2. **Push the migration** that makes the schema change.
3. **Deploy code that only uses the new** (remove fallback).
4. **Push cleanup migration** if needed (drop old column).

This ensures zero downtime regardless of sync timing.
