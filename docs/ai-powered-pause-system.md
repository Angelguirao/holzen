# AI-powered pause system

This document describes **how Holzen turns Bitcoin volatility into a pause experience**: server triggers, reflection text, the intervention layer, companion generation, storage, and the React hooks that tie it together. It is the **system-level** companion to [cron-setup.md](./cron-setup.md) (scheduling SQL) and [navigating-the-codebase.md](./navigating-the-codebase.md) (repo layout).

---

## 1. Scope

| In scope | Out of scope (see other docs / code) |
|----------|--------------------------------------|
| Manual pause vs `check-volatility` | Stripe, push subscription setup details |
| `holzen-reflect` vs inline reflection in `check-volatility` | Every column in every migration |
| `companion-orchestrate`, intervention selection, generators | Non-pause AI (`journal-prompt`, `suggest-grounding`, wallpapers, etc.) |
| Frontend: `use-holzen`, `use-companion-data`, intervention UI | Full admin UI field lists |
| Tables/views this flow touches | Generic Supabase tutorials |

---

## 2. Conceptual model

1. **Trigger** — User opens Pause (client) *or* the `check-volatility` cron decides a user crossed thresholds.
2. **Reflection** — Short copy (+ optional haiku) anchored to market **context** (e.g. “BTC is down 5.2%…”).
3. **Persist** — Insert a `reflections` row; update `profiles.last_message` / `last_context` where applicable.
4. **Companions & intervention** — `companion-orchestrate` chooses an **intervention** (mirror / trap / pattern / question) and, according to **enable flags**, runs **Signal, Grounding, History, Zoom Out** generators in process, then writes structured data back to the reflection (and related tables).
5. **Surface** — Client shows `InterventionSection` plus optional companion cards from user preferences.

---

## 3. Two triggers: comparison

| Aspect | Manual pause (client) | Automatic (`check-volatility` cron) |
|--------|------------------------|-------------------------------------|
| **Entry** | User flow in app → `use-holzen.ts` | `supabase/functions/check-volatility/index.ts` (HTTP + service auth) |
| **BTC data** | Client `fetchBtcData` (`src/lib/btc.ts`) for context string | CoinGecko `market_chart` 1d + 7d inside the function |
| **Thresholds** | User-initiated (cooldown in hook: 15 min, or 5 s in dev mode) | Per-profile `threshold` / `threshold_down`, `cumulative_threshold`, `cooldown_hours`, quiet hours, `snoozed_until` |
| **Reflection AI** | Edge function **`holzen-reflect`** | Inline **`generateReflection()`** in `check-volatility` (same Lovable gateway pattern, different prompt surface) |
| **Mood** | Collected in UI; stored on `reflections.mood` | **Not collected** — `mood` is absent for this path |
| **Severity sent to orchestrator** | `use-companion-data` passes numeric `severity` from client | **`userId`, `severity` (24h abs %), `reflectionMessage`** added at orchestrate call time (see §7) |
| **Notifications** | In-app session | Push, optional email, `pause_notifications` row |
| **Orchestrator auth** | User JWT via `supabase.functions.invoke` | **Service role** `Authorization` + **`userId` in JSON body** (required for `companion-orchestrate` to attribute work to the correct user) |

**Implication:** Prompt changes, quality gates, or model lists must be updated in **both** `holzen-reflect` and `check-volatility` if you want parity. Today they are **not** shared code.

---

## 4. Reflection generation (dual path)

### 4.1 `holzen-reflect` (manual)

- **File:** `supabase/functions/holzen-reflect/index.ts`
- **Auth:** User Bearer JWT; logs `analytics_events.pause_ai_call` (counts toward rate limit — see §12).
- **Input highlights:** `context`, `tone`, `style`, `moodHistory`, `severity`, `currency`, `language`, `recentHaikus`, `recentMessages`, `customPrompt`, `motivations`, `mantra`, `groundingActivities`.
- **Output (HTTP JSON):** **`message`**, **`haiku`** only.  
  - **Drift:** `use-holzen.ts` also reads `learning_title`, `learning_body`, `learning_citation`, `learning_url` from the response and **passes `learningSources` in the body**, but **`holzen-reflect` does not read `learningSources` or return learning fields** — those columns are typically **null** on manual inserts.
