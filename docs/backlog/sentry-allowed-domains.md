# Sentry Allowed Domains

**Status:** Open. One-minute UI change.

## Why

The frontend Sentry DSN (`VITE_SENTRY_DSN` / `SENTRY_DSN` in `src/config/public-env.ts`) is committed to the bundle by design — Sentry DSNs are public-safe **only if** the project is restricted to known origins. Without an Allowed Domains list, a leaked DSN lets any origin submit events into our quota and poison release-health stats.

## What to do

Sentry → **Settings → Projects → holzen → Security & Privacy** → scroll to **Allowed Domains** → paste one per line:

```
holzen.lovable.app
holzen.app
*.lovable.app
```

Save.

The wildcard matches preview deploys. Drop it if preview branches should not submit to the production Sentry project (they currently share the project; tag segmentation via `environment: preview` keeps the signal readable).

## Verification

1. Open the production app, trigger any error (e.g. the smoke-test "Report this" path).
2. Sentry → Issues → the new event should appear within a few seconds.
3. In a fresh incognito window, open a file-URL HTML page that calls `Sentry.init({ dsn: <our DSN> })` and captures an exception. The event should be **rejected** at ingest (visible in Sentry → Stats → Dropped by origin).

## Related code

- `src/config/public-env.ts` — where the frontend DSN is declared (with fallback).
- `src/lib/sentry.ts` — frontend init.
- `supabase/functions/_shared/sentry.ts` — edge init (separate DSN; edges call Sentry server-to-server so Allowed Domains does not apply).
- `docs/ops/observability-setup.md` — Sentry section.
