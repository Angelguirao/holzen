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

- **Wired (PostHog):** `auth.*`, `navigation.primary_tab_opened`, `home.customize_opened`, `home.optional_widget_toggled`, `home.customize_reset_layout`, `home.hero_quote_viewed`, `home.market_chart_expand_toggled`, `pause.manual_started` / `pause.manual_completed` (Home “Need a moment” + `holzen-reflect` + V2 instance), `pause_instance_created` (manual new instance), `pause_engaged`, `pause_completed`, `pause_companion_counted` / `pause_companion_not_counted` (from `pause_log_step` / `pause_log_companion` RPCs), `generation.initiated`, `companion.served`, `paywall.viewed` (feature-gate, limit hit, upgrade buttons in Settings), `paywall.subscribed` (subscription checkout return; `plan` from `check-subscription` `subscription_billing_interval` when a fresh Stripe read is available, else `unknown`), `feedback.submitted` (after `send-feedback` success), `performance.web_vital`, `ritual.suggested` / `ritual.suggestion_refreshed` / `ritual.accepted` / `ritual.declined` (Ground), plus **companion idempotency diagnostics** below.
- **Postgres (not PostHog):** PWA install prompts (`InstallHolzenCard` → `analytics_events`), edge `trackEvent` AI call counters, etc.
- **Convention:** every new event adds a row below AND a `trackEvent` call in source — never define events only in the PostHog UI.

### companion idempotency (PostHog diagnostics)

| Event | When | Properties |
|------|------|------------|
| `intervention_idempotency_skip` | Idempotency layer skips a duplicate `companion-orchestrate` intervention call | `{ pause_instance_id, layer }` |
| `intervention_idempotency_dedup` | Two callers joined the in-flight request | `{ pause_instance_id, … }` |
| `intervention_idempotency_storage_error` / `intervention_idempotency_fallback_used` / `intervention_first_call_latency` | Storage / latency instrumentation | (see `src/lib/orchestrate-intervention-idempotency.ts`) |

## Active events

### navigation

| Event | When | Properties | Owner |
|---|---|---|---|
| `navigation.primary_tab_opened` | User taps a **different** primary bottom tab (shell) than the current one | `{ tab: 'home' \| 'library' \| 'tools' \| 'journey' \| 'settings' }` | @holzen |

Does not fire when re-tapping the active tab or when navigation is not from the bottom bar (e.g. deep link, back button).

The Archive tab uses route `/library` and **still reports** `tab: 'library'` in this event (label in UI is “Archive”; property unchanged for funnel continuity).

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
| `home.optional_widget_toggled` | User toggles an optional Home module on/off in Customize | `{ widget_id: string; visible: boolean }` — `widget_id` is one of `OPTIONAL_HOME_WIDGET_IDS` | @holzen |
| `home.customize_reset_layout` | User taps “Reset layout & widgets” in Customize | `{}` | @holzen |
| `home.hero_quote_viewed` | Once per Home mount after profile is loaded (daily hero line) | `{ quote_index: number; utc_ymd: string }` — `quote_index` is `0..9` from `heroQuoteIndexForDay`; no quote text | @holzen |
| `home.market_chart_expand_toggled` | User toggles Market chart / 24h detail (chevron next to headline price) | `{ expanded: boolean }` | @holzen |

### pause — Home manual message (AI)

User triggers from Home; `holzen-reflect` returns the text and the client persists the V2 instance and library row (silent or full).

| Event | When | Properties | Owner |
|---|---|---|---|
| `pause.manual_started` | User starts a manual home pause (first time per **browser tab** session) | `{ surface: 'home' }` | @holzen |
| `pause.manual_completed` | `holzen-reflect` + library / artifacts succeeded for that run | `{ duration_s: number; had_bitcoin_context: boolean; companion_types: string[] }` — `companion_types` lists preview add-ons only, e.g. `haiku`, `grounding` (no user text) | @holzen |

Note: never send the AI message text, prompt text, or full companion bodies.

### pause (V2 lifecycle)

Include `pause_instance_id` on each event so journeys line up with Sentry + BetterStack.

| Event | When | Properties | Owner |
|---|---|---|---|
| `pause_instance_created` | A new `pause_instances` row is created (manual hook or cron): `active` or `pending` when a new context is queued behind an open pause. | `{ pause_instance_id; template_slug; source: 'manual' \| 'cron_volatility' \| …; severity: 'mild' \| 'moderate' \| 'high'; pending_offer?: boolean }` | @holzen |
| `pause_pending_adopted` | User confirms switching from the modal; prior open pause is expired `superseded`. | `{ pause_instance_id }` (the newly active instance) | @holzen |
| `pause_pending_declined` | User keeps the current pause; pending row expired `system_cancelled`. | `{ pause_instance_id }` (the declined pending row) | @holzen |
| `pause_engaged` | `pause_log_step` returns `engaged` (first time per instance in-tab). | `{ pause_instance_id }` (optional: extend with `ms_since_created` when cheap) | @holzen |
| `pause_completed` | `pause_log_step` returns `completed` (first time per instance in-tab). | `{ pause_instance_id }` | @holzen |
| `pause_expired` | Sweeper or explicit expire. | *Not emitted from the React app today* — server-side if added later. | @holzen |
| `pause_companion_counted` | Companion complete event with `counts_for_pause=true`. | `{ pause_instance_id; companion_type; entry_point: 'pause_flow' \| 'library' \| 'bell' \| 'admin_preview' }` | @holzen |
| `pause_companion_not_counted` | Companion complete event with `counts_for_pause=false`. | `{ pause_instance_id?: string; companion_type; reason: 'no_active_pause' \| 'outside_window' \| 'context_lost' \| 'not_allowed_for_template' \| 'already_counted'; entry_point }` | @holzen |

PII stance unchanged: no generated pause message text, no companion content, no mood/outcome payload values — just ids, types, and numeric metadata.

### generation

| Event | When | Properties | Owner |
|---|---|---|---|
| `generation.initiated` | `companion-orchestrate` invoked for a card (lazy first fetch or regenerate) | `{ companion_type: 'signal' \| 'grounding' \| 'history' \| 'zoom_out'; source: 'lazy' \| 'regenerate' }` | @holzen |
| `companion.served` | First fill for a slot (cache hydrate, lazy fetch, regenerate, or intervention sidecar) | `{ companion_type; source: 'live' \| 'library' \| 'cache' \| 'curated' \| 'empty'; slot: 'signal' \| 'grounding' \| 'history' \| 'zoomOut' }` | @holzen |

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

## Server-side events

None. Edge functions emit to `analytics_events` (Postgres) and BetterStack logs — not PostHog. If we later need server-side events in PostHog (e.g. Stripe webhook events), add a dedicated `posthog-capture` pattern via HTTP and document it here.