- **Models:** `google/gemini-3-flash-preview` then `google/gemini-2.5-flash` via `https://ai.gateway.lovable.dev/v1/chat/completions`, `response_format: json_object`.
- **Extras:** Adaptive blocks from mood history, severity bands, deduplication hints for haiku/message, `PROMPT_VERSION`, quality gate (`quality.ts`), curated fallback `REFLECTION_FALLBACKS`.

### 4.2 `generateReflection` inside `check-volatility` (automatic)

- **Same gateway URL and primary model** (`gemini-3-flash-preview`) but **tool call** schema `generate_reflection` returning message, haiku, **and** learning fields in one shot.
- **Profile toggles:** `companion_haiku`, `companion_learning` strip haiku / learning before DB insert.
- **Tone / language** from `profiles.reflection_tone`, `profiles.language`.
- **No** `style` dimension, mood history, adaptive journey text, or `holzen-reflect` severity paragraphs — intentionally slimmer.

---

## 5. Client flow after reflection (manual path)

1. **`use-holzen.ts`** — Calls `holzen-reflect`, inserts `reflections`, updates profile, sets local companion state from **haiku only** (learning fields from response are usually undefined).
2. **Pause UI** — Uses `use-companion-data.ts` with `reflectionId`, `context`, `reflectionMessage`, **`mood`**, **`severityNumber`**, language.
3. **`use-companion-data`** — Loads partial companion data from the reflection row if already present; builds **`moodHistory`** from recent `reflections` (`mood`, `outcome`); invokes **`companion-orchestrate`** with `useIntervention: true` and per-preference **`needSignal` / `needGrounding` / `needHistory` / `needZoomOut`** (cached slots skipped).

---

## 6. `companion-orchestrate` (single entry point)

- **File:** `supabase/functions/companion-orchestrate/index.ts`
- **Role:** Auth → rate limit → daily budget → parse body → **`determineSessionIntent`** → **`selectIntervention`** → optional **`generateQuestion`** (question mode) → parallel **generator tasks** (gated by `enableSignal` / `enableGrounding` / `enableHistory` / `enableZoomOut`) → assemble **`intervention`** + legacy companion results → `companion_serves` inserts → **`writeCompanionData`** (dual-write to join table + denormalized columns on `reflections`).

### 6.1 Authentication (important)

- **User calls:** `Authorization: Bearer <user JWT>` (Supabase anon client + JWT).
- **Server calls (e.g. cron):** `Authorization: Bearer <service_role key>` and **JSON field `userId`** (the target `auth.users` id). Without `userId`, the function returns **400**.

### 6.2 Intervention selection

- **File:** `supabase/functions/_shared/intervention-selector.ts`
- **Order:** Mirror (past similar session via `find_similar_reflection`) → trap (mood + direction) → pattern (high severity) → **question mode** (mild + ≥20 past sessions) → default pattern (+ optional zoom_out).
- **Mirror payload:** When `primary === "mirror"`, **`mirrorData`** from `buildMirror` must appear on the response. The orchestrator sets **`intervention.primary = { type: "mirror", data: mirrorData }`** in that case (see §11 for historical gap).

### 6.3 Question mode

- **File:** `supabase/functions/_shared/generators/question.ts`
- **Invocation:** When `selection.mode === "question"`, orchestrator awaits **`generateQuestion`** in parallel with generator tasks (`questionPromise`).

### 6.4 Session intent (theming)

