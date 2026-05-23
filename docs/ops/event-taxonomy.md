# Event Taxonomy

The authoritative list of PostHog events Holzen emits. Deliberate events only — autocapture is off.

**Principles**

1. **Frontend journey events → PostHog.** Funnel steps, retention anchors, feature usage.
2. **Backend telemetry → Postgres** (`analytics_events`, `generation_attempts`, `companion_serves`, `audit_log`). Anything needing SQL joins, RLS, billing integrity stays here.
3. **Errors → Sentry**, not PostHog.
4. **No PII in properties.** See [pii-masking-review.md](pii-masking-review.md).
5. **User join key = `user_id`.** PostHog registers it as `distinct_id` on identify. Super-properties: `cid`, `environment`, `$app_version` (see `src/lib/posthog.ts`).

## Naming convention

`<domain>.<action>` in lowercase snake-case. Past-tense verbs for completed actions, present-tense for initiations.

- ✅ `pause.manual_completed`, `generation.initiated`, `paywall.viewed`
- ❌ `pauseManualDone`, `PaywallView`, `trackGeneration`

## Instrumentation status

- **Wired (PostHog):** `auth.*`, `navigation.primary_tab_opened`, `home.customize_opened`, `home.optional_widget_toggled`, `home.customize_reset_layout`, `home.hero_quote_viewed`, `home.market_chart_expand_toggled`, `home.goal_why_expand_toggled`, `home.pending_pause_banner_pause_opened` (Home “Your pause” widget: user taps **Continue / open pause** on the **pending context** amber banner while an open pause exists and a `pending` offer is queued), `pause_open_dismissed` (Zen reflection **Done** or dashboard **Dismiss pause** → `pause_dismiss_current`), `pause_session_abandoned` (user confirms **Leave** after `/pause` depth picker or ritual header **Close** before completion — navigates Home without `pause_dismiss_current`), `pause.manual_started` / `pause.manual_completed` (Home “Need a moment”: instance created from market context; **silent** path includes stub `reflection_text`; non-silent defers **`holzen-reflect`** to the Reflect step), `pause_instance_created` (manual new instance), `pause_engaged`, `pause_completed`, `pause_outcome_retrospective` (Archive sheet: `outcome_logged` on **`expired`** or **`dismissed`** without a prior outcome row; outcomes **`held` \| `bought` \| `sold`** only), `pause_companion_counted` / `pause_companion_not_counted` (from `pause_log_step` / `pause_log_companion` RPCs), `pause_reflect_share_tap` / `pause_reflect_wallpaper_tap` / `pause_reflect_post_it_open` (Reflect step + Done-shell share/wallpaper; post-it on Reflect only), `generation.initiated`, `companion.served`, `paywall.viewed` (feature-gate, limit hit, upgrade buttons in Settings), `paywall.subscribed` (subscription checkout return; `plan` from `check-subscription` `subscription_billing_interval` when a fresh Stripe read is available, else `unknown`), `feedback.submitted` (after `send-feedback` success), `performance.web_vital`, `ritual.suggested` / `ritual.suggestion_refreshed` / `ritual.accepted` / `ritual.declined` (Ground), plus **companion idempotency diagnostics** below.
- **Postgres (not PostHog):** PWA install prompts (`InstallHolzenCard` → `analytics_events`), edge `trackEvent` AI call counters, etc.
- **Convention:** every new event adds a row below AND a `trackEvent` call in source — never define events only in the PostHog UI.

### companion idempotency (PostHog diagnostics)

| Event | When | Properties |
|------|------|------------|
| `intervention_idempotency_skip` | Idempotency layer skips a duplicate `companion-orchestrate` intervention call | `{ pause_instance_id, layer }` |
| `intervention_idempotency_dedup` | Two callers joined the in-flight request | `{ pause_instance_id, … }` |
| `intervention_idempotency_storage_error` / `intervention_idempotency_fallback_used` / `intervention_first_call_latency` | Storage / latency instrumentation | (see `src/features/pause/application/use-cases/ritual/frame/intervention-idempotency.ts`) |

## Active events

### navigation

| Event | When | Properties | Owner |
|---|---|---|---|
| `navigation.primary_tab_opened` | User taps a **different** primary bottom tab (shell) than the current one | `{ tab: 'home' \| 'archive' \| 'journey' \| 'settings' }` | @holzen |

