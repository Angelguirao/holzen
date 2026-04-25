# Deployment & Sync Guide

How Lovable Cloud auto-deploys when you push to GitHub, and how to avoid surprises.

**Repo integration:** This checklist is referenced from [AGENTS.md](../../AGENTS.md) (humans + AI) and enforced for Cursor via [`.cursor/rules/deployment-sync.mdc`](../../.cursor/rules/deployment-sync.mdc) (`alwaysApply`). Run it before every push that touches app code, migrations, or edge functions.

## What happens on GitHub → Lovable sync

| Artifact | Deployed automatically? | Goes live immediately? |
|----------|------------------------|------------------------|
| `supabase/migrations/*.sql` | ✅ Yes — applied to **production DB** | ✅ Immediately |
| `supabase/functions/*/index.ts` | ✅ Yes — deployed to Edge runtime | ✅ Immediately |
| `supabase/config.toml` | ✅ Yes — merged into project config | ✅ Immediately |
| Frontend (`src/`, `index.html`, etc.) | ❌ No — built but **not published** | Only after **Publish → Update** in Lovable UI |

**Key insight:** Backend changes (migrations + edge functions) hit production the moment GitHub syncs. Frontend changes are staged until you explicitly publish.

## Hosted env files vs Cloud secrets

| What | Where it runs | Where you set it (hosted) | When changes take effect |
|------|---------------|---------------------------|---------------------------|
| `VITE_*` | Browser (built SPA) | Lovable project env / build inputs; local `.env` for dev | New frontend build + **Publish → Update** |
| Edge secrets (`FETCH_FEEDS_*`, `CRON_SECRET`, Stripe keys, …) | Supabase Edge (cloud) | **Lovable Cloud → Secrets** (injected into the Edge runtime) | Same as any secret change: available on the next function invocation |

**Important:** Files like `.env.example`, `.env.hosted`, or `.env` in this repo **only affect the frontend build** when you run Vite locally (or when your CI loads them). They are **not** read by deployed Edge functions. For production Edge behavior, configure secrets in **Lovable Cloud → Secrets** (or Supabase Dashboard → Edge Function secrets for the linked project).

**Local development only:** `supabase functions serve` can load `supabase/.env` (gitignored). That path does not apply to hosted runs.

## Safe workflow for outside-Lovable development

### 1. Migrations

**Rule:** Never push a migration you haven't tested locally or on staging first.

```sh
# Test locally with Docker
npm run supabase:start
npm run supabase:reset          # re-applies all migrations from scratch

# Verify the migration works
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/XXXX_my_change.sql
```

**Naming:** Supabase sorts migrations lexicographically. Use the timestamp format:
```
supabase/migrations/20260407120000_add_foo_column.sql
```

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
- **Stale code** → Lovable may cache a previous deployment. Touch a file (add a comment) and push again, or redeploy from the Cloud UI.

