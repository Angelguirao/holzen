# Resend — local vs production

**Status:** Active. Canonical setup for Holzen transactional email on **holzen-prod** (and local Docker).

**Related:** [platform-exit-runbook.md](platform-exit-runbook.md) § Auth & email, [production-supabase-setup.md](production-supabase-setup.md), [`supabase/functions/_shared/email-env.ts`](../../supabase/functions/_shared/email-env.ts).

Legacy **holzen-staging** was deleted 2026-07-16. Email QA uses **local Docker** + Resend sandbox (`resend.dev`), or prod carefully.

---

## How Holzen uses Resend

All sends go through Supabase Edge Functions → [`transactional-email.ts`](../../supabase/functions/_shared/transactional-email.ts) → Resend HTTP API. The React app never holds `RESEND_API_KEY`.

| Flow | Edge function | Notes |
|------|---------------|--------|
| Auth (signup, magic link, reset, …) | `auth-email-hook` | Supabase **Send Email Hook** |
| Welcome, checkout confirmation | `send-transactional-email` | Queued via `process-email-queue` |
| Volatility pause offers | `check-volatility` → `notifications-deliver-pause-offer.ts` | Respects `profiles.email_notifications`; kill switch `PAUSE_VOLATILITY_EMAIL_ENABLED` (default on) |
| Referral rewards | `record-referral` / `process-referral-pending` | |
| Feedback copy | `send-feedback` | Optional if key set |
| AI cost alerts | `ai-cost-alert` | Ops recipients in `app_config` |
| Bounces / complaints | `handle-email-suppression` | **Inbound** Resend webhook (Svix) |

Unlike Stripe, Resend has **no test/live API mode**. Separation is **API key** + **From/subject branding** (local sandbox vs prod domain).

---

## Secrets (holzen-prod)

Set in Dashboard → Edge Functions → Secrets, or via `npm run prod:secrets-set`.

| Secret | Local Docker | Production |
|--------|--------------|------------|
| `RESEND_API_KEY` | Dev/sandbox `re_*` in `supabase/.env.local` | Prod `re_*` on holzen-prod |
| `RESEND_WEBHOOK_SECRET` | Optional local | Signing secret for prod webhook |
| `SEND_EMAIL_HOOK_SECRET` | Local secret | Matches Auth → Send Email hook |

Use **restricted** Resend API keys when possible (send-only for edges, read-only for Cursor MCP).

**Send-only keys** (`sending_access`) can deliver mail but **cannot** list domains or create webhooks. Use a **full_access** key (or dashboard) once to create webhooks, then store only send-only keys on Edge.

---

## Email identity env vars (optional)

Read at runtime by [`email-env.ts`](../../supabase/functions/_shared/email-env.ts). **Omit on production** to use defaults (`holzen.app`, `notify.holzen.app`).

| Variable | Production default | Local recommendation |
|----------|-------------------|----------------------|
| `EMAIL_BRAND_NAME` | `holzen` | `Holzen Local` |
| `EMAIL_FROM_DOMAIN` | `holzen.app` | `resend.dev` |
| `EMAIL_FROM_LOCAL` | `noreply` | `onboarding` (required for `resend.dev`) |
| `EMAIL_NOTIFY_LOCAL` | `notify` | `onboarding` |
| `EMAIL_SENDER_DOMAIN` | `notify.holzen.app` | `resend.dev` |
| `EMAIL_SUBJECT_PREFIX` | _(none)_ | `[LOCAL]` |
| `EMAIL_ROOT_DOMAIN` | `holzen.app` | `holzen.app` |
| `EMAIL_APP_URL` | `https://holzen.app` | `http://localhost:8080` |
| `EMAIL_FEEDBACK_INBOX` | `hello@holzen.app` | Same or a test inbox |
| `PAUSE_VOLATILITY_EMAIL_ENABLED` | `true` (unset = on) | `false` to disable pause-offer email only |

Local example (`supabase/.env.local`):

```env
EMAIL_BRAND_NAME=Holzen Local
EMAIL_FROM_DOMAIN=resend.dev
EMAIL_FROM_LOCAL=onboarding
EMAIL_NOTIFY_LOCAL=onboarding
EMAIL_SENDER_DOMAIN=resend.dev
EMAIL_SUBJECT_PREFIX=[LOCAL]
EMAIL_APP_URL=http://localhost:8080
```

Production: verify **`holzen.app`** (and **`notify.holzen.app`** if used); leave identity vars unset.

---

## Resend dashboard checklist

### Production

1. **API key** — store on holzen-prod only.
2. **Webhook** — `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/handle-email-suppression`
   - Events: `email.bounced`, `email.complained`
   - Signing secret → `RESEND_WEBHOOK_SECRET`
3. Verify domain **`holzen.app`** (SPF, DKIM, DMARC); optional **`notify.holzen.app`**.

### Local

- Prefer **`onboarding@resend.dev`** with identity vars above (no custom domain required).

---

## Supabase Auth (holzen-prod)

Authentication → Hooks → **Send Email**:

| Project | Hook URL |
|---------|----------|
| Prod | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/auth-email-hook` |

Hook secret → `SEND_EMAIL_HOOK_SECRET` on the same project.

---

## Cursor Resend MCP

The Resend MCP plugin is for **ops/debug**. Prefer a **sandbox or read-only** key so agent tools cannot send prod mail accidentally.

---

## Verification

| Check | Local | Prod |
|-------|-------|------|
| Signup / magic link | `[LOCAL]` + `onboarding@resend.dev` when wired | `noreply@holzen.app` |
| Resend webhook | Optional | Bounce updates `suppressed_emails` on prod |
| Edge logs | `auth_email_hook_sent`, `dependency_call` dep=`resend-email` | Same |

```sh
npm run test   # includes src/test/shared/email-env.test.ts
```

---

## Local development

1. Start the local stack and functions:

   ```sh
   npm run supabase:start
   npm run supabase:functions:serve
   npm run dev:local
   ```

2. Ensure `supabase/.env.local` contains at least:

   ```env
   RESEND_API_KEY=re_...
   SEND_EMAIL_HOOK_SECRET=<local secret>
   EMAIL_PREVIEW_SECRET=<local secret>
   ```

3. Preview templates without sending:

   ```sh
   curl http://127.0.0.1:55421/functions/v1/preview-transactional-email ^
     -H "Authorization: Bearer <EMAIL_PREVIEW_SECRET>"
   ```

4. Drain queued transactional emails:

   ```sh
   npm run supabase:email:drain-local -- --until-empty
   ```

Notes:

- `send-transactional-email` **enqueues**; `process-email-queue` delivers.
- Local Auth Send Email Hook needs explicit setup for full signup / magic-link E2E.
- With `resend.dev`, use your Resend account email or documented test addresses.

---

## Cursor MCP troubleshooting

If MCP returns `API key is invalid`, re-enter the key in Cursor MCP settings. Repo `.cursor/mcp.json` stays empty — plugin auth is user-level.