Does not fire when re-tapping the active tab or when navigation is not from the bottom bar (e.g. deep link, back button).

The Archive tab uses route `/archive` and reports `tab: 'archive'`.

### app

| Event | When | Properties | Owner |
|---|---|---|---|
| `app.route_not_found` | Catch-all `NotFound` for an unregistered path | `{ attempted_path: string }` — pathname only, no query string | @holzen |

### onboarding

| Event | When | Properties | Owner |
|---|---|---|---|
| `onboarding.completed` | User finishes the 2-step onboarding flow and `ensure-trial-subscription` succeeds | `{ steps_completed: 2 }` | @holzen |

### subscription

| Event | When | Properties | Owner |
|---|---|---|---|
| `trial.started` | Stripe trial subscription created via `ensure-trial-subscription` (`created: true`) | `{ source: 'ensure_trial' }` | @holzen |
| `trial.expired` | Client entitlement transitions to `lapsed` (trial ended without active paid sub) | `{}` | @holzen |

### journey

| Event | When | Properties | Owner |
|---|---|---|---|
| `journey.overview_viewed` | `JourneyOverview` first paint after data ready | `{ streak_days?: number; completed_pause_count?: number }` — aggregates only | @holzen |

### auth

| Event | When | Properties | Owner |
|---|---|---|---|
| `auth.signed_up` | First successful sign-up (once per user) | `{ provider: 'email' \| 'google' \| ... }` | @holzen |
| `auth.signed_in` | Every successful sign-in (not on session refresh) | `{ provider }` | @holzen |
| `auth.signed_out` | Explicit sign-out action (not session expiry) | `{}` | @holzen |

### home

| Event | When | Properties | Owner |
|---|---|---|---|
| `home.customize_opened` | User opens the Customize sheet (bottom sheet) | `{}` | @holzen |
| `home.optional_widget_toggled` | User toggles a Home section on/off in Customize | `{ widget_id: string; visible: boolean }` — `widget_id` is one of `quick-capture`, `night`, or `journey-pulse` (Holzen score + In motion). `goal-why`, `market`, and `your-pause` are always on (layout anchors) and do not emit this event. | @holzen |
| `home.customize_reset_layout` | User taps “Reset to defaults” in Customize (section order, collapse, visibility, and Zen cleared to Hold) | `{}` | @holzen |
| `home.hero_quote_viewed` | Once per Home mount after profile is loaded (daily hero line) | `{ quote_index: number; utc_ymd: string }` — `quote_index` is `0..9` from `heroQuoteIndexForDay`; no quote text | @holzen |
| `home.market_chart_expand_toggled` | User toggles Market chart / 24h detail (chevron next to headline price) | `{ expanded: boolean }` | @holzen |
| `home.goal_why_expand_toggled` | User toggles “Why you stay” (hold goal details + mantra / motivations) | `{ expanded: boolean }` | @holzen |
| `home.pending_pause_banner_pause_opened` | User taps the **pending context** banner CTA on Home (“Your pause” widget) to open `/pause` while a queued `pending` offer exists | `{ pause_instance_id?: string; open_pause_state?: 'active' \| 'engaged' }` — IDs only; no reflection text | @holzen |

### pause — Home manual message (AI)

User triggers from Home; the client creates/opens the V2 pause from market context. **Non-silent:** `holzen-reflect` runs later at the Reflect step. **Silent:** a stub `reflection_text` is written at trigger time.

| Event | When | Properties | Owner |
|---|---|---|---|
| `pause.manual_started` | User starts a manual home pause (first time per **browser tab** session) | `{ surface: 'home' }` | @holzen |
| `pause.manual_completed` | Manual home path finished opening the pause (`pause_create_or_reuse` + context persisted; **silent** also upserts stub `reflection_text`). Does **not** imply `holzen-reflect` ran on Home for non-silent. | `{ duration_s: number; had_bitcoin_context: boolean; companion_types: string[] }` — `companion_types` reserved for preview add-ons when present (often empty until Reflect) | @holzen |

Note: never send the AI message text, prompt text, or full companion bodies.

### pause (V2 lifecycle)

