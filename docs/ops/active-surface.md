# Active surface manifest (pause-first shipped scope)

**Status:** Shipped on `feature/mvpPauseCleanup` (pause-first product strip).

**Recovery:** Full pre-strip snapshot: git tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`.

**Telemetry baseline:** Migration `20260521200000_holzen_mvp_launch_cutover.sql` truncates `analytics_events`, `generation_attempts`, `companion_serves`, `user_companion_serves` (tables kept). For ad-hoc SQL on historical rows, treat events before **`telemetry_baseline_at`** as pre-launch noise:

| Field | Value |
| --- | --- |
| `telemetry_baseline_at` | `2026-05-21T20:00:00.000Z` (UTC; matches migration filename `20260521200000`) |

Example: `WHERE created_at >= '2026-05-21T20:00:00.000Z'` on truncated tables is always empty post-cutover; use on **non-truncated** tables if you add backfills.

## Shipped client routes (authenticated shell)

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/archive` | Archive (**Pauses** + **Echoes** tabs — user **Collections** tab not in shipped scope; see below) |
| `/journey` | Journey overview |
| `/settings` | Settings hub + sections |

**Public (SPA, interim):** `/welcome` landing, `/auth`, legal, `/blog` — until Astro cutover on `holzen.app`.

**Not shipped (404):** `/roadmap`, `/reserve` — quarantined in `src/legacy/marketing-roadmap-reserve/`. See [marketing-site-split.md](./marketing-site-split.md).

**Full-screen (no bottom nav):** `/onboarding`, `/pause`, `/companion/*` (grounding full view reads orchestrate/hydrated nudge only — no `grounding-enrich`)

**Dead IA (404 only):** `/tools`, `/tools/*`, `/library`, `/journey/stats`, `/journey/:tab`, …

## Archive — shipped scope vs legacy collections

| Surface | Shipped now | Notes |
| --- | --- | --- |
| Archive **Pauses** / **Echoes** | Yes | `v_pause_archive_*`, `usePauseArchiveList` |
| Archive **Collections** tab | **No (stripped)** | User `collections` / `collection_items` UI in `src/legacy/archive-collections/`; `npm run check:active-surface` blocks `.from('collections'|'collection_items')` in active `src/`. See [pause-client-architecture.md](../systems/pause-client-architecture.md) §7 |
| **`companion_catalog`** | Yes | Curated companion pool — **not** user collections |
| **`useCompanionLibraryFavorites`** | Yes | Slot hearts on `pause_instances.metadata` — misleading “library” name |

**DB:** `collections` / `collection_items` **dropped** in `20260604120000_pause_first_zombie_schema_cleanup.sql`. Recovery requires restoring tables from git history before that migration.

## Home — Zen mode (legacy)

| Surface | Shipped now | Notes |
| --- | --- | --- |
| **Hold** dashboard (`HomeDashboardLayout`, widget customize) | Yes | Default Home |
| **Bulk hold** (retrospective outcome stack on Home) | **No (stripped)** | `src/legacy/bulk-hold/README.md` |
| **Zen** minimal reflection Home | **No (stripped)** | `src/legacy/zen-mode/`; `npm run check:active-surface` blocks Zen symbols / `holzen_zen_mode` in active `src/`. Re-enable via [zen-mode README](../../src/legacy/zen-mode/README.md) |

## Product stance (pause-first)

Holzen **pauses** and rewards **completed rituals** (Journey streak + count). It does **not** judge hold/buy/sell strategy, portfolio targets, or retrospective trade-label hygiene. In-ritual **Decide** records what the user chose when finishing `/pause`; Archive is read-only for expired rows without a decision. This neutrality stance is **Tier A defensibility** — see [strategy-and-defensibility.md](../fundamentals/strategy-and-defensibility.md) §3.

**Not shipped:** Home bulk hold, Archive retrospective “Log decision”, hold-goal **price targets** (legacy DB rows show a migration nudge only). Full stats / alignment scoring: `src/legacy/full-shell/`. Referral program: `src/legacy/referrals/`.

## Referrals (legacy)

