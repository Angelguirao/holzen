# Auth email hook (Bruno)

- **`auth-email-hook-preview`** — `POST .../auth-email-hook/preview` with **`Authorization: Bearer …`** using any ops secret accepted by the edge (`CRON_SECRET`, `EMAIL_PREVIEW_SECRET`, or `SEND_EMAIL_HOOK_SECRET`). Renders HTML for template types: `signup`, `magiclink`, `recovery`, `invite`, `email_change`, `reauthentication`.

## Production webhook path

**Supabase Send Email Hook** — signed with **`SEND_EMAIL_HOOK_SECRET`** (Standard Webhooks / Svix-style headers). Configure in Supabase Dashboard → Authentication → Hooks.

The hook body is not easily reproducible from Bruno alone; use Supabase's hook test flow or trigger a real auth email in staging.

## Local preview

Set `EMAIL_PREVIEW_SECRET` (or `CRON_SECRET`) in `supabase/.env` and use the preview Bruno request with `Authorization: Bearer <secret>`.

See [../README.md](../README.md) and [docs/ops/platform-exit-runbook.md](../../../docs/ops/platform-exit-runbook.md) § Auth & email.