Include `pause_instance_id` on each event so journeys line up with Sentry + BetterStack.

| Event | When | Properties | Owner |
|---|---|---|---|
| `pause_instance_created` | A new `pause_instances` row is created (manual hook or cron): `active` or `pending` when a new context is queued behind an open pause. | `{ pause_instance_id; template_slug; source: 'manual' \| 'cron_volatility' \| …; severity: 'mild' \| 'moderate' \| 'high'; pending_offer?: boolean }` | @holzen |
| `pause_pending_adopted` | User confirms switching from the modal; prior open pause is expired `superseded`. | `{ pause_instance_id }` (the newly active instance) | @holzen |
| `pause_pending_declined` | User keeps the current pause from **`PendingPauseOfferShell`** (off `/pause`) or taps **Keep current pause** in **`PauseLeaveWithPendingSheet`**; pending row expired `system_cancelled`. | `{ pause_instance_id }` (the declined pending row) | @holzen |
| `pause_open_dismissed` | User ends the open pause from Home without entering `/pause` (Zen reflection **Done** or dashboard **Dismiss pause**); calls `pause_dismiss_current`. | `{ surface: 'home_zen_reflection' \| 'home_your_pause_widget'; pause_instance_id?: string }` | @holzen |
| `pause_session_abandoned` | User taps **Close** on `/pause` (depth picker or ritual header) before completion and leaves **without** a queued `pending` pause (direct exit), or taps **Leave** in **`PauseLeaveWithPendingSheet`** when a pending pause exists; navigates Home **without** `pause_dismiss_current` and **without** clearing the persisted ritual snapshot (can resume). | `{ pause_instance_id?: string }` | @holzen |
| `pause_engaged` | `pause_log_step` returns `engaged` (first time per instance in-tab). `volatility_v1` **brief**: first qualifying `initial_emotion_logged` with `brief_ritual` can flip to `engaged` before any `breath_completed`. **Deep**: flips once both `initial_emotion_logged` and (first-segment) `breath_completed` exist — a **set** check in Postgres; in the normal UI the user completes **Feel** then **Breathe**, so this usually fires right after the first Breathe RPC. | `{ pause_instance_id }` (optional: extend with `ms_since_created` when cheap) | @holzen |
| `pause_completed` | `pause_log_step` returns `completed` (first time per instance in-tab). For `volatility_v1`, this fires when **`outcome_logged`** is accepted (companions do not gate); see `docs/systems/pause-system.md` §5.1. | `{ pause_instance_id }` | @holzen |
| `pause_outcome_retrospective` | User saves **`outcome_logged`** from **Archive** for an instance that is still **`expired`** or **`dismissed`** without a prior outcome row (`pause_log_step` retrospective path; `state` unchanged). | `{ pause_instance_id; outcome: 'held' \| 'bought' \| 'sold'; surface: 'archive' }` | @holzen |
| `pause_expired` | Sweeper or explicit expire (reasons include `window_elapsed`, `open_max_age`, `superseded`, …). | *Not emitted from the React app today* — server-side if added later. | @holzen |
| `pause_companion_counted` | Companion complete event with `counts_for_pause=true`. | `{ pause_instance_id; companion_type; entry_point: 'pause_flow' \| 'library' \| 'bell' \| 'admin_preview' }` | @holzen |
| `pause_companion_not_counted` | Companion complete event with `counts_for_pause=false`. | `{ pause_instance_id?: string; companion_type; reason: 'no_active_pause' \| 'outside_window' \| 'context_lost' \| 'not_allowed_for_template' \| 'already_counted'; entry_point }` | @holzen |
| `pause_reflect_share_tap` | User opens the share menu from the Reflect step **or** the Done completion shell (after outcome). | `{ surface: 'pause_reflect' \| 'pause_done'; has_pause_id?: boolean }` | @holzen |
| `pause_reflect_wallpaper_tap` | User starts wallpaper generation from the Reflect step **or** the Done completion shell. | `{ surface: 'pause_reflect' \| 'pause_done' }` | @holzen |
| `pause_reflect_post_it_open` | User taps **Add your post-it** on the Reflect step (reveals note + tags). | `{ surface: 'pause_reflect'; has_pause_id: boolean }` | @holzen |