| Surface | Shipped now | Notes |
| --- | --- | --- |
| Settings **Invite friends** / milestone rewards | **No (stripped)** | `src/legacy/referrals/`; `npm run check:active-surface` blocks referral table queries, `holzen_ref`, and `record-referral` in active `src/` |
| `?ref=` on landing / welcome | **No (stripped)** | Was `localStorage.holzen_ref` → `record-referral` on sign-in |
| Edges `record-referral`, `process-referral-pending` | **No (undeployed)** | `supabase/functions/legacy/referrals/`; removed from `config.toml` |

**DB:** `referrals`, `referral_rewards`, `referral_pending_jobs`, and `profiles.referral_code` / `referred_by` **dropped** in `20260610210000_pause_first_referral_schema_cleanup.sql`. Recovery requires restoring those objects from pre-cleanup migration history.

## Subscription

| `profiles.subscription_status` | Client `entitlement` | Pause engage |
| --- | --- | --- |
| `free` (no Stripe customer) | `pre_trial` | After `ensure-trial-subscription` |
| `trialing` / `active` | `trialing` / `active` | Yes |
| `lapsed` | `lapsed` | No (Archive/Journey read OK) |

Server: `user_can_engage_pause(uuid)`; guards on `pause_create_or_reuse` and `pause_log_step`. Sync: `check-subscription`, `stripe-webhook`, `ensure-trial-subscription`.

## Pause companions — shipped vs dormant

| Surface | Shipped | Notes |
| --- | --- | --- |
| **Reflect** (`holzen-reflect`) | Yes | Integrated prose v7 |
| **Frame hub** (`PauseFrame`) | Yes | Links to `/companion/*` full views |
| **Lazy companion slots** | Yes | `browser_lazy_fetch` on tap |
| **Featured intervention headline** | **No** | `InterventionSection` stripped; client flag `PAUSE_FEATURED_INTERVENTION_ENABLED` — see [pause-featured-intervention README](../../src/legacy/pause-featured-intervention/README.md) |
| **Intervention-only orchestrate on mount** | **No** | Was `browser_pause_intervention`; edge default `useIntervention` is now `false` |

## Deployed edges (shipped)

Listed in `supabase/config.toml` `[functions.*]` and `src/screens/ops/EdgeCoverageScreen.tsx` `COVERAGE` (also [bruno/active/functions-catalog.md](../../bruno/active/functions-catalog.md)):

| Group | Functions |
| --- | --- |
| Pause | `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions` |
| Volatility | `check-volatility`, `refresh-market-prices`, `backfill-market-prices`, `seed-market-history` |
| Billing | `check-subscription`, `create-checkout`, `ensure-trial-subscription`, `stripe-webhook`, `customer-portal`, `retry-flex-credit`, `list-checkout-events`, `notify-checkout-confirmation` |
| Account / platform | `delete-account`, `health`, `send-feedback`, `register-push`, `holzen-number` |
| Email | `process-email-queue`, `send-transactional-email`, `preview-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`, `auth-email-hook` |
| Ops / admin | `ai-cost-alert`, `admin-check-stripe-prices` |

**Undeployed / legacy:** `supabase/functions/legacy/full-shell/` (ingest, badges, night reflection, letters, digest, `fetch-source-feeds`, …), `supabase/functions/legacy/grounding-enrich/` (citation enrichment — client in `src/legacy/grounding-enrich/`), and `supabase/functions/legacy/referrals/` (`record-referral`, `process-referral-pending` — client in `src/legacy/referrals/`). No `export-user-data` edge exists in this repo.

## pg_cron (kept)

| Job | Purpose |
| --- | --- |
| `check-volatility` | Pause offers from thresholds |
| `refresh-market-prices` | Market data |
| `pregenerate-companions` | Warm `companion_cache` |
| `process-email-queue` | Transactional email (pause-related templates) |

**Unscheduled in cutover:** `badge-notify`, `fetch-source-feeds`, `weekly-digest` (`daily-digest-10am`), `night-reflection`, `deliver-letters-check`, `ground-nudge`, `monthly-report-1st`, `personalized-nudge-12h`, `check-followups-hourly`.

## Postgres — Tier B dropped (do not query)

`user_badges`, `badge_definitions`, `practice_entries`, `reflection_insights`, `future_letters`, `night_reflections`, `graph_edges`, `ritual_completions`, `ritual_templates`.

