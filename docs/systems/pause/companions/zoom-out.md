# Zoom Out companion (end-to-end)

**Zoom Out** is the pause **card** that provides **temporal perspective**: historical BTC prices on this day in past years, an optional echo from the user's own past reflections, and a **deep-time** narrative that places the current moment against geological, civilizational, or technological timescales.

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.9** Zoom Out reference table).

---

## 1. Where Zoom Out sits in the pipeline

1. User completes reflection; when the user **taps the Zoom Out card**, **`use-companion-data`** invokes **`companion-orchestrate`** with `enableZoomOut: true` (lazy loading). If Zoom Out data is already cached in `reflection_companions`, it is hydrated from DB without a network call.
2. **`companion-orchestrate`** runs **`generateZoomOut`** in `_shared/generators/zoom-out.ts` when **`enableZoomOut`** is true (or when the intervention **requires** it — `secondary: "zoom_out"`), passing **context**, **session intent** (`zoomOutAngle`), and recency dedup fields.
3. **`generateZoomOut`** returns a **composite** payload (price history + echo + deep-time); the orchestrator **writes** **`reflection_companions`** (type `zoom_out_deep_time`) and **`companion_serves`**.

Zoom Out also serves as the **data source for intervention secondaries**: when `selectIntervention` attaches `secondary: "zoom_out"`, the orchestrator copies the zoom result into `intervention.secondary`.

---

## 2. Dual role: companion card vs intervention secondary

Zoom Out appears in **two places** depending on intervention selection:

| Surface | When shown | How it renders |
|---------|-----------|----------------|
| **Intervention secondary** | Trap/pattern with high severity, or default pattern with moderate severity | Collapsible block under the primary intervention (`ZoomOutDisplay`) |
| **Companion card** | User has `companion_zoom_out` pref enabled **and** intervention does not already show zoom-out as secondary | Standalone card in `CompanionSection` |

**Duplicate avoidance:** `CompanionSection` **hides** the Zoom Out card when `intervention.secondary.type === "zoom_out"` so the same content is not shown twice.

---

## 3. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`context`** | BTC + Fear & Greed + on-chain line | Grounds the zoom narrative in the current market move. |
| **`zoomOutAngle`** | `determineSessionIntent()` → **`zoomOutAngle`** (`session-intent.ts`) | Biases deep-time seed selection toward the session theme. |
| **`recentNudgeTopics`** | Recent zoom-out titles from `reflection_companions` | Dedup: avoid repeating same deep-time perspectives. |

---

## 4. Server pipeline (`zoom-out.ts`)

High-level order (source of truth: **`supabase/functions/_shared/generators/zoom-out.ts`**, **`PROMPT_VERSION`** **v4** — bumped 2026-04-18 from v3, wired into `companion_cache.prompt_version` so pre-v4 rows are no longer served):

**Note:** Zoom Out does **not** have a library phase — there is no `content_library` type for deep-time content. The phase order is **cache → live → curated** (not the library → cache → live → curated pattern used by Signal, Grounding, and History).

**Step 1: Price data** — Fetches BTC prices from **`btc_price_cache`** table (kept fresh by the `refresh-btc-prices` cron every ~15 minutes). Builds "on this day" comparisons for **1–10 calendar years** ago (UTC; see `_shared/btc-on-this-day-config.ts`). No CoinGecko API calls at generation time.

**Gotcha (fixed 2026-04-18):** `refresh-btc-prices` previously fetched all 10 anniversary dates in a single `/market_chart/range` request. On CoinGecko's demo / free tier that endpoint silently returns an empty `prices[]` for anything older than ~365 days, so the cron logged `historical: 0 matched` and left `btc_price_cache` with only the current-day row — zoom-out logs showed `historical=0/10`. The fix is to use `/coins/bitcoin/history?date=DD-MM-YYYY` (one call per missing anniversary, paced 1s apart) which works on free tier for any year. `backfill-btc-prices` gained a `"mode": "per_date"` branch using the same endpoint for sparse gap-filling.

**Step 2: Echo reflection** — Fetches a past reflection from the same user ≥3 days old, optionally filtered by market direction. **Prefers** `outcome`-tagged rows but **falls back to any reflection** when the user hasn't closed the loop on past pauses — the old strict-outcome filter left the "you reflected on this before" rail permanently empty for new users. Provides "you reflected on this before" context.

**Phase 2: Cache (strict + prompt-version-pinned)** — `serveFromCache` with `strict: true` **and** `promptVersion: "v4"` checks `companion_cache` for fresh, quality-≥-2 rows that were **also written under the current prompt**, with per-user dedup and market direction awareness. If found, returns composite (cached deep-time + fresh prices + echo). If the strict pool is empty it returns `null` and emits `cache_strict_miss` (Edge log) so the flow falls through to Phase 3 instead of recycling seen or pre-v4 rows. Rows inserted before the `prompt_version` column existed have `NULL` and are ignored (effectively a hard invalidation every time `PROMPT_VERSION` bumps).

**Phase 3: Live generation** (if cache misses):

