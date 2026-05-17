# Bruno — Holzen HTTP review

Open this folder (**`bruno/`**, contains `bruno.json`) as a Bruno collection.

**Start in [`active/`](active/)** — pause-first shipped requests. Pre-strip reference: [`legacy/full-shell/`](legacy/full-shell/).

See **[SCOPE.md](SCOPE.md)** (HTTP vs SPA) and **[`active/functions-catalog.md`](active/functions-catalog.md)** (deployed edges). Playbooks: [docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md).

## One-time setup

1. Install [Bruno](https://www.usebruno.com/).
2. **Open collection:** `holzen/bruno`.
3. Copy an environment (gitignored):

| File | Example |
| --- | --- |
| `environments/local.bru` | [`local.bru.example`](environments/local.bru.example) |
| `environments/hosted.bru` | [`hosted.bru.example`](environments/hosted.bru.example) |

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key |
| `AUTH_EMAIL` / `AUTH_PASSWORD` | Test user |
| `SERVICE_CRON_BEARER` | For `active/service-cron/` only |
| `LOVABLE_API_KEY` | For `active/auth-hook/` preview only |

After auth, `active/auth/00` and `01` set **`SUPABASE_ACCESS_TOKEN`** (and **`AUTH_USER_ID`** when present).

## Layout

| Path | Role |
| --- | --- |
| **`active/`** | **Default** — auth, pause, billing, platform, shipped crons |
| **`legacy/full-shell/`** | Retired full-IA `.bru` (undeployed on prod) |
| **`environments/`** | `local` / `hosted` vars |

## Typical MVP flow

1. `active/auth/01-sign-in-password`
2. `active/pause-pipeline/*`, `active/billing/*`, `active/platform/health`
3. Pre-publish smoke: [active/README.md](active/README.md) + [launch-runbook](../docs/ops/launch-runbook.md) §4

Cron / batch: `active/service-cron/` with **`SERVICE_CRON_BEARER`** — staging first.

**Not in Bruno:** `stripe-webhook` (signatures); full pause RPC path (use app).

## Running a review

- **401 user calls:** Re-run `active/auth/01` or fix env vars.
- **401 cron:** Fix `SERVICE_CRON_BEARER` ([`active/service-cron/README.md`](active/service-cron/README.md)).
- **Edge logs:** Dashboard → Edge Functions; filter **`cid`** ([logging strategy](../docs/ops/logging-strategy.md)).

Bruno does **not** cover React UI — see [e2e backlog](../docs/backlog/e2e-browser-automation.md).
