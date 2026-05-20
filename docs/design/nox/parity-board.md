# Nox Parity Board

**Pause-first shipped scope (2026-05):** Live routes and tabs → [active-surface.md](../../ops/active-surface.md). This board tracks **Nox migration status per URL** — including **pre-strip full-IA routes** kept for legacy recovery (`git tag full-ia-pre-strip`). Routes marked **legacy** below are **404** in the active app; Nox work there applies only if full IA returns or when auditing legacy code.

Status keys:

- `ready`: migrated and verified (for the route’s product era — see Notes)
- `partial`: migrated core primitives/tokens, needs route polish
- `blocked`: awaiting missing component/asset decision
- `legacy`: full-IA route — not in pause-first bundle (404)

## Batch 1 — pause-first shipped + shared

| Route | Status | Notes |
|---|---|---|
| `/` | ready | Nox header + token bridge + primitive updates applied |
| `/archive` | ready | Pause-first Archive tab (Pauses + Echoes) |
| `/journey` | ready | Pause-first Journey overview only (no sub-tabs) |
| `/settings` | ready | token bridge + shared Nox primitives applied |
| `/settings/about` | partial | sub-settings surface; matches Settings chrome |
| `/pause` | ready | shared controls + token bridge aligned |
| `/companion/*` | ready | full-screen companion views (pause-first shipped) |

## Batch 1 — full-IA legacy (404 in pause-first)

| Route | Status | Notes |
|---|---|---|
| `/library` | legacy | Pre-strip Library tab — **404**; Nox verified on tag `full-ia-pre-strip` |
| `/tools` | legacy | `ToolsHub` in five-tab shell — **404** |
| `/tools/ground` | legacy | token bridge aligned on full-IA branch |
| `/tools/breathe` | legacy | Stillness (ex-Ambient); **404** in pause-first |
| `/tools/practice/checkin` | legacy | token bridge + form controls aligned on full-IA branch |
| `/tools/practice/journal` | legacy | token bridge + tag/input alignment on full-IA branch |

## Batch 2 — full-IA legacy tools + public (mixed)

| Route | Status | Notes |
|---|---|---|
| `/tools/practice/bodyscan` | legacy | **404** in pause-first |
| `/tools/practice/replay` | legacy | **404** in pause-first |
| `/admin` | ready | token bridge and shared primitives applied where used |
| `/welcome` | ready | token bridge and semantic color usage aligned |
| `/auth` | ready | token bridge + shared controls aligned |
| `/reset-password` | ready | token bridge + shared controls aligned |
| `/terms` | ready | Nox header + semantic typography alignment |
| `/privacy` | ready | Nox header + semantic typography alignment |
| `/about` | ready | Nox header alignment applied |
| `/blog` | ready | Nox header alignment + semantic typography |
| `/blog/:slug` | ready | Nox header alignment + semantic typography |
| `/roadmap` | ready | public stub (links to blog / about; not full roadmap UI) |
| `/reserve` | ready | Nox header + state-card alignment applied |
| `/not-found` | ready | Nox button and editorial heading alignment |
