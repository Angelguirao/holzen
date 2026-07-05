# Production Supabase setup

One-time and ongoing steps for the **owned production project** after leaving Lovable Cloud auto-sync.

**Prerequisite:** Staging validated per [staging-supabase-setup.md](staging-supabase-setup.md). Production project must **not** be linked to Lovable GitHub sync.

---

## 1. Create or claim project

1. Supabase Dashboard → project **holzen-prod** (`geqkxsnyqvhtascjghuu`)
2. Note publishable key in password manager — do not commit keys to git
3. Enable **Point-in-Time Recovery** if available on your plan
4. Set Vault `holzen_project_url` to `https://geqkxsnyqvhtascjghuu.supabase.co` (see [staging-supabase-setup.md](staging-supabase-setup.md) §1b)

---

## 2. Link CLI (local emergency deploys)

```sh
npx supabase login
npx supabase link --project-ref geqkxsnyqvhtascjghuu
npm run prod:deploy   # db push + active edge functions (after preflight locally)
npm run prod:reschedule-crons   # optional: rewire pg_cron after Vault/project URL changes
```

The manual `prod:*` scripts relink the CLI to the production ref before they push, so they do not depend on whichever remote project was linked earlier in your shell.

Day-to-day prod backend deploys should go through [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) (merge to `main` + **production** environment approval).

---

## 3. GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI (`supabase login` token) |
| `SUPABASE_PROD_PROJECT_REF` | Production project ref |
| `VITE_SUPABASE_URL` | CI build + optional frontend host |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI build + optional frontend host |

Optional (frontend host build on Netlify/CF Pages uses its own env — mirror these):

- `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (source-map upload in CI)

**Environment protection:** Configure GitHub **environment `production`** with required reviewers before `deploy-backend` runs.

---

## 4. Edge secrets (production)

Supabase Dashboard → Project Settings → Edge Functions → Secrets.

Copy staging values where appropriate; swap to **live** vendor keys where noted.

### Required (pause-first active surface)

| Secret | Notes |
|--------|--------|
| `OPENROUTER_API_KEY` | **Required** — all Gemini LLM traffic ([llm-openrouter.md](llm-openrouter.md)) |
| `OPENROUTER_HTTP_REFERER` / `OPENROUTER_APP_TITLE` | Recommended attribution headers |
| `PERPLEXITY_API_KEY` | Companions / library ingest |
| `RESEND_API_KEY` | Production-only Resend API key |
| `RESEND_WEBHOOK_SECRET` | Resend → prod `handle-email-suppression` |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook → `auth-email-hook` |
| `STRIPE_SECRET_KEY` | **Live** mode (`sk_live_…` or restricted `rk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → **live** webhook → `…/functions/v1/stripe-webhook` on this project |
| `STRIPE_PRICE_ID_PRO` | Live Pro subscription `price_…` (recurring, $4.99/mo v1 packaging) |
| `STRIPE_PRICE_ID_FLEX_PACK_S` | Live flex pack S `price_…` (one-time) |
| `STRIPE_PRICE_ID_FLEX_PACK_M` | Live flex pack M `price_…` (one-time) |
| `CRON_SECRET` | Must match `pg_cron` vault / Bruno cron invocations |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase; verify cron vault uses current JWT |

### Observability (see [observability-setup.md](observability-setup.md))

| Secret | Notes |
|--------|--------|
| `SENTRY_DSN_EDGES` | Edge error reporting |
| `SENTRY_RELEASE` | Set by `npm run stamp:release` at deploy — or match Git SHA |
| `SENTRY_ENVIRONMENT` | `production` |
| `LOG_DRAIN_URL`, `LOG_DRAIN_TOKEN` | BetterStack |
| `SLACK_WEBHOOK_URL` | `#holzen-alerts` |

### Removed after platform exit (Phase 4)

Do **not** set these on owned Supabase projects:

| Secret | Notes |
|--------|--------|
| `LOVABLE_API_KEY` | Removed once Resend + Supabase auth hook + Resend webhooks are live |

Full inventory: [platform-exit-runbook.md](platform-exit-runbook.md) Phase 3–4.

**Apply via CLI:** copy [.env.prod.secrets.example](../../.env.prod.secrets.example) → `.env.prod.secrets`, then `npm run prod:secrets-set`. Stripe details: [stripe-environment-setup.md](stripe-environment-setup.md).

---

## 5. Auth, email, and webhooks

See [platform-exit-runbook.md](platform-exit-runbook.md) § Auth & email and [resend-environment-setup.md](resend-environment-setup.md):

1. **Google OAuth** — Supabase Auth → Providers → Google (prod redirect URLs)
2. **Send Email Hook** — `https://<prod-ref>.supabase.co/functions/v1/auth-email-hook`
3. **Resend webhook** — `https://<prod-ref>.supabase.co/functions/v1/handle-email-suppression` (events: `email.bounced`, `email.complained`)
4. **Stripe webhook** — `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook` (live mode; see [stripe-environment-setup.md](stripe-environment-setup.md))

---

## 6. Frontend host (Vercel)

Follow **[vercel-frontend-setup.md](vercel-frontend-setup.md)**:

1. Import repo → production branch `main`
2. Set `VITE_*` env vars (prod Supabase URL/key, `$VERCEL_GIT_COMMIT_SHA` for version)
3. Add custom domain; update Supabase Auth redirect URLs

**Stop** Lovable **Publish → Update** once Vercel serves production traffic.

_Netlify / Cloudflare Pages are equivalent alternatives — same build command and `dist/` output._

---

## 7. Post-cutover verification

- [ ] `npm run test:ci` green on `main`
- [ ] Production workflow completed (`deploy-production.yml`)
- [ ] Signup + magic link email (Resend dashboard + `auth-email-hook` logs)
- [ ] Pause reflect / companion (Gemini + OpenRouter in logs — not `lovable-ai-gateway`)
- [ ] Stripe test purchase (live mode smoke with real card or dashboard test)
- [ ] Cron heartbeats in BetterStack ([observability-setup.md](observability-setup.md) §6)
