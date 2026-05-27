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

On **holzen-prod**, use `https://geqkxsnyqvhtascjghuu.supabase.co`.

**pg_cron URL rewrite:** Hosted Supabase often returns `42501 permission denied for table job` on `UPDATE cron.job` (SQL Editor and CLI). Use **unschedule + reschedule** instead:

```sh
# Vault: holzen_project_url + CRON_SECRET (or holzen_cron_service_role)
npm run staging:reschedule-crons
```

See [cron-setup.md](cron-setup.md) for Vault bearer setup. Migration `20260524120500_…` attempts an in-place rewrite at apply time but skips when privileges are insufficient.

## 2. Link CLI locally

```sh
npx supabase login
npx supabase link --project-ref ksplyxxdvandkwzundql
```

Committed [`supabase/config.toml`](../../supabase/config.toml) `project_id` is the neutral local id **`holzen`**. Repo-local link metadata in `.supabase/project.json` points the raw CLI at staging on your machine when you `supabase link --project-ref ksplyxxdvandkwzundql`.

Optional: set `SUPABASE_STAGING_PROJECT_REF` in shell or `.env.staging.local` for scripts.

---

## 3. Apply schema and deploy edges

```sh
npm run staging:db-push           # migrations only
npm run staging:functions-deploy  # 31 active edges (config.toml manifest)
npm run staging:deploy            # both
```

These manual `staging:*` scripts relink the CLI to the staging ref before they push, so they do not depend on whatever project happened to be linked previously in your shell.

**Production (after staging sign-off):** link prod ref, then `npm run prod:deploy` for manual deploys — prefer [deploy-production.yml](../../.github/workflows/deploy-production.yml) on merge to `main`. See [production-supabase-setup.md](production-supabase-setup.md).

Deploy uses [scripts/deploy-active-edge-functions.mjs](../../scripts/deploy-active-edge-functions.mjs) — **`supabase/functions/legacy/**` is never deployed** to owned projects ([active-surface.md](active-surface.md)).

---

## 4. Edge secrets (staging)

Supabase Dashboard → Project Settings → Edge Functions → Secrets, **or** from a gitignored file:

```sh
cp .env.staging.secrets.example .env.staging.secrets
# fill RESEND_*, STRIPE_* (test), OPENROUTER_API_KEY, observability keys
npm run staging:secrets-set
```

`CRON_SECRET` is already wired for staging pg_cron (Vault + Edge); store the value in your password manager if you rotate it.

| Secret | Staging value |
|--------|----------------|
| `OPENROUTER_API_KEY` | **Required** — all Gemini LLM via OpenRouter ([llm-openrouter.md](llm-openrouter.md)) |
| `OPENROUTER_API_KEY` | Optional Gemini failover |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `RESEND_API_KEY` | Staging-only Resend API key |
| `RESEND_WEBHOOK_SECRET` | Resend webhook signing secret → staging `handle-email-suppression` |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook secret (→ `auth-email-hook`) |
| `EMAIL_*` (optional) | Staging sender identity — see [resend-environment-setup.md](resend-environment-setup.md) |
| `STRIPE_SECRET_KEY` | Stripe **test** secret (`sk_test_…` or restricted `rk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe **test** webhook signing secret → `…/functions/v1/stripe-webhook` on this project |
| `STRIPE_PRICE_ID_PRO` | Test-mode Pro subscription `price_…` (recurring) |
| `STRIPE_PRICE_ID_FLEX_PACK_S` | Test-mode flex pack S `price_…` (one-time) |
| `STRIPE_PRICE_ID_FLEX_PACK_M` | Test-mode flex pack M `price_…` (one-time) |
| `CRON_SECRET` | Random string; match if you enable cron on staging |
| `SENTRY_DSN_EDGES`, `LOG_DRAIN_*`, … | Staging or shared observability |

Inventory prod/Lovable secrets against [observability-setup.md](observability-setup.md).

**Stripe / edge secrets:** copy [.env.staging.secrets.example](../../.env.staging.secrets.example) → `.env.staging.secrets`, then `npm run staging:secrets-set`. See [stripe-environment-setup.md](stripe-environment-setup.md).

---

## 5. Frontend env

```sh
cp .env.staging.example .env.staging.local
# fill VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY from staging dashboard
npm run dev:staging
```

---

## 6. Auth (redirect URLs + Send Email Hook)

**URL configuration** (Authentication → URL configuration):

- Site URL: `http://localhost:8080` for local dev, or your Vercel preview URL when testing hosted frontend
- Redirect URLs: `http://localhost:8080/**`, `https://*.vercel.app/**` (preview), plus any custom staging domain

**Send Email Hook** (Authentication → Hooks → Send Email):

1. Enable **Send Email** hook, type **HTTPS**
2. URL: `https://ksplyxxdvandkwzundql.supabase.co/functions/v1/auth-email-hook`
3. Generate a hook secret in the Dashboard; paste the **same** value into Edge secret `SEND_EMAIL_HOOK_SECRET` (`npm run staging:secrets-set` or Dashboard → Edge Functions → Secrets)
4. Requires `RESEND_API_KEY` on the project (hook sends via Resend in `auth-email-hook`)

Email staging vs prod: [resend-environment-setup.md](resend-environment-setup.md).

Without the hook + `RESEND_API_KEY`, sign-up / password-reset emails will not send on owned projects.

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

Configure GitHub repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Same personal access token from `npx supabase login` |
| `SUPABASE_STAGING_PROJECT_REF` | `ksplyxxdvandkwzundql` |
| `SUPABASE_PROD_PROJECT_REF` | `geqkxsnyqvhtascjghuu` (for production workflow) |

Optional CI build secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — see [observability-setup.md](observability-setup.md).

Then run workflow **Staging deploy** (`.github/workflows/staging-deploy.yml`) or push to branch `staging`.
