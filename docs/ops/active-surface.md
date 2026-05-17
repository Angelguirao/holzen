# Active surface manifest (pause-first MVP)

**Status:** Shipped on `feature/mvpPauseCleanup` (pause-first MVP).

**Recovery:** Full pre-strip snapshot: git tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`.

## Shipped client routes (authenticated shell)

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/archive` | Archive |
| `/journey` | Journey overview |
| `/settings` | Settings hub + sections |

**Full-screen (no bottom nav):** `/pause`, `/companion/*`

**Dead IA (404 only):** `/tools`, `/tools/*`, `/library`, `/journey/stats`, `/journey/:tab`, …

## Subscription (§5.4)

| `profiles.subscription_status` | Client `entitlement` | Pause engage |
| --- | --- | --- |
| `free` (no Stripe customer) | `pre_trial` | After `ensure-trial-subscription` |
| `trialing` / `active` | `trialing` / `active` | Yes |
| `lapsed` | `lapsed` | No (Archive/Journey read OK) |

Server: `user_can_engage_pause(uuid)`; guards on `pause_create_or_reuse` (authenticated) and `pause_log_step` (active/engaged). Sync: `check-subscription`, `stripe-webhook`, `ensure-trial-subscription`.

## Deployed edges

MVP list: `check-subscription`, `create-checkout` (reactivation), `ensure-trial-subscription`, `stripe-webhook`, `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions`, `health`, plus billing/account edges in `supabase/config.toml`. Undeployed: `supabase/functions/legacy/`.

## PostHog (shipped)

| Event | When |
| --- | --- |
| `app.route_not_found` | NotFound for unknown path |
| `journey.overview_viewed` | Journey overview mount |
| `onboarding.completed` | 2-step onboarding finished (`ensureTrial`) |

Full taxonomy: [event-taxonomy.md](./event-taxonomy.md).
