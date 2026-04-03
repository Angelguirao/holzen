# Home: Recharts layout / forced reflow cost

**Status:** backlog — performance hygiene on **`/`**.

## Goal

Reduce **forced synchronous layout** and main-thread work attributed to **Recharts** on initial Home paint (`getStringSize2`, `updateBBox`, chart mount), observed in a **performance trace** (~**35 ms** reflow time cited; Recharts frames dominant).

## Rationale

LCP on the audited run was **text**, with **~99%** “render delay” — not slow TTFB. **Recharts** measuring label/box geometry contributes to **forced reflow** and competes with first paint. This overlaps **conceptually** with [home-fetch-deduplication.md](home-fetch-deduplication.md) (less duplicate work overall) and [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) (smaller Home surface).

## Direction

- **Defer** charts below the fold: **`React.lazy`**, intersection observer, or “expand to load chart.”
- Give chart containers **explicit width/height** where possible to reduce measure cycles.
- Re-measure with **performance_start_trace** after changes.

## Related

- [reports/2026-04-03-home-localhost-360-analysis.md](../reports/2026-04-03-home-localhost-360-analysis.md) — lab numbers.
- [route-level-code-splitting.md](route-level-code-splitting.md) — route-level lazy loading.
