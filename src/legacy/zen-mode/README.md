# Zen mode (legacy)

Minimal Home layout (reflection-focused, optional market context) — **not shipped** in pause-first MVP.

Moved from active `src/screens/home/` and `src/features/pause/presentation/home/zen-mode/` per product scope (MVP = Hold dashboard only).

## Still in active MVP

- Full **Hold** Home dashboard (`HomeScreen`, `HomeDashboardLayout`, customize sheet for widget order/visibility only)
- Settings **experience** panel without Zen toggle (Zen lived here and in Home customize)

## Re-enabling

1. Wire `useHomeZenMode` + `HomeZenModeRoute` back into `HomeScreen` (early return when `zenMode`).
2. Restore Zen toggle in `SettingsExperiencePanel` and Hold/Zen mode radio in `HomeCustomizeSheet`.
3. Re-export `buildZenModeHomeRouteProps` / `useZenModeHomeRouteProps` from `src/features/pause/public-home.ts` (or import from `@/legacy/zen-mode/public` only inside legacy until product re-ships).
4. Restore `home_zen_reflection` on `PauseDismissAnalyticsSurface` if Zen dismiss analytics return.

Legacy may import active `@/screens/home/*` and `@/features/*`; active code must not import `@/legacy/zen-mode/**`.
