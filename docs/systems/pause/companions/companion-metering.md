# Companion metering (user-facing + cost)

Canonical pairing: [ai-cost-model.md](../../costs/ai-cost-model.md) §2.1, `supabase/functions/_shared/companion-orchestrate-billing.ts`.

## What counts against “Companions & guidance”

The Settings **Credits & allowances** row **Companions & guidance** maps to product feature `premium_companion` (monthly included uses, then flex credits at **3 credits per successful unit** on paid tiers).

| User action | Billed? | Notes |
| --- | --- | --- |
| **First generation** of Signal, Grounding, Look Back, or Zoom Out on a pause (Frame expand or full-view fetch when no artifact yet) | **Yes** (if slot renders billable content) | `companion-orchestrate` — charge **after** success; cache/catalog hits inside orchestrate still count as a served companion when content satisfies the slot |
| **Regenerate** on Frame or full view | **Yes** (one unit per successful regenerate) | `regenerate-only` edge path |
| **Re-open** full view, expand a card that already has `pause_ai_artifacts` / session hydrate | **No** | Read-only |
| **Haiku** on Reflect | **No** (separate path) | `holzen-reflect`, not companion allowance |
| **Opening** full view / navigation | **No** | |
| **Background cache warmer** (`pregenerate-companions`) | **No** (not user-metered) | Platform cron; fills shared `companion_cache` |

Failed generation (empty body, error, panic after peek) should **not** debit — server only consumes when `contentSatisfiesCompanion` for that slot.

## What does *not* use companion allowance

- **`holzen-reflect`** integrated reflection prose
- **`pregenerate-companions`** (cron; see [pregenerate.md](pregenerate.md))
- Legacy **`grounding-enrich`** (undeployed; was never companion-metered)

## Pregenerate vs session orchestrate (cost shape)

| Path | Who pays (product) | Who pays (infra) | Reuse |
| --- | --- | --- | --- |
| **`pregenerate-companions`** | Nobody per user | Holzen cron budget / AI gates | Rows in **`companion_cache`** shared across users (`companion_type` + language + dedup keys) |
| **`companion-orchestrate`** | User allowance/credits when live path runs | Per invoke | Writes **`pause_ai_artifacts`** for that `pause_instance_id`; may **read** cache/catalog first |

One pregenerate row can serve many pauses when phase config selects the **cache** phase — that is the main unit-economics lever for companions.

## Per-type pregenerate (today)

There is **one** edge function (`pregenerate-companions`) with **per-`companion_type` top-up** in `app_config.pregenerate_cache_topup` (mins/maxes per run). Types warmed: `ground_nudge`, `signal`, `historical_insight`, `zoom_out_deep_time` (not haiku).

Splitting into separate edge functions per companion would duplicate cron/auth/logging and is **not** required for individualized targets — tune top-up JSON and generators in the single handler instead.

## Naming map (UI vs DB vs edge)

**User-facing names** (Settings, Frame, full views): Signal, Grounding, Look Back, Zoom Out, Haiku.

**Backend-only** (`companion_type`, artifacts, SQL, admin top-up keys) — do not surface in product copy:

| Product name | Client slot | DB / cache `companion_type` | Artifact `kind` |
| --- | --- | --- | --- |
| Signal | `signal` | `signal` | `signal` |
| Grounding | `grounding` | `ground_nudge` | `ground_nudge` |
| Look Back | `history` | `historical_insight` | `historical_insight` |
| Zoom Out | `zoomOut` | `zoom_out`, `zoom_out_deep_time` | `zoom_out`, `zoom_out_deep_time` |
| Haiku | (reflect) | — | `haiku` |

Older docs or code may still say “Historical Echo”, “nudge”, “intervention”, or “library” — use the product names in UI; keep DB identifiers in migrations, edge, and admin config only.