**Secrets:** Edge functions read secrets from the Supabase environment, not from repo `.env` files. See [Hosted env files vs Cloud secrets](#hosted-env-files-vs-cloud-secrets). If you add a new secret dependency:
1. Document it in your PR / commit message.
2. Add the secret via Lovable Cloud → Secrets **before** the code that uses it goes live.
3. If the secret is missing at runtime, the function will fail silently or throw — check Edge Function logs.

### 3. Frontend

Frontend is safe — it only goes live when you click **Publish → Update** in Lovable. Changing `VITE_*` values requires a new build and publish; see [Hosted env files vs Cloud secrets](#hosted-env-files-vs-cloud-secrets). But:
- If your frontend references a new DB column or edge function, make sure the backend side is already deployed before publishing.
- If you remove a column the frontend still references, the published app will break until you publish the updated frontend too.

### 4. config.toml

- **Never change `project_id`** — it's managed by Lovable.
- Only add `[functions.*]` blocks for new edge functions.
- Don't remove existing function blocks unless you're also deleting the function folder.

## Pre-push checklist

```
□ Local tests pass                          npm run test
□ Production build succeeds                 npm run build
□ Lint is clean on changed files            npm run lint
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

`npm run check:prepush` runs `scripts/pre-push-check.sh`: edge release stamp, view-migration safety, every `supabase/functions/<name>/` has a matching `[functions.<name>]` in `config.toml`, **`npm run check:edge`** (skips if Deno missing), **`npm run check:edge-logging`**, **`npm run check:edge-coverage-manifest`**, **`npm run test`**, **`npm run build`**, and (when Docker + Supabase CLI are available) a local **`supabase db reset`**. **Requires `bash`** — on Windows use **Git Bash** or **WSL** (PowerShell alone will not run this script).

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
2. **Two-commit approach (safest):** Push the migration first, wait for Lovable to sync and regenerate types, then push the code that uses the new columns.
3. **Wrap in try/catch** when the table or column genuinely might not exist yet (pre-migration graceful degradation).
4. **`npm run gen:types`** — Regenerates `src/integrations/supabase/types.ts` from the **linked** project (`supabase login` or `SUPABASE_ACCESS_TOKEN`). Run after schema-changing migrations so the repo matches production.

### Migrations that unlock Edge code (same push)

Some Edge functions assume columns already exist — e.g. **`fetch-source-feeds`** orders and updates `signal_sources.last_fetch_feeds_at`, and may insert `content_library.original_url` / `original_publication`. If the deployed function runs **before** those migrations finish, PostgREST can return **400/500** ("column does not exist") on the `signal_sources` select or update.

**Mitigation:**

1. **Normal GitHub → Lovable sync** usually applies migrations in timestamp order before traffic hits new code; if you see column errors right after sync, open **Database → Migrations** and confirm pending migrations are applied, then **re-invoke** the function or redeploy.
2. **High-stakes prod:** Ship **migrations-only** first (or run the SQL from new migration files in the SQL editor), verify schema, then merge the function commit — matches the guide's order-of-operations mindset.
3. **Optional Edge secrets** (no deploy blocker if unset): `FETCH_FEEDS_MAX_SOURCES`, `FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE`, `FETCH_FEEDS_ARTICLE_DELAY_MS` — defaults apply; add in **Cloud → Secrets** only for launch backfills.

**`npm run check:edge`:** Runs `scripts/check-edge.mjs` (`deno check` on every `supabase/functions/*/index.ts` except `_shared`). It resolves the Deno binary from PATH, then `DENO_INSTALL/bin`, then `~/.deno/bin` (official installer default). Uses `--no-lock` so it does not write a root `deno.lock`. If Deno is missing entirely, the script exits 0 with a skip message.

**`npm run check:edge-logging`:** Runs `scripts/check-edge-logging.mjs` — a fast regex guard that HTTP-serving edge entrypoints wrap handlers in `withRequestLogging` (BetterStack + Sentry path). CI runs it via `npm run test:ci`; **`npm run check:prepush`** runs it too.

**`npm run check:edge-coverage-manifest`:** Runs `scripts/verify-edge-coverage-manifest.mjs` — every `[functions.<name>]` in `supabase/config.toml` must appear in `src/pages/EdgeCoverage.tsx` `COVERAGE` (and extras are forbidden). CI runs this via `npm run test:ci`. It is also included in **`npm run check:prepush`** (see **Combined local gate** above). Update the `COVERAGE` row flags when you change observability patterns in a function's `index.ts`.

## Troubleshooting

### Migration failed on sync

**Symptom:** Lovable shows a sync error, or the app crashes with "column X does not exist."

**Diagnosis:**
1. Open Lovable Cloud → Database to check the current schema.
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

### Frontend shows stale data / missing features after publish

**Symptom:** You published but the UI doesn't reflect your latest code.

**Fix:**
- Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`).
- Check that the service worker isn't caching old assets — clear site data if needed.
- Verify the publish actually completed in Lovable's publish history.

### Sync from GitHub seems stuck

**Symptom:** You pushed to GitHub but Lovable doesn't show the changes.

**Checklist:**
1. Is the repo connected? Check Project Settings → GitHub.
2. Did you push to the correct branch (the one Lovable tracks)?
3. Check GitHub for webhook delivery status (Settings → Webhooks → Recent Deliveries).
4. Try a manual sync: make a trivial change in Lovable and save, or push another commit.

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
3. Make sure the edge function secret matches exactly. Update via Cloud → Secrets if needed.
4. After updating, redeploy edge functions (push a commit or use Cloud UI).

## Order-of-operations for breaking changes

When you need to rename a column, change a type, or remove a function:

1. **Deploy code that handles both old and new** (e.g. reads from new column, falls back to old).
2. **Push the migration** that makes the schema change.
3. **Deploy code that only uses the new** (remove fallback).
4. **Push cleanup migration** if needed (drop old column).

This ensures zero downtime regardless of sync timing.
