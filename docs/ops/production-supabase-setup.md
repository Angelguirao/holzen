# Production Supabase setup

One-time and ongoing steps for the **owned production project** after leaving Lovable Cloud auto-sync.

**Prerequisite:** Staging validated per [staging-supabase-setup.md](staging-supabase-setup.md). Production project must **not** be linked to Lovable GitHub sync.

---

## 1. Create or claim project

1. Supabase Dashboard → project `holzen-prod` (or transfer ownership from Lovable per their docs)
2. Note **project ref** — store in team password manager, not in git
3. Enable **Point-in-Time Recovery** if available on your plan

---

## 2. Link CLI (local emergency deploys)

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROD_REF
npm run prod:deploy   # db push + all edge functions (after preflight locally)
```

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
| `GOOGLE_AI_API_KEY` | Primary Gemini |
| `OPENROUTER_API_KEY` | Recommended failover |
| `PERPLEXITY_API_KEY` | Companions / library ingest |
| `RESEND_API_KEY` | Transactional + auth email sends |
| `RESEND_WEBHOOK_SECRET` | Resend → `handle-email-suppression` |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook → `auth-email-hook` |
| `STRIPE_SECRET_KEY` | **Live** mode |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → live webhook endpoint |
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

### Migration-only (remove after cutover)

| Secret | Sunset |
|--------|--------|
| `LOVABLE_API_KEY` | When Resend + Supabase auth hook live and legacy Lovable webhooks disabled |

Full inventory cross-check: [platform-exit-runbook.md](platform-exit-runbook.md) Phase 3.

---

## 5. Auth, email, and webhooks

See [platform-exit-runbook.md](platform-exit-runbook.md) § Auth & email:

1. **Google OAuth** — Supabase Auth → Providers → Google (prod redirect URLs)
2. **Send Email Hook** — `https://<prod-ref>.supabase.co/functions/v1/auth-email-hook`
3. **Resend webhook** — `https://<prod-ref>.supabase.co/functions/v1/handle-email-suppression` (events: `email.bounced`, `email.complained`)
4. **Stripe webhook** — `https://<prod-ref>.supabase.co/functions/v1/stripe-webhook`

---

## 6. Frontend host

Connect GitHub `main` to Netlify or Cloudflare Pages. Build command: `npm run build`. Env vars = same `VITE_*` as CI.

**Stop** Lovable **Publish → Update** for production once external host serves traffic.

---

## 7. Post-cutover verification

- [ ] `npm run test:ci` green on `main`
- [ ] Production workflow completed (`deploy-production.yml`)
- [ ] Signup + magic link email (Resend dashboard + `auth-email-hook` logs)
- [ ] Pause reflect / companion (Gemini + OpenRouter in logs — not `lovable-ai-gateway`)
- [ ] Stripe test purchase (live mode smoke with real card or dashboard test)
- [ ] Cron heartbeats in BetterStack ([observability-setup.md](observability-setup.md) §6)
