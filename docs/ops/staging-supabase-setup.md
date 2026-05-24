# Staging Supabase setup

One-time (and ongoing) steps for the **owned staging project** used while leaving Lovable Cloud.

**Prerequisite:** Supabase account **outside** Lovable. Do **not** link this project to Lovable.

---

## 1. Create project

1. Supabase Dashboard → project **holzen-staging** (`ksplyxxdvandkwzundql`)
2. Note publishable key in password manager — do not commit keys to git

---

## 1b. Vault project URL (before crons run)

After linking staging, store the project base URL in Vault so pg_cron jobs target **this** project (old migrations still embed the retired Lovable ref). Copy-paste template: [bootstrap-owned-project.sql](./bootstrap-owned-project.sql).

```sql
SELECT vault.create_secret('https://ksplyxxdvandkwzundql.supabase.co', 'holzen_project_url');
```

On **holzen-prod**, use `https://geqkxsnyqvhtascjghuu.supabase.co`. Migration `20260524120500_pg_cron_rewrite_owned_project_url.sql` rewrites active crons when this secret exists at apply time; if you add the secret later, re-run the `UPDATE cron.job … replace` block from that migration in the SQL Editor.

## 2. Link CLI locally

```sh
npx supabase login
npx supabase link --project-ref ksplyxxdvandkwzundql
```

Committed [`supabase/config.toml`](../../supabase/config.toml) `project_id` is **holzen-prod** (`geqkxsnyqvhtascjghuu`); **link metadata** in `.supabase/` points the CLI at staging on your machine when you `supabase link --project-ref ksplyxxdvandkwzundql`.

Optional: set `SUPABASE_STAGING_PROJECT_REF` in shell or `.env.staging.local` for scripts.

---

## 3. Apply schema and deploy edges

```sh
npm run staging:db-push           # migrations only
npm run staging:functions-deploy  # 31 active edges (config.toml manifest)
npm run staging:deploy            # both
```

**Production (after staging sign-off):** link prod ref, then `npm run prod:deploy` for manual deploys — prefer [deploy-production.yml](../../.github/workflows/deploy-production.yml) on merge to `main`. See [production-supabase-setup.md](production-supabase-setup.md).

Deploy uses [scripts/deploy-active-edge-functions.mjs](../../scripts/deploy-active-edge-functions.mjs) — **`supabase/functions/legacy/**` is never deployed** to owned projects ([active-surface.md](active-surface.md)).

---

## 4. Edge secrets (staging)

Supabase Dashboard → Project Settings → Edge Functions → Secrets.

| Secret | Staging value |
|--------|----------------|
| `GOOGLE_AI_API_KEY` | Google AI Studio key (Gemini) |
| `OPENROUTER_API_KEY` | Optional Gemini failover |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `RESEND_API_KEY` | Resend transactional email |
| `RESEND_WEBHOOK_SECRET` | Resend dashboard webhook signing secret (bounces/complaints → `handle-email-suppression`) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook secret (→ `auth-email-hook`) |
| `STRIPE_SECRET_KEY` | Stripe **test** secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe test webhook signing secret |
| `CRON_SECRET` | Random string; match if you enable cron on staging |
| `SENTRY_DSN_EDGES`, `LOG_DRAIN_*`, … | Staging or shared observability |

Inventory prod/Lovable secrets against [observability-setup.md](observability-setup.md).

---

## 5. Frontend env

```sh
cp .env.staging.example .env.staging.local
# fill VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY from staging dashboard
npm run dev:staging
```

---

## 6. Auth redirect URLs

Supabase → Authentication → URL configuration:

- Site URL: staging frontend origin (or `http://localhost:8080` for local-only)
- Redirect URLs: `http://localhost:8080/**`, staging preview URLs

---

## 7. Before every migration merge to prod

```sh
npm run supabase:reset          # local replay (Docker)
npm run check:prepush           # Git Bash / WSL
npm run staging:db-push         # against linked staging project
# smoke: sign-in, pause, checkout test mode, one Bruno request
```

See PR template checklist in [`.github/pull_request_template.md`](../../.github/pull_request_template.md).

---

## 8. Optional CI

Configure GitHub secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_STAGING_PROJECT_REF`, then run workflow **Staging backend** (`.github/workflows/staging-backend.yml`).
