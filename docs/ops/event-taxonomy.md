# Event Taxonomy

The authoritative list of PostHog events Holzen emits. Deliberate events only — autocapture is off.

**Principles**

1. **Frontend journey events → PostHog.** Funnel steps, retention anchors, feature usage.
2. **Backend telemetry → Postgres** (`analytics_events`, `generation_attempts`, `companion_serves`, `audit_log`). Anything needing SQL joins, RLS, billing integrity stays here.
3. **Errors → Sentry**, not PostHog.
4. **No PII in properties.** See [pii-masking-review.md](pii-masking-review.md).
5. **User join key = `user_id`.** PostHog registers it as `distinct_id` on identify. Super-properties: `cid`, `app_version`.

## Naming convention

`<domain>.<action>` in lowercase snake-case. Past-tense verbs for completed actions, present-tense for initiations.

- ✅ `reflection.completed`, `generation.initiated`, `paywall.viewed`
- ❌ `reflectionDone`, `PaywallView`, `trackGeneration`

## Instrumentation status

- **Wired** (emission live in code): `auth.signed_up`, `auth.signed_in`, `auth.signed_out`.
- **Planned, next PR:** `reflection.completed`, `generation.initiated`, `companion.served`, `paywall.viewed`, `paywall.subscribed`, `feedback.submitted`, `performance.web_vital`, `ritual.*`.
- **Convention:** every new event adds a row below AND a call to `trackEvent('name', props)` in the feature's source — never add events in the PostHog UI first.

## Active events

### auth

| Event | When | Properties | Owner |
|---|---|---|---|
| `auth.signed_up` | First successful sign-up (once per user) | `{ provider: 'email' \| 'google' \| ... }` | @holzen |
| `auth.signed_in` | Every successful sign-in (not on session refresh) | `{ provider }` | @holzen |
| `auth.signed_out` | Explicit sign-out action (not session expiry) | `{}` | @holzen |

### reflection

| Event | When | Properties | Owner |
|---|---|---|---|
| `reflection.started` | User opens the reflection flow (first keystroke or first view of the input, once per session) | `{ source: 'home' \| 'pause' \| 'journal' }` | @holzen |
| `reflection.completed` | User submits a reflection successfully | `{ duration_s: number; had_bitcoin_context: boolean; companion_types: string[] }` | @holzen |

Note: never send the message text, prompt text, or companion content.

### pause (V2 lifecycle)

All six events share a `pause_instance_id` super-property so PostHog can
stitch a user journey across creation → engagement → completion / expiry,
and pivot against Sentry + BetterStack using the same id.

| Event | When | Properties | Owner |
|---|---|---|---|
| `pause_instance_created` | A `pause_instances` row lands in state `active` (manual hook or cron). | `{ pause_instance_id; template_slug; source: 'manual' \| 'cron_volatility' \| …; severity: 'mild' \| 'moderate' \| 'high' }` | @holzen |
| `pause_engaged` | Transition `active → engaged` (both start gates met). | `{ pause_instance_id; ms_since_created: number }` | @holzen |
| `pause_completed` | Transition to `completed` (strict gates met, ≥1 counted companion). | `{ pause_instance_id; ms_since_created: number; counted_companion_count: number }` | @holzen |
| `pause_expired` | Sweeper or explicit expire. | `{ pause_instance_id; reason: 'context_lost' \| 'window_elapsed' \| 'superseded' \| 'ineligible_user_state' \| 'system_cancelled' }` | @holzen |
| `pause_companion_counted` | Companion complete event with `counts_for_pause=true`. | `{ pause_instance_id; companion_type; entry_point: 'pause_flow' \| 'library' \| 'bell' \| 'admin_preview' }` | @holzen |
| `pause_companion_not_counted` | Companion complete event with `counts_for_pause=false`. | `{ pause_instance_id?: string; companion_type; reason: 'no_active_pause' \| 'outside_window' \| 'context_lost' \| 'not_allowed_for_template' \| 'already_counted'; entry_point }` | @holzen |

PII stance unchanged: no reflection text, no companion content, no mood/outcome payload values — just ids, types, and numeric metadata.

### generation

| Event | When | Properties | Owner |
|---|---|---|---|
| `generation.initiated` | Frontend sends a companion generation request (one per card tap) | `{ companion_type: 'signal' \| 'grounding' \| 'history' \| 'zoom_out'; source: 'pause' \| 'lazy' \| 'regenerate' }` | @holzen |
| `companion.served` | Frontend renders a companion card for the first time | `{ companion_type; source: 'live' \| 'library' \| 'cache' \| 'curated' \| 'empty'; slot: string }` | @holzen |

### paywall

| Event | When | Properties | Owner |
|---|---|---|---|
| `paywall.viewed` | Paywall UI impression | `{ source: 'feature-gate' \| 'limit-hit' \| 'settings' }` | @holzen |
| `paywall.subscribed` | Successful subscription (post Stripe checkout return) | `{ plan: 'monthly' \| 'yearly' }` | @holzen |

### ritual

| Event | When | Properties | Owner |
|---|---|---|---|
| `ritual.suggested` | Ritual suggestion surfaces | `{ ritual_key: string }` | @holzen |
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
- `app_version` — `__APP_VERSION__` from the Vite build

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
