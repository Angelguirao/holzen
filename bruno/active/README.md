# Bruno — pause-first shipped (start here)

**Default collection tree** for Holzen MVP HTTP review. Open collection root [`../`](../) in Bruno, then run requests under **`active/`** only unless you are debugging pre-strip behavior ([`../legacy/full-shell/`](../legacy/full-shell/)).

Environment: **`hosted`** or **`local`** ([`../environments/`](../environments/)). Run **`auth/01-sign-in-password`** first for any user-JWT request.

## Smoke sequence (pre-publish)

1. `auth/01-sign-in-password`
2. `public/holzen-number`
3. `pause-pipeline/01-holzen-reflect`
4. `pause-pipeline/02-companion-orchestrate` (paste `pauseInstanceId` from app or Studio when testing orchestrate)
5. `billing/02-check-subscription`
6. `billing/04-ensure-trial-subscription` — idempotent trial start (onboarding)
7. `platform/health`

Optional staging: `service-cron/check-volatility` with **`SERVICE_CRON_BEARER`** ([`service-cron/README.md`](service-cron/README.md)).

Full catalog: [`functions-catalog.md`](functions-catalog.md). Human checklist: [launch-runbook](../../docs/ops/launch-runbook.md) §4.

## Folders

| Folder | Auth | Contents |
| --- | --- | --- |
| `auth/` | Supabase Auth | Sign-up, sign-in |
| `public/` | Anon `apikey` | `holzen-number` |
| `pause-pipeline/` | User JWT | `holzen-reflect`, `companion-orchestrate` |
| `billing/` | User JWT | Checkout, subscription, portal, `ensure-trial-subscription` |
| `platform/` | User JWT or none | `health`, feedback, push, referral, **delete-account** (dangerous) |
| `service-cron/` | `SERVICE_CRON_BEARER` | Shipped crons: volatility, BTC prices, pregenerate, backfill, seed, referral pending |
| `auth-hook/` | `LOVABLE_API_KEY` | Email template preview only |

All requests include **`x-cid: bruno-{{$timestamp}}-review`** for log correlation (parity with app `invokeEdge`).