PII stance unchanged: no generated pause message text, no companion content, no mood/outcome payload values — just ids, types, and numeric metadata.

**Brief vs deep (product analytics):** cohorts and ratios (“% brief pauses”) should use **Postgres**, not extra PostHog properties on `pause_engaged` / `pause_completed`. Query **`v_pause_full`** (or archive **`v_pause_archive_*`**) and aggregate **`is_brief_ritual`** (same predicate as `pause_evaluate_transitions` on Feel — see **`docs/systems/pause-system.md`** §5.1 and §8).

### generation

| Event | When | Properties | Owner |
|---|---|---|---|
| `generation.initiated` | `companion-orchestrate` invoked for a card (lazy first fetch or regenerate) | `{ companion_type: 'signal' \| 'grounding' \| 'history' \| 'zoom_out'; source: 'lazy' \| 'regenerate' }` | @holzen |
| `companion.served` | First fill for a slot (cache hydrate, lazy fetch, regenerate, or intervention sidecar) | `{ companion_type; source: 'live' \| 'catalog' \| 'library' \| 'cache' \| 'curated' \| 'empty'; slot: 'signal' \| 'grounding' \| 'history' \| 'zoomOut' }` | @holzen |

### paywall

| Event | When | Properties | Owner |
|---|---|---|---|
| `paywall.viewed` | Paywall UI impression | `{ source: 'feature-gate' \| 'limit-hit' \| 'settings' }` | @holzen |
| `paywall.subscribed` | After a subscription checkout return; session flag from `?subscribed=true` + `PaywallSubscribedTracker` | `{ plan: 'monthly' \| 'yearly' \| 'unknown' }` — `unknown` if cached `check-subscription` or lifetime / missing Stripe interval | @holzen |

### ritual

| Event | When | Properties | Owner |
|---|---|---|---|
| `ritual.suggested` | Ritual suggestion surfaces | `{ ritual_key: string }` | @holzen |
| `ritual.suggestion_refreshed` | User confirms a new AI suggestion for Ground (allowance use) | `{ ritual_key: string }` | @holzen |
| `ritual.accepted` | User starts a suggested ritual | `{ ritual_key }` | @holzen |
| `ritual.declined` | User dismisses a suggested ritual | `{ ritual_key }` | @holzen |

### feedback

| Event | When | Properties | Owner |
|---|---|---|---|
| `feedback.submitted` | After successful feedback insert | `{ category: 'bug' \| 'feature' \| 'question' }` | @holzen |

**Strict**: never include message content, page, UA, or IDs. Category only.

### performance

| Event | When | Properties | Owner |
|---|---|---|---|
| `performance.web_vital` | Each Web Vital settles (CLS, INP, LCP, FCP, TTFB) | `{ vital: 'CLS' \| 'INP' \| 'LCP' \| 'FCP' \| 'TTFB'; value: number; route: string }` | @holzen |

Web Vitals are also forwarded to Sentry metrics. PostHog copy supports cohort/funnel joins that Sentry can't.

## Super-properties (registered once per session)

- `cid` — per-tab correlation ID (`src/lib/cid.ts`)
- `environment` — Vite `import.meta.env.MODE`
- `$app_version` — `__APP_VERSION__` from the Vite build (PostHog reserved property)

## Adding an event

1. Add a row to the table above (PR must include).
2. Implement emission with the exact name and property schema.
3. Verify properties don't carry PII. `sanitize_properties` is a safety net, not a plan.
4. Do NOT add the event in the PostHog UI.

## Removing an event

1. Mark **deprecated** in the table with a date.
2. Remove emission from code in the same PR.
3. Leave historical data in PostHog (it's cheap and useful for regression checks).

## CI guard (shipped strip)

`npm run check:posthog-events-allowlist` — every `trackEvent('…')` in active `src/` (excluding `src/legacy/` and `src/test/`) must appear in the **Active events** section above. Runs in **`test:ci`** and `scripts/pre-push-check.sh`.

## Server-side events

None. Edge functions emit to `analytics_events` (Postgres) and BetterStack logs — not PostHog. If we later need server-side events in PostHog (e.g. Stripe webhook events), add a dedicated `posthog-capture` pattern via HTTP and document it here.
