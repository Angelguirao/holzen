# Phase 5: Quality gates, rate limiting, and cache/write semantics

## Scope

- `supabase/functions/_shared/ratelimit.ts`
- `supabase/functions/_shared/quality.ts`
- `supabase/functions/_shared/cache.ts`
- `supabase/functions/_shared/companion-data.ts`

## Rate limiting & budget semantics (`ratelimit.ts`)

### Per-user sliding window rate limit

`checkRateLimit(svcClient, userId, windowMinutes = 60, maxRequests = 30)`:

- Counts only a specific allowlist of `analytics_events.event` values:
  - `signal_companion_ai_call`, `zoom_out_ai_call`, `historical_insight_ai_call`, `pause_ai_call`
  - plus: `journal_prompt_ai_call`, `suggest_grounding_ai_call`, `night_reflection_ai_call`, `reflection_insights_ai_call`, `wallpaper_generation`
- Uses a strict “count in last N minutes” policy.
- **Fail-open:** if the query fails, it returns `{ allowed: true }`.

Implication to validate:

- If companion generators do not consistently emit the matching allowlisted analytics events, the effective rate limit might be looser than “one companion generation per slot”.
- In this repo, the reflection step (manual + cron) appears to insert `pause_ai_call` once before reflection AI runs; companion fan-out might or might not insert separate allowlisted events per companion generator (depends on the code paths in each generator / instrumentation layer).

### Daily budget

`checkDailyBudget(svcClient, dailyBudgetUsd = 10.0)`:

- Sums `generation_attempts.estimated_cost_usd` for rows created since UTC midnight.
- **Fail-open** on errors (allow generation).

## Quality gates (`quality.ts`)

The quality gate is centralized and per-companion-type configurable:

- Slop detection:
  - `BANNED_PHRASES` rejects common “marketing-y” AI phrasing.
  - `containsCryptoLanguage()` rejects generic crypto wording for a Bitcoin-only app.
- Per-companion constraints:
  - Signal, zoom-out deep time, etc. have different min/max body and title word ranges.
  - Some companion types reject market data patterns (percentages/dollars) when `noMarketData: true`.
- Specificity checks:
  - Grounding expects “year + researcher name” patterns.
  - History expects “date or number” patterns.
  - Signal expects non-generic source and avoids the “cryptosovereignty” meme domain.
- Sentence diversity check:
  - detects repetitive sentence openings.

Suggested validation:

- Measure false-reject rates: overly strict specificity regexes can reject valid content (especially depending on language/localization).

## Cache serving and writes (`cache.ts`, `companion-data.ts`)

### Serving from cache

`serveFromCache(...)`:

1. Excludes entries the user has already seen via `user_companion_serves` when `userId` is provided.
2. Optionally filters by market regime (up/down) for context-aware selection.
3. Picks from top quality entries first (`quality_score >= 2`) and prefers least recently served.
4. If it cannot find unseen high-quality entries, it progressively relaxes constraints (down to “any quality” and ignoring user seen).

This is good UX (avoid empty results) but means “you might still see repeats” under heavy load.

### Writing companion data

`writeCompanionData(svcClient, reflectionId, companionType, content)`:

- Always upserts into `reflection_companions` with `{ reflection_id, companion_type, content }`.
- **Grounding is a special case**: it also updates `reflections.grounding_title` and `reflections.grounding_body` for Home pinned reflection display.

## Optional low-risk improvement candidates

1. Fire-and-forget `.then(() => {})` blocks across cron-side code:
   - `cache.ts` `recordUserServe` and `updateServeStats` do not attach a `.catch(...)`.
   - If Supabase queries reject (network, transient errors), this can become unhandled promise noise.
2. Rate limit allowlist consistency:
   - ensure each companion generator path emits exactly the events counted by `checkRateLimit`.

## Next review phase

If you want, we can implement the low-risk `.catch(...)` improvements in cron-side cache helpers, and then we’ll move to RLS + migrations for the tables touched by pause notifications and companion writes (`pause_notifications`, `reflections`, `reflection_companions`, `generation_attempts`, etc.).

