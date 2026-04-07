# Deployment & Sync Guide

How Lovable Cloud auto-deploys when you push to GitHub, and how to avoid surprises.

## What happens on GitHub → Lovable sync

| Artifact | Deployed automatically? | Goes live immediately? |
|----------|------------------------|------------------------|
| `supabase/migrations/*.sql` | ✅ Yes — applied to **production DB** | ✅ Immediately |
| `supabase/functions/*/index.ts` | ✅ Yes — deployed to Edge runtime | ✅ Immediately |
| `supabase/config.toml` | ✅ Yes — merged into project config | ✅ Immediately |
| Frontend (`src/`, `index.html`, etc.) | ❌ No — built but **not published** | Only after **Publish → Update** in Lovable UI |

**Key insight:** Backend changes (migrations + edge functions) hit production the moment GitHub syncs. Frontend changes are staged until you explicitly publish.

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

**Secrets:** Edge functions read secrets from the Supabase environment, not from `.env`. If you add a new secret dependency:
1. Document it in your PR / commit message.
2. Add the secret via Lovable Cloud → Secrets **before** the code that uses it goes live.
3. If the secret is missing at runtime, the function will fail silently or throw — check Edge Function logs.

### 3. Frontend

Frontend is safe — it only goes live when you click **Publish → Update** in Lovable. But:
- If your frontend references a new DB column or edge function, make sure the backend side is already deployed before publishing.
- If you remove a column the frontend still references, the published app will break until you publish the updated frontend too.

### 4. config.toml

- **Never change `project_id`** — it's managed by Lovable.
- Only add `[functions.*]` blocks for new edge functions.
- Don't remove existing function blocks unless you're also deleting the function folder.

## Pre-push checklist

```
□ Local tests pass                          npm run test
□ Lint is clean on changed files            npm run lint
□ Edge functions type-check (if Deno)       npm run check:edge
□ New migrations tested locally             npm run supabase:reset
□ New edge functions have config.toml entry
□ New secrets documented / already added
□ No destructive DB changes without code-first deploy
□ Frontend doesn't reference columns/functions that don't exist yet
```

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
