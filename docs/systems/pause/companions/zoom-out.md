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

High-level order (source of truth: **`supabase/functions/_shared/generators/zoom-out.ts`**, **`PROMPT_VERSION`** v2):

**Note:** Zoom Out does **not** have a library phase — there is no `content_library` type for deep-time content. The phase order is **cache → live → curated** (not the library → cache → live → curated pattern used by Signal, Grounding, and History).

**Step 1: Price data** — Fetches BTC prices from **`btc_price_cache`** table (kept fresh by the `refresh-btc-prices` cron every ~15 minutes). Builds "on this day" comparisons for **1–10 calendar years** ago (UTC; see `_shared/btc-on-this-day-config.ts`). No CoinGecko API calls at generation time.

**Step 2: Echo reflection** — Fetches a past reflection from the same user (≥3 days old, with `outcome` set, optionally filtered by market direction). Provides "you reflected on this before" context.

**Phase 2: Cache (strict)** — `serveFromCache` with `strict: true` checks `companion_cache` for fresh, quality-≥-2 rows with per-user dedup and market direction awareness. If found, returns composite (cached deep-time + fresh prices + echo). If the strict pool is empty it returns `null` and emits `cache_strict_miss` (Edge log) so the flow falls through to Phase 3 instead of recycling seen rows.

**Phase 3: Live generation** (if cache misses):

1. **Seed selection** — Selects from 18 predefined deep-time perspectives (see §5). Optional `zoomOutAngle` override from session intent.
2. **AI generation (Lovable AI gateway)** — Gemini model (`gemini-2.5-flash`, 8s timeout; fallback to lite variant, 6s timeout) generates a short deep-time narrative grounded in the seed.
3. **`qualityGate("zoom_out_deep_time", …)`** — Length (80–500 chars), no market data in body, no slop, no generic crypto language (`quality.ts`).
4. **On success (`source: "live"`)** — Inserts deep-time text into `companion_cache`; assembles composite result with prices + echo.

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks`.

---

## 5. Deep-time seeds

The generator maintains 18 predefined perspectives that provide civilizational or natural timescale context:

| Category | Examples |
|----------|----------|
| **Geological** | Continental drift, ice ages, deep earth timescales |
| **Technological** | Tech adoption curves, internet growth parallels |
| **Civilizational** | Cathedral builders (multi-generational projects), Long Now Foundation |
| **Biological** | DNA as proof-of-work, evolutionary patience |
| **Astronomical** | Distant starlight, cosmic timescales |
| **Monetary** | History of money, gold's 5,000-year timeline |
| **Protocol** | Bitcoin as protocol (TCP/IP analogy, Lindy effect) |
| **Human** | Generational wealth, compounding patience |

Each seed includes a key and a short prompt fragment. Selection considers: (a) `zoomOutAngle` from session intent (if provided, overrides random), (b) recency dedup (skip recently shown seeds), (c) random selection from remaining pool.

Temperature is **0.7** (higher than other generators) for more creative variation.

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
