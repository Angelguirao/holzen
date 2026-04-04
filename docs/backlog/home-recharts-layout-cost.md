# Home: Recharts layout / forced reflow cost

**Status:** shipped (2026-04) for the **BTC 7-day** chart on Home; re-measure with Performance / Lighthouse after deploy.

## What shipped

- **`BtcChartLazyGate`** (`src/components/BtcChartLazyGate.tsx`): **`React.lazy`** loads **`BtcChart`** (and the **Recharts** chunk) only after the chart slot is **near the viewport** (`IntersectionObserver`, **`rootMargin: 180px`**). Until then, the same **skeleton** pattern as **`BtcChart`** loading is shown. Stops observing after the first intersection.
- **`BtcStatus`** renders **`BtcChartLazyGate`** instead of **`BtcChart`** directly (only consumer of **`BtcChart`**).
- **`BtcChart`**: parent **`min-w-0`** for flex measure stability; **`ResponsiveContainer`** **`height={100}`** (fixed) + **`debounce={50}`** to batch resize; **`Area`** **`isAnimationActive={false}`** to skip mount animation work.

## Follow-ups (optional)

- Profile **`/`** again; if other Recharts surfaces dominate (e.g. Profile), apply the same pattern there.
- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) — smaller Home surface overall.

## Related

- [reports/2026-04-03-home-localhost-360-analysis.md](../reports/2026-04-03-home-localhost-360-analysis.md)
- [route-level-code-splitting.md](route-level-code-splitting.md)