- **File:** `supabase/functions/_shared/session-intent.ts`
- **Inputs:** `context` (parse “is up” / “is down”), `mood`, numeric `severity`, `moodHistory` (selling pattern).
- **Automatic path:** Until recently, **no mood** and **no severity** were sent from `check-volatility`, so intent skewed toward **neutral-exploration** and severity branches did not run. **`severity` is now sent** (24h absolute % change) so bucketing aligns better with manual sessions.

---

## 7. Generator family (orchestrated)

All are imported **directly** in `companion-orchestrate` (not HTTP to `signal-companion`, `historical-insight`, etc. — those remain thin standalone endpoints if needed).

| Generator | File | First hop | Fallback chain (simplified) |
|-----------|------|-----------|------------------------------|
| Signal | `_shared/generators/signal.ts` | Perplexity + structure via Lovable/Gemini | `content_library` (essays) → `serveFromCache` → curated |
| Grounding | `grounding.ts` | Perplexity academic + structure | library (papers) → cache → curated |
| History | `history.ts` | Perplexity + structure | library (events) → cache → curated |
| Zoom out | `zoom-out.ts` | `btc_price_cache` + echo + deep-time AI | cache → curated (**no** live CoinGecko in request path) |

**Zoom out dependency:** Cron **`refresh-btc-prices`** must keep `btc_price_cache` fresh ([cron-setup.md](./cron-setup.md)).

**Library “freshness”:** Generators use `includeStale: true` in fallback paths; the 7-day freshness branch in `content-library.ts` is largely **unused** on the live-first path unless you add stricter reads.

---

## 8. Data written by this system

- **`reflections`** — Core row: message, context, mood (manual), haiku, learning_* , structured JSON columns for companions (via `writeCompanionData` / migrations).
- **`reflection_companions`** — Normalized companion payloads (dual-write).
- **`companion_serves`** — Analytics per serve (source, latency, fingerprint).
- **`generation_attempts`** — Model attempts, tokens, estimated cost (where instrumented).
- **`analytics_events`** — e.g. `pause_ai_call`, `intervention_selected`, `reflection_generated`.
- **`companion_cache`**, **`user_companion_serves`**, **`content_library`** — Cache / dedup / fallback content.
- **`pause_notifications`** — In-app bell for server-triggered sessions.
- **`profiles.last_message` / `last_context` / `last_trigger_at`** — Updated on automatic triggers with optimistic cooldown claiming.

---

## 9. Frontend surfaces

| Piece | Role |
|-------|------|
| `use-holzen.ts` | BTC context, manual cooldown, `holzen-reflect`, reflection insert, initial companion state from reflection response |
| `use-companion-data.ts` | Orchestrator invoke, intervention state, per-companion loading/errors, recency hints, library auto-save hooks |
| `InterventionSection.tsx` | Renders mirror / trap / pattern / question + optional zoom-out secondary |
| `CompanionSection.tsx` | Container for companion cards and prefs |
| `src/lib/companion-types.ts` | Canonical type strings shared with tests |

---

## 10. Background jobs (pause-adjacent)

Exact SQL lives in **[cron-setup.md](./cron-setup.md)**. Typical schedules documented there:

| Job | Role for pause system |
|-----|------------------------|
| `check-volatility` | Eligibility + reflection + orchestrator dispatch + notifications |
| `refresh-btc-prices` | Feeds zoom-out generator |
| `pregenerate-companions` | Cache lifecycle + warming |
| `fetch-source-feeds` | Fills `content_library` for fallbacks |
| `check-followups` | Outcome follow-ups (feeds mirror / history of decisions) |
| `night-reflection` | Separate end-of-day message path |

---

## 11. Known inconsistencies, drift, and fixes

### Fixed alongside this doc (code)