1. **Seed selection** — Selects from 33 predefined deep-time perspectives (see §5), grouped by category (money, geology, biology, tech adoption, civilizational, long-horizon, cosmic, Bitcoin-as-protocol). Optional `zoomOutAngle` override from session intent.
2. **AI generation (Lovable AI gateway)** — Gemini model (`gemini-2.5-flash`, **10s** timeout; fallback to lite variant, **8s** timeout) generates a short deep-time narrative grounded in the seed.
3. **Prompt constraints** — Explicit "anchor in a span ≥100 years, ideally 1,000+", "never mention BTC prices / dollar amounts / percentages", and **"body ≤480 characters (hard ceiling 500)"**. The user message no longer carries price context — injecting `$`-amounts was causing `body_contains_market_data` rejects when Gemini echoed them back (the `zoom_out_deep_time` quality gate has `noMarketData: true`). Deep-time should be orthogonal to today's price anyway.
4. **`qualityGate("zoom_out_deep_time", …)`** — Length (80–500 chars), no market data in body, no slop, no generic crypto language (`quality.ts`).
5. **On success (`source: "live"`)** — Inserts deep-time text into `companion_cache` with `prompt_version: "v4"`; assembles composite result with prices + echo.

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks`.

---

## 5. Deep-time seeds

The generator maintains **33** predefined perspectives (expanded 2026-04-18 from 18) that provide civilizational or natural timescale context:

| Category | Examples |
|----------|----------|
| **Money & ledgers** | Shells/salt/gold history, Sumerian clay tablets, Rai stones, medieval tally sticks |
| **Geological / planetary** | Continental drift, Antarctic ice cores, Pacific widening |
| **Biological** | DNA as proof-of-work, Pando aspen grove, bristlecone pines, coral reefs, sequoias |
| **Technology adoption** | Printing press → internet → Bitcoin, telegraph, TCP/IP longevity |
| **Civilizational / monumental** | Cathedral builders, Stonehenge, Great Wall, Pyramids, Library of Alexandria |
| **Long-horizon thinking** | Long Now clock, Svalbard seed vault, cosmic calendar |
| **Cosmic** | Distant starlight, Voyager 1, sun's remaining fuel, Andromeda collision, Proxima Centauri |
| **Bitcoin as protocol** | TCP/IP analogy, Lindy effect, halvings as generations |

Each seed is a short prompt fragment. Selection considers: (a) `zoomOutAngle` from session intent (if provided, overrides random), (b) recency dedup via `recentTitles` (skip recently shown titles), (c) random selection from remaining pool.

Temperature is **0.7** (higher than other generators) for more creative variation. The system prompt pins a **timescale ≥ 100 years** constraint ("name the span explicitly, e.g. 5,000 years / 3.5 billion years / since the 12th century") so outputs reliably feel "deep time" rather than drifting into decade-scale tech commentary.

---

## 6. Composite response structure

Unlike other generators that return a single card, Zoom Out assembles a **composite** object:

```
{
  onThisDay: [{ year, price, change }],  // 1–10 years of "on this day" prices (see btc-on-this-day-config)
  currentPrice: number,                   // today's BTC price from cache
  echo: { message, mood, outcome, ... }, // past reflection (optional)
  deepTime: { title, body },             // AI-generated deep-time narrative
  partial: boolean                       // true if some sub-components failed
}
```

The `partial` flag allows the card to render with whatever data succeeded (e.g., prices + echo but no deep-time AI).

---

## 7. Storage

| Target | What | Why |
|--------|------|-----|
| **`reflection_companions`** | Full composite JSON as type `zoom_out_deep_time` | Canonical normalized store. |
| **`reflections.zoom_out_data`** | *(deprecated — legacy column exists but is no longer populated by the orchestrator)* | Legacy storage; new reads use `reflection_companions`. |
| **`companion_serves`** | Source, latency, fingerprint | Analytics and monitoring. |
| **`companion_cache`** | Cached deep-time payload (prices are always fresh, not cached) | Pool for future serves. |
| **`btc_price_cache`** | Historical BTC prices | Fed by `refresh-btc-prices` cron; read at generation time. |

---

## 8. Dependencies

| Dependency | Why | What breaks without it |
|------------|-----|------------------------|
| **`refresh-btc-prices` cron** | Keeps `btc_price_cache` fresh | "On this day" prices are stale or missing; `currentPrice` may be null |
| **Lovable AI gateway** | Deep-time narrative generation | Falls through to curated fallback (prices + echo still work) |

---

## 9. Key files

| Area | Path |
|------|------|
| Generator | `supabase/functions/_shared/generators/zoom-out.ts` |
| Orchestrator | `supabase/functions/companion-orchestrate/index.ts` |
| Session intent | `supabase/functions/_shared/session-intent.ts` |
| Quality gate | `supabase/functions/_shared/quality.ts` |
| Phase config | `supabase/functions/_shared/phase-config.ts` |
| “On this day” depth | `supabase/functions/_shared/btc-on-this-day-config.ts` — years back (default **10**) |
| BTC price cron | `supabase/functions/refresh-btc-prices/index.ts` |
| BTC cache backfill (ops) | `supabase/functions/backfill-btc-prices/index.ts` — manual range fill; chain **`resumeFrom`** or `scripts/backfill-btc-chain.mjs` for multi-year gaps |
| Client invoke | `src/hooks/use-companion-data.ts` |
| Full-screen view | `src/pages/CompanionZoomOutPage.tsx` — route `/companion/zoom-out/:reflectionId` |
| UI | `src/components/CompanionSection.tsx` (`ZoomOutDisplay`) |

---

## 10. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture (§7.9 Zoom Out reference, §7.5 secondary zoom-out)
- [intervention.md](intervention.md) — Intervention types (zoom-out as secondary)
- [cron-setup.md](../../../ops/cron-setup.md) — `refresh-btc-prices` schedule; manual **`backfill-btc-prices`** for gaps
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map
