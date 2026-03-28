# AI-powered pause system

This document describes **how Holzen turns Bitcoin volatility into a pause experience**: server triggers, reflection text, the intervention layer, companion generation, storage, and the React hooks that tie it together. It is the **system-level** companion to [cron-setup.md](./cron-setup.md) (scheduling SQL) and [navigating-the-codebase.md](./navigating-the-codebase.md) (repo layout).

---

## 1. Scope

| In scope | Out of scope (see other docs / code) |
|----------|--------------------------------------|
| Manual pause vs `check-volatility` | Stripe, push subscription setup details |
| Shared `_shared/reflection-generate.ts` (both triggers) | Every column in every migration |
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
| **Reflection AI** | **`holzen-reflect`** → **`generateUnifiedReflection({ includeLearning: false })`** | **`check-volatility`** → **same** (`includeLearning: false`) — `_shared/reflection-generate.ts` |
| **Mood** | Collected in UI; stored on `reflections.mood` | Not set on the new row; **reflection prompts** use **mood history** from the last 20 `reflections` with `mood`. **Orchestrator** receives **`mood`** = most recent prior mood (if any) plus **`moodHistory`** for session intent (same idea as the client path). |
| **Style / extras** | Full: `style`, `customPrompt`, `motivations`, `mantra`, `groundingActivities`, client-supplied `recentHaikus` / `recentMessages` | Profile-backed: `reflection_style`, sanitized `custom_prompt`, `motivations`, `mantra`, `grounding_activities` (same **`sanitize.ts`** limits as **`holzen-reflect`**). **`recentMessages`** / **`recentHaikus`**: up to 5 each from the user’s last 20 reflection rows (dedup signal for the shared generator). |
| **Reflection row `grounding_*`** | **Null** at insert (JSON path); Ground content comes from **`companion-orchestrate`** | **Null** at insert; **`companion_haiku`** still toggles haiku; Ground / Signal / etc. come **only** from orchestrate |
| **Orchestrator body** | `use-companion-data`: prefs → **`needSignal` / `needGrounding` / `needHistory` / `needZoomOut`**, plus `mood`, `severity`, etc. | **`userId`, `severity` (24h abs %), `reflectionMessage`, `mood`, `moodHistory`**, and **`enableSignal` / `enableGrounding` / `enableHistory` / `enableZoomOut`** from profile columns **`companion_signal`**, **`companion_grounding`**, **`companion_history`**, **`companion_zoom_out`** (each defaults **true** if unset). Client pref key is still **`learning`** → maps to **`companion_grounding`**. |
| **Notifications** | In-app session | Push, optional email, `pause_notifications` row |
| **Orchestrator auth** | User JWT via `supabase.functions.invoke` | **Service role** `Authorization` + **`userId` in JSON body** |

**Shared logic:** One implementation for adaptive context (mood history, severity bands, Fear & Greed guidance, banned phrases, haiku/message dedup when inputs provided), model fallback order, and the reflection quality gate. Bump **`REFLECTION_PROMPT_VERSION`** in `reflection-generate.ts` when you change that behavior.

---

## 4. Reflection generation (`_shared/reflection-generate.ts`)

- **`generateUnifiedReflection(params)`** — Lovable gateway, primary `google/gemini-3-flash-preview` then `google/gemini-2.5-flash`.
- **`includeLearning: false`** (default for both **`holzen-reflect`** and **`check-volatility`**): `response_format: json_object` with `message` + `haiku` only; quality gate. **`includeLearning: true`** remains in the module for optional use (tool call + learning fields + URL check) but **cron no longer uses it** — companion columns are filled by **`companion-orchestrate`** only.
- **Callers:** `holzen-reflect/index.ts` (auth, sanitization, analytics, curated fallback) and `check-volatility/index.ts` (eligibility, notifications, orchestrator dispatch).

---

## 5. Client flow after reflection (manual path)

1. **`use-holzen.ts`** — Calls `holzen-reflect`, inserts `reflections`, updates profile, sets companion state from response (haiku; **`grounding_*` null** at insert — same as cron; orchestrate fills companion columns).
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
- **Mirror payload:** When `primary === "mirror"`, the orchestrator sets **`intervention.primary = { type: "mirror", data: mirrorData }`** from `selectIntervention`.

