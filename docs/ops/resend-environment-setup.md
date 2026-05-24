# Resend — staging vs production

**Status:** Active (2026-05). Canonical setup for Holzen transactional email on **owned Supabase** projects.

**Related:** [platform-exit-runbook.md](platform-exit-runbook.md) § Auth & email, [staging-supabase-setup.md](staging-supabase-setup.md), [production-supabase-setup.md](production-supabase-setup.md), [`supabase/functions/_shared/email-env.ts`](../../supabase/functions/_shared/email-env.ts).

---

## How Holzen uses Resend

All sends go through Supabase Edge Functions → [`transactional-email.ts`](../../supabase/functions/_shared/transactional-email.ts) → Resend HTTP API. The React app never holds `RESEND_API_KEY`.

| Flow | Edge function | Notes |
|------|---------------|--------|
| Auth (signup, magic link, reset, …) | `auth-email-hook` | Supabase **Send Email Hook** |
| Welcome, checkout confirmation | `send-transactional-email` | Queued via `process-email-queue` |
| Volatility pause offers | `check-volatility` → `notifications-deliver-pause-offer.ts` | Respects `profiles.email_notifications` |
| Referral rewards | `record-referral` / `process-referral-pending` | |
| Feedback copy | `send-feedback` | Optional if key set |
| AI cost alerts | `ai-cost-alert` | Ops recipients in `app_config` |
| Bounces / complaints | `handle-email-suppression` | **Inbound** Resend webhook (Svix) |

Unlike Stripe, Resend has **no test/live API mode**. Separation is **per Supabase project** + **per API key** + **different From/subject branding**.

---

## Secrets (per Supabase project)

Set in Dashboard → Edge Functions → Secrets, or via `npm run staging:secrets-set` / `npm run prod:secrets-set`.

| Secret | Staging | Production |
|--------|---------|--------------|
| `RESEND_API_KEY` | Staging-only `re_*` key | Prod-only `re_*` key (different key) |
| `RESEND_WEBHOOK_SECRET` | Signing secret for **staging** webhook endpoint | Signing secret for **prod** webhook endpoint |
| `SEND_EMAIL_HOOK_SECRET` | Matches staging Auth → Send Email hook | Matches prod Auth → Send Email hook |

Use **restricted** Resend API keys when possible (send-only for edges, read-only for Cursor MCP).

**Send-only keys** (`sending_access`) can deliver mail but **cannot** list domains, create webhooks, or use most Resend MCP management tools. Use a **full_access** key (or the Resend dashboard) once to create webhooks, then store only send-only keys on Supabase Edge.

---

## Email identity env vars (optional)

Read at runtime by [`email-env.ts`](../../supabase/functions/_shared/email-env.ts). **Omit on production** to use defaults (`holzen.app`, `notify.holzen.app`).

| Variable | Production default | Staging recommendation |
|----------|-------------------|------------------------|
| `EMAIL_BRAND_NAME` | `holzen` | `Holzen Staging` |
| `EMAIL_FROM_DOMAIN` | `holzen.app` | `resend.dev` (Resend sandbox) |
| `EMAIL_FROM_LOCAL` | `noreply` | `onboarding` (required for `resend.dev`) |
| `EMAIL_NOTIFY_LOCAL` | `notify` | `onboarding` (when using `resend.dev`) |
| `EMAIL_SENDER_DOMAIN` | `notify.holzen.app` | `resend.dev` |
| `EMAIL_SUBJECT_PREFIX` | _(none)_ | `[STAGING]` (space added automatically) |
| `EMAIL_ROOT_DOMAIN` | `holzen.app` | `holzen.app` (links in templates) |
| `EMAIL_APP_URL` | `https://holzen.app` | `http://localhost:8080` or Vercel preview URL |
| `EMAIL_FEEDBACK_INBOX` | `hello@holzen.app` | Same or a test inbox |

Staging example (add to `.env.staging.secrets`):

```env
EMAIL_BRAND_NAME=Holzen Staging
EMAIL_FROM_DOMAIN=resend.dev
EMAIL_FROM_LOCAL=onboarding
EMAIL_NOTIFY_LOCAL=onboarding
EMAIL_SENDER_DOMAIN=resend.dev
EMAIL_SUBJECT_PREFIX=[STAGING]
EMAIL_APP_URL=http://localhost:8080
```

Production: verify **`holzen.app`** (and **`notify.holzen.app`** if used) in the Resend dashboard; leave identity vars unset.

---

## Resend dashboard checklist

### Both environments

1. **API keys** — create separate keys; store in the matching Supabase project only.
2. **Webhooks** — one endpoint per Supabase project:
   - Staging: `https://ksplyxxdvandkwzundql.supabase.co/functions/v1/handle-email-suppression`
   - Prod: `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/handle-email-suppression`
   - Events: `email.bounced`, `email.complained`
   - Copy each endpoint’s signing secret → `RESEND_WEBHOOK_SECRET` on **that** project.

### Production only

- Verify domain **`holzen.app`** (SPF, DKIM, DMARC).
- Optional: subdomain **`notify.holzen.app`** if your DNS setup uses it.

### Staging only

- Either send via **`onboarding@resend.dev`** (identity vars above), **or** verify a staging subdomain (e.g. `staging.holzen.app`) if you want prod-like From headers.

---

## Supabase Auth (per project)

Authentication → Hooks → **Send Email**:

| Project | Hook URL |
|---------|----------|
| Staging | `https://ksplyxxdvandkwzundql.supabase.co/functions/v1/auth-email-hook` |
| Prod | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/auth-email-hook` |

Hook secret → `SEND_EMAIL_HOOK_SECRET` on the same project.

---

## Cursor Resend MCP

The Resend MCP plugin is for **ops/debug** (domains, webhooks, logs). It does not replace Edge secrets.

- Configure a valid `re_*` key in **Cursor → MCP → Resend**.
- Prefer a **staging or read-only** key so agent tools cannot send prod mail accidentally.

---

## Verification

| Check | Staging | Prod |
|-------|---------|------|
| Signup / magic link | Mail from `[STAGING]` subject + `onboarding@resend.dev` | Mail from `noreply@holzen.app` |
| Resend webhook | Test bounce event updates `suppressed_emails` on staging DB | Same on prod |
| Edge logs | `auth_email_hook_sent`, `dependency_call` dep=`resend-email` | Same |
| No cross-leak | Staging key not in prod secrets | Prod key not in staging secrets |

```sh
npm run test   # includes src/test/shared/email-env.test.ts
```

---

## Cursor MCP troubleshooting

If MCP returns `API key is invalid`, re-enter the key in Cursor MCP settings. Repo `.cursor/mcp.json` stays empty — plugin auth is user-level.
