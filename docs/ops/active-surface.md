# Active surface manifest (pause-first shipped scope)

**Status:** Shipped on `feature/mvpPauseCleanup` (pause-first product strip).

**Recovery:** Full pre-strip snapshot: git tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`.

**Telemetry baseline:** `20260521200000_holzen_mvp_launch_cutover.sql` truncates `analytics_events`, `generation_attempts`, `companion_serves`, `user_companion_serves` (tables kept).

## Shipped client routes (authenticated shell)

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/archive` | Archive |
| `/journey` | Journey overview |
| `/settings` | Settings hub + sections |

**Public:** `/roadmap` (voting), landing, auth, legal.

**Full-screen (no bottom nav):** `/pause`, `/companion/*`

**Dead IA (404 only):** `/tools`, `/tools/*`, `/library`, `/journey/stats`, `/journey/:tab`, …

## Subscription

| `profiles.subscription_status` | Client `entitlement` | Pause engage |
| --- | --- | --- |
| `free` (no Stripe customer) | `pre_trial` | After `ensure-trial-subscription` |
| `trialing` / `active` | `trialing` / `active` | Yes |
| `lapsed` | `lapsed` | No (Archive/Journey read OK) |

Server: `user_can_engage_pause(uuid)`; guards on `pause_create_or_reuse` and `pause_log_step`. Sync: `check-subscription`, `stripe-webhook`, `ensure-trial-subscription`.

## Deployed edges (shipped)

Active in `supabase/config.toml` + `EdgeCoverage.tsx`: pause (`holzen-reflect`, `companion-orchestrate`, `pregenerate-companions`), volatility (`check-volatility`, `refresh-btc-prices`), billing (`check-subscription`, `create-checkout`, `ensure-trial-subscription`, `stripe-webhook`, `customer-portal`, credits), account (`delete-account`, `export-user-data`), `health`, `send-feedback`, admin edges as listed in config.

**Undeployed / legacy:** `supabase/functions/legacy/` (ingest, badges, night reflection, letters, digest, etc.).

## pg_cron (kept)

| Job | Purpose |
| --- | --- |
| `check-volatility` | Pause offers from thresholds |
| `refresh-btc-prices` | Market data |
| `pregenerate-companions` | Warm `companion_cache` |
| `process-email-queue` | Transactional email (pause-related templates) |

**Unscheduled in cutover:** `badge-notify`, `fetch-source-feeds`, `weekly-digest` (`daily-digest-10am`), `night-reflection`, `deliver-letters-check`, `ground-nudge`, `monthly-report-1st`, `personalized-nudge-12h`, `check-followups-hourly`.

## Postgres — Tier B dropped (do not query)

`user_badges`, `badge_definitions`, `practice_entries`, `reflection_insights`, `future_letters`, `night_reflections`, `graph_edges`, `ritual_completions`, `ritual_templates`, `grounding_enrichment_cache`, **`content_library`**.

## Postgres — Tier C (shipped)

`pause_*`, `collections` / `collection_items`, trimmed `profiles`, `notifications`, `roadmap_items` / `roadmap_votes`, `companion_cache`, `companion_serves`, `companion_fallbacks`, `generation_attempts`, `signal_sources`, `user_signal_preferences`, `signal_source_suggestions`, `quiet_windows`, Stripe/credits, `btc_price_cache`, email infra, `audit_log`, `app_config`.

## Schema notes

- Reflect-step artifact kind: **`opening_message`** (`v_pause_full.opening_message`).
- `profiles` columns removed: `ai_insights_enabled`, `night_reflection_hour`, `digest_frequency`, `ritual_template`, `notify_badges`, `streak_freeze_dates`, `companion_breathing` (`20260522130000_drop_companion_breathing.sql`).
- Companions: **`COMPANION_PHASE_LIBRARY=false`** default — cache → live → curated only.

## PostHog (shipped)

| Event | When |
| --- | --- |
| `app.route_not_found` | NotFound |
| `journey.overview_viewed` | Journey overview |
| `onboarding.completed` | Onboarding + trial ensure |
| `trial.started` | New Stripe trial (`source: ensure_trial`) |
| `trial.expired` | Entitlement → `lapsed` |

Full taxonomy: [event-taxonomy.md](./event-taxonomy.md).

## Agent / contributor entry

- [src/README.md](../../src/README.md) — active tree map
- [.cursor/rules/active-surface.mdc](../../.cursor/rules/active-surface.mdc) — import guardrails
- [launch-runbook.md](./launch-runbook.md) — ship checklist
- [bruno/active/functions-catalog.md](../../bruno/active/functions-catalog.md) — HTTP mirror of deployed edges