### 6.3 Question mode

- **File:** `supabase/functions/_shared/generators/question.ts`
- **Invocation:** When `selection.mode === "question"`, orchestrator awaits **`generateQuestion`** in parallel with generator tasks (`questionPromise`).

### 6.4 Session intent (theming)

- **File:** `supabase/functions/_shared/session-intent.ts`
- **Inputs:** `context` (parse “is up” / “is down”), `mood`, numeric `severity`, `moodHistory` (selling pattern).
- **Automatic path:** **`severity`** (24h absolute % change) and a **mood proxy** (latest prior `reflections.mood` when present) plus **`moodHistory`** are sent from `check-volatility`, so **`selectIntervention`** / session intent align more closely with manual sessions when the user has reported moods before.

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

- **`reflections`** — Core row: message, context, mood (manual), haiku, **`grounding_*`** (Ground companion denormalized fields), structured JSON columns for other companions (via `writeCompanionData` / migrations).
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
4. **Unified reflection pipeline** — **`_shared/reflection-generate.ts`** (`generateUnifiedReflection`) is used by **`holzen-reflect`** and **`check-volatility`** with **`includeLearning: false`** (message + haiku only). **`grounding_*`** on **`reflections`** are written by **`companion-orchestrate`**, not the reflection step.
5. **Cron parity with manual pause** — **`check-volatility`** loads the same profile-backed reflection fields (style, custom prompt, motivations, mantra, grounding activities, sanitized like **`holzen-reflect`**), builds **recent message/haiku** lists from recent rows, and calls **`companion-orchestrate`** with **per-user `enable*` flags** and **mood / moodHistory** when available.

### Remaining / product-level drift (monitor)

These are **not bugs** in the parity work; they describe how the system behaves today and what you might change later.

**Optional tool + learning fields on reflection**

- **What:** `generateUnifiedReflection` can be called with **`includeLearning: true`** (tool call + `grounding_*` fields in the model response).
- **Reality:** Production uses **`includeLearning: false`** for both manual pause and cron. Ground / Signal content is written by **`companion-orchestrate`**, not the reflection step.
- **Why it’s listed:** The code path still exists if you experiment; it is easy to confuse with **`reflections.grounding_*`** columns (stored Ground companion payload). UI/analytics may still use the string **`learning`** for companion keys (e.g. favorites) where that is not a DB column name.

**Intervention vs “run every enabled generator”**

- **What:** `companion-orchestrate` picks a **primary intervention** (mirror, trap, pattern, question, etc.) for the top of the pause UI.
- **Reality:** It **still runs** Signal, Grounding, History, and Zoom Out **in parallel** for every slot whose **`enable*`** flag is true (and not cached), even when the headline intervention is something like **mirror** or **question** that might not “need” all of them.
- **Why it matters:** Extra model calls and cost. A future optimization could skip generators that the chosen intervention does not use (would need careful product rules).

**Rate limit and analytics events**

- **What:** Per-user rate limiting (`checkRateLimit`) looks at **specific** `analytics_events.event` values (e.g. reflection-related names).
- **Reality:** **`intervention_selected`** and other orchestrator-only events are **not** in that allowlist, and **`companion-orchestrate`** does not log **`pause_ai_call`** the same way **`holzen-reflect`** does.
- **Why it matters:** Throttling is **tighter** around “user hit reflect” than around “orchestrator ran many companions.” That is intentional or legacy depending on your product goals; worth knowing when tuning abuse limits or cost.

**Admin surface**

- **What:** `Admin.tsx` has seven tabs (Monitor, Content, Sources, Tools, Library, Feed, Rejections). Listed here so doc readers know where ops tooling lives.

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
    ├── reflection-generate.ts      # shared manual + cron reflection AI
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

When you change **reflection** prompts or gates, bump **`REFLECTION_PROMPT_VERSION`** in `_shared/reflection-generate.ts` (and ensure `reflection_generated` analytics metadata stays in sync). Other companions keep their own **`PROMPT_VERSION`** in each generator file.
