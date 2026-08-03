# Observability edge secrets (BetterStack + Slack)

**Status:** Open — not blocking CI deploy or waitlist launch; **required for production alerting and edge log search.**

CI preflight treats these as **recommended** (edges no-op when unset — see [observability-setup.md](../ops/observability-setup.md)). Holzen.app can ship without them; you will not get `#holzen-alerts` or BetterStack log aggregation until this is done.

## What’s missing (holzen-prod)

Set on **holzen-prod** → Edge Functions → Secrets:

| Secret | Source |
|--------|--------|
| `LOG_DRAIN_URL` | BetterStack → Logs → Sources → HTTP → ingest URL (usually `https://in.logs.betterstack.com`) |
| `LOG_DRAIN_TOKEN` | Same source → **source token** (not the account API token) |
| `SLACK_WEBHOOK_URL` | Slack → Apps → Incoming Webhooks → `#holzen-alerts` |

### Optional (same pass)

| Secret | Source |
|--------|--------|
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks → signing secret for `handle-email-suppression` |
| Vercel Production `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Sentry — source maps + frontend errors ([observability-setup.md](../ops/observability-setup.md) §2) |

## Apply locally (preferred)

1. Copy values into `.env.prod.secrets` (gitignored).
2. Push to Supabase:

```bash
npm run prod:secrets-set
```

3. Verify (optional):

```bash
npm run check:cicd-env -- --profile=production --platform=supabase
```

Add `--strict-recommended` to fail on recommended vars too.

## BetterStack API automation (optional)

To create HTTP sources via API instead of the dashboard, add a **Telemetry API token** to `.env.github-secrets.local`:

```env
BETTERSTACK_API_TOKEN=...
```

Then create a source named e.g. `holzen-edges-prod` ([BetterStack create-source API](https://betterstack.com/docs/logs/api/create-a-source/)), copy `ingesting_host` + token into `.env.prod.secrets`, and run `prod:secrets-set`.

Slack incoming webhooks still require one manual create in the Slack UI (no repo automation yet).

## Smoke after wiring

```bash
# Slack (replace with your webhook URL in shell — do not commit)
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"holzen-alerts smoke ping"}' "$SLACK_WEBHOOK_URL"
```

Edge logs: invoke any HTTP edge with `LOG_DRAIN_*` set, then search BetterStack source `holzen-edges` for the request `cid`.

## Related

- Setup bible: [observability-setup.md](../ops/observability-setup.md)
- CI catalog: [cicd-overview.md](../ops/cicd-overview.md)
- Cron heartbeats (separate BetterStack **Uptime** product): [pg-cron-heartbeat-wiring.md](pg-cron-heartbeat-wiring.md)
- Ship checklist: [ship-checklist.md](../ops/ship-checklist.md)