## Postgres — Tier C (shipped)

`pause_*`, trimmed `profiles`, `notifications`, `roadmap_items` / `roadmap_votes`, **`companion_catalog`** (curated companion pool; renamed from `content_library`), `companion_cache`, `companion_serves`, `companion_fallbacks`, `generation_attempts`, `signal_sources`, `user_signal_preferences`, `signal_source_suggestions`, `quiet_windows`, Stripe/credits, `market_price_cache`, email infra, `audit_log`, `app_config`.

## Postgres — Tier D dropped (zombie schema cleanup)

Migration `20260604120000_pause_first_zombie_schema_cleanup.sql`:

| Dropped | Was | Recovery |
| --- | --- | --- |
| `grounding_enrichment_cache` | Cross-user cache for undeployed `grounding-enrich` edge | Restore table + edge from `src/legacy/grounding-enrich/README.md` |
| `collections` / `collection_items` | User Archive collections (UI in `src/legacy/archive-collections/`) | Restore tables from pre-cleanup migration history |
| `profiles.hold_goal_type` … `hold_goal_target_price` | Home hold-goal widget (not shipped) | Renamed to **`display_currency`** in Tier E — Settings + market quotes |

Migration `20260610210000_pause_first_referral_schema_cleanup.sql`:

| Dropped | Was | Recovery |
| --- | --- | --- |
| `referrals`, `referral_rewards`, `referral_pending_jobs` | Invite-friends program + cron worker | Restore from pre-cleanup migration history; see `src/legacy/referrals/README.md` |
| `profiles.referral_code`, `profiles.referred_by` | Referral link + attribution | Same migration rollback path |
| `claim_referral_pending_jobs` | Queue worker RPC | Same |

## Postgres — Tier E (schema hygiene)

Migration `20260605120000_pause_first_schema_hygiene.sql`:

| Change | Notes |
| --- | --- |
| `profiles.hold_goal_currency` → **`display_currency`** | Settings display currency + CoinGecko `vs_currency`; `update_profile_safe` accepts legacy JSON key |
| `notifications.type` CHECK | **`pause` only** — legacy badge/letter/insight types removed at cutover |
| `app_config.feature_flags` | **`pregenerate` only** (shipped AI kill-switch) |
| Dead `app_config` heartbeat keys | `heartbeat.fetch_source_feeds`, `heartbeat.night_reflection`, `heartbeat.check_followups` deleted |

## Schema notes

- Reflect-step artifact kind: **`reflection_text`** (`v_pause_full.reflection_text`) — **not** renamed to `opening_message`.
- `profiles` columns removed: `ai_insights_enabled`, `night_reflection_hour`, `digest_frequency`, `ritual_template`, `notify_badges`, `streak_freeze_dates`, `companion_breathing` (`20260522130000_drop_companion_breathing.sql`); hold-goal goal fields (`hold_goal_type`, `hold_goal_start`, `hold_goal_target_*`) in `20260604120000_pause_first_zombie_schema_cleanup.sql`. **`display_currency`** (renamed from `hold_goal_currency` in `20260605120000_pause_first_schema_hygiene.sql`) — Settings + market quotes.
- Companions: **catalog → cache → live → curated** (`companion_catalog` table; `COMPANION_PHASE_CATALOG` default on). Code: `_shared/companion-catalog.ts`, `_shared/phase-config.ts`.

## PostHog (shipped)

| Event | When |
| --- | --- |
| `app.route_not_found` | NotFound |
| `journey.overview_viewed` | Journey overview |
| `onboarding.completed` | 4-step onboarding completed (Why first) + trial ensure |
| `trial.started` | New Stripe trial (`source: ensure_trial`) |
| `trial.expired` | Entitlement → `lapsed` |

Full taxonomy: [event-taxonomy.md](./event-taxonomy.md).

## Agent / contributor entry

- [src/README.md](../../src/README.md) — active tree map
- [.cursor/rules/active-surface.mdc](../../.cursor/rules/active-surface.mdc) — import guardrails
- [launch-runbook.md](./launch-runbook.md) — ship checklist
- [bruno/active/functions-catalog.md](../../bruno/active/functions-catalog.md) — HTTP mirror of deployed edges