1. **`questionPromise` undefined** — `companion-orchestrate` referenced `questionPromise` without defining it, which would **throw** when question mode was selected. **Fixed** by defining `questionPromise` from `generateQuestion` when `selection.mode === "question"`.
2. **Cron → orchestrator auth** — Orchestrator required a **user** JWT; `check-volatility` sent **only** the service role key → **`getUser()` failed**, so companions never generated for automatic sessions. **Fixed** by accepting **service role + `userId` in body** and by **`check-volatility` sending `userId` and `severity`**.
3. **Mirror intervention not returned** — `selectIntervention` could return `primary: "mirror"` with `mirrorData`, but the orchestrator never copied that into **`intervention.primary`**, so the UI could not show mirror. **Fixed** by assigning `interventionPayload.primary` when mirror is selected.

### Remaining / product-level drift (monitor)

| Topic | Detail |
|-------|--------|
| **Dual reflection implementations** | `holzen-reflect` vs `check-volatility.generateReflection` — same product goal, **different prompts and features**. Unify via a shared module if you want one source of truth. |
| **Manual learning fields** | Client expects learning fields from `holzen-reflect`; function does not produce them. Either extend `holzen-reflect` or stop writing those columns from the client. |
| **Server path vs user prefs** | Cron dispatch uses **all** `enable*` flags `true`, independent of per-user companion toggles. The client respects prefs when **it** calls the orchestrator. |
| **Intervention vs “run all generators”** | Orchestrator still runs **every** companion task whose `enable*` is true, even when intervention is mirror/question; the **UI** leads with intervention. Narrowing generation to “only what intervention needs” would save cost (future optimization). |
| **Rate limit list** | `checkRateLimit` counts specific `analytics_events` event names. **`intervention_selected` is not in the list**; **`companion-orchestrate` does not log `pause_ai_call`**. Manual reflection remains the main throttle for “pause AI” spend per user. |
| **Admin surface** | Seven tabs in `Admin.tsx`: Monitor, Content, Sources, Tools, Library, Feed, Rejections. |

---

## 12. Cost and limits (orchestrator)

- **Daily budget:** `checkDailyBudget(svcClient, 10.0)` — sums `generation_attempts.estimated_cost_usd` from UTC midnight (`_shared/ratelimit.ts`).
- **Rate limit:** 30 requests / 60 minutes per user over a fixed allowlist of `analytics_events.event` values (does **not** include orchestrator-only events — see §11).

---

## 13. Security notes

- **User JWT** paths validate via `getUser()`.
- **Service role** path is **only** as trustworthy as your cron secrets and network; `userId` in the body must **only** be accepted when the bearer is the service role key (implemented in orchestrator).
- Prompt hardening: `sanitize.ts`, quality gates, `containsCryptoLanguage`, etc., in shared modules.

---

## 14. File index (pause core)

```
supabase/functions/
├── holzen-reflect/index.ts
├── companion-orchestrate/index.ts
├── check-volatility/index.ts
├── refresh-btc-prices/index.ts
├── pregenerate-companions/index.ts
├── fetch-source-feeds/index.ts
├── check-followups/index.ts
├── night-reflection/index.ts
├── signal-companion/index.ts          # thin standalone
├── historical-insight/index.ts
├── zoom-out-companion/index.ts
├── ground-nudge/index.ts
└── _shared/
    ├── session-intent.ts
    ├── intervention-selector.ts
    ├── companion-data.ts
    ├── generators/{ signal, grounding, history, zoom-out, question, mirror }.ts
    ├── quality.ts, sanitize.ts, cache.ts, content-library.ts, observe.ts, ratelimit.ts, fallbacks.ts

src/hooks/use-holzen.ts
src/hooks/use-companion-data.ts
src/components/InterventionSection.tsx
src/components/CompanionSection.tsx
```

---

## 15. Related reading

- [cron-setup.md](./cron-setup.md) — pg_cron + `net.http_post` snippets  
- [navigating-the-codebase.md](./navigating-the-codebase.md) — repo tour and edge function invoke map  
- [README.md](../README.md) — local dev, env modes  

When you change **prompts**, bump the relevant **`PROMPT_VERSION`** constants in the touched generator (or `holzen-reflect`) so fingerprints in `companion_serves` / analytics stay meaningful.
