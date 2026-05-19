# Route-level code splitting (lazy routes)

**Status:** shipped (2026-04).

## What shipped

- **`src/App.tsx`:** Every shipped screen under **`src/screens/`** is loaded with **`React.lazy(() => import(...))`**.
- **`Suspense`** wraps **`Routes`** with **`RouteChunkFallback`** — a minimal full-screen spinner (neutral **`aria-label="Loading"`**, not session-restore copy).
- **`AppLayout`**, **`AuthLoading`**, guards, and shell providers stay **eager** so layout and auth gating behave as before.

Production **`vite build`** emits per-route chunks (e.g. **`Home-*.js`**, **`Landing-*.js`**, **`Profile-*.js`**) so cold loads for **`/welcome`** or **`/auth`** no longer need the full page graph up front.

## Follow-ups (optional)

- **`manualChunks`** or further splits for the large main bundle / Recharts (see build size warning) — overlaps [home-recharts-layout-cost.md](home-recharts-layout-cost.md) and [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md).
- i18n string for chunk fallback **`aria-label`** if product wants localized loading text.

## Related

- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) — splitting **internals** of large pages and hooks.
- [route-gating.md](route-gating.md) — auth loading vs route UX.
- [typed-navigation-state.md](typed-navigation-state.md) — navigation payloads.
