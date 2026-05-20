# Home (`/`)

**Pause-first shipped scope (2026-05):** widgets are **goal-why**, **market**, and **your-pause** only (no journey-pulse, quick-capture, night reflection, or stats). Trial/lapsed gating via `getHomeSubscriptionGate` + `useSubscription` entitlement. Manifest: [active-surface.md](../ops/active-surface.md).

Authoritative orchestration: [`src/screens/home/HomeScreen.tsx`](../../src/screens/home/HomeScreen.tsx).

**Cross-screen patterns:** the refactor behind this page is generalized in [**React screen orchestration**](../fundamentals/react-screen-orchestration.md) — written for **React beginners** (vocabulary, Rules of Hooks examples, `memo` / `lazy` toolbox), a **step-by-step guided tour of `Home.tsx`**, plus the same patterns for edge handlers.

| Piece | File |
|-------|------|
| Dashboard shell (non-Zen) | [`HomeDashboardLayout.tsx`](../../src/screens/home/components/HomeDashboardLayout.tsx) (`React.memo`) |
| Section switch + deps type | [`render-home-dashboard-section.tsx`](../../src/screens/home/components/render-home-dashboard-section.tsx) |
| Pull-to-refresh row | [`HomePullRefreshIndicator.tsx`](../../src/screens/home/components/HomePullRefreshIndicator.tsx) |
| Customize link button | [`HomeCustomizeLinkButton.tsx`](../../src/screens/home/components/HomeCustomizeLinkButton.tsx) |
| Zen lazy route (Suspense + `React.lazy`) | [`HomeZenModeRoute.tsx`](../../src/screens/home/components/HomeZenModeRoute.tsx) |
| Zen layout | [`ZenModeHome.tsx`](../../src/screens/home/components/ZenModeHome.tsx) |
| Pause widget body | [`HomePauseCardBody.tsx`](../../src/screens/home/components/HomePauseCardBody.tsx) |
| Pause error panel | [`HomePauseBlockingErrorPanel.tsx`](../../src/screens/home/components/HomePauseBlockingErrorPanel.tsx) |
| Context meta lines | [`HomePauseContextMeta.tsx`](../../src/screens/home/components/HomePauseContextMeta.tsx) |
| Expand chevrons | [`HomeExpandChevronButton.tsx`](../../src/screens/home/components/HomeExpandChevronButton.tsx) |
| Customize copy keys | [`home-customize-section-copy.ts`](../../src/lib/home-customize-section-copy.ts) |
| Pause error surfacing | [`home-pause-widget-error.ts`](../../src/lib/home-pause-widget-error.ts) |
| Subscription / Zen gate flags (pure) | [`home-subscription-gate.ts`](../../src/lib/home-subscription-gate.ts) |

Hooks (`src/screens/home/hooks/use-home-*.ts` / `use-home-*.tsx`): checkout welcome toast, zen mode, completed pause count, outlet `pauseReady`, document title, hero quote analytics, pause arrival chime + prefetch, market display preferences (price hide, BTC mode, chart expand), **visible section ids** (`useHomeVisibleSections`), **customize sheet wiring** (`useHomeCustomizeBridge`), **market + goal/why header chevrons** (`useHomeMarketGoalHeaders`), **pause navigation + checkout** (`useHomePauseActions`), **pause card projection** (`useHomePauseCardProjection`), **Today wiring** (`useHomeDashboardTodayWiring` composes `useHomeDashboardSectionDeps` + `useHomeDashboardSectionRenderers`; section deps default an optional compact `HolzenNumber` market footer when `marketFooter` is omitted), **dashboard layout props** (`useHomeDashboardLayoutProps` — stable object for `HomeDashboardLayout`), **pause context preview parsing** (`useHomePauseContextPreviews`), **pull full reload** (`useHomePullFullReload`), **Zen route props** (`useHomeZenModeRouteProps`). App shell outlet typing: [`home-app-layout-outlet.ts`](../../src/lib/home-app-layout-outlet.ts). Layout prop surface: exported **`HomeDashboardLayoutProps`** on [`HomeDashboardLayout.tsx`](../../src/screens/home/components/HomeDashboardLayout.tsx). Use **`HOME_WIDGET_DEFAULT_ORDER`** from optional-visibility for a stable `useWidgetLayout` default-order reference. Subscription booleans for Home/Zen come from **`getHomeSubscriptionGate`** in `home-subscription-gate.ts` (Vitest-covered).

## Purpose

Home is the signed-in landing surface after onboarding: hero quote, optional install CTA, customizable widgets (market, pause, goal/why, quick capture, journey pulse, evening reflection), subscription gates, and checkout return handling. It coordinates several hooks and must stay coherent with [`CheckoutConfirmation`](../../src/features/subscription/presentation/CheckoutConfirmation.tsx) (mounted from `AppLayout`) for Stripe return URLs.

## Major dependencies

| Area | Source | Notes |
|------|--------|--------|
| Open pause + market context | [`HolzenProvider`](../../src/app/components/HolzenProvider.tsx) (`useHolzenHomeContextState` in pause presentation) | `lastPauseInstanceId` / `hasOpenPause`, `context` (market line from `context_snapshot`), `message` only when a `reflection_text` artifact exists (post-Reflect or silent stub), `loading`, `error`, `btcData`, `manualTrigger`, cooldown helpers, companions; **`trackedAssetId`** is re-exported as `normalizeTrackedAssetId(profile.trackedAssetId)` (`TrackedAssetId`) |
| Subscription / Pro | [`useSubscription`](../../src/features/subscription/public-hooks) | `subscribed`, `monthlyRemaining`, `startCheckout`, `refresh` |
| Layout + DnD order | [`useWidgetLayout`](../../src/screens/home/components/HomeWidget.tsx) | Section order persisted per user expectations |
| Optional widgets | [`useHomeOptionalVisibility`](../../src/screens/home/hooks/use-home-optional-visibility.ts) | Toggles + `JOURNEY_STAT_TILES_VISIBILITY_ID` + `HOME_WIDGET_DEFAULT_ORDER` for layout |
| Shell | [`AppLayout`](../../src/app/components/AppLayout.tsx) outlet context | `pauseReady` / `dismissPauseReady` — refresh path when server pushes a pause |
| Checkout UX | [`CheckoutConfirmation`](../../src/features/subscription/presentation/CheckoutConfirmation.tsx) | Owns stripping `?subscribed=true` / credits params and the confirmation dialog; Home may still run a lightweight refresh + welcome toast with a **stable Sonner id** so dev Strict Mode does not duplicate toasts |

## Rendering and hooks

`Home.tsx` calls **all** hooks (subscription gate, Today wiring, Zen props, dashboard layout props, and so on) **before** the `profileLoaded` / `hasOnboarded` / `zenMode` returns. That matches the **Rules of Hooks** and avoids subtle ordering bugs. Tradeoff: when Zen is on, the non-Zen dashboard hooks still run (cheap compared to reflection/market work); `HomeDashboardLayout` is **`React.memo`**, and `useHomeDashboardLayoutProps` memoizes props so the shell usually **skips re-render** when only Zen toggles.

## User-visible modes

1. **Loading** — `!profileLoaded` → `AuthLoading`.
2. **Onboarding** — `!hasOnboarded` → `Onboarding`.
3. **Zen mode** — `localStorage.holzen_zen_mode`; one-time migration cleared a stale default (`holzen_zen_mode_reset_v1`). When an open pause exists, Zen shows **market context meta** (+ optional context line) and the same **Continue pause** / dismiss CTAs as the dashboard widget (not the AI reflection paragraph — that appears in `/pause` at Reflect). Otherwise: loading, **blocking errors** (persist, AI, connectivity — not price-only when cached market data exists), subscription skeleton, or empty flow. Cross-tab: `storage` listener syncs zen flag.
4. **Full dashboard** — Hero quote, pull-to-refresh (full reload), “Today” sections driven by `visibleOrderedSectionIds`, customize sheet, testimonial prompt.

## Pause widget error surfacing

Logic lives in [`src/lib/home-pause-widget-error.ts`](../../src/lib/home-pause-widget-error.ts):

- **`shouldSurfacePauseWidgetError`** — Persist errors always block; without `btcData`, any error blocks; with cached prices, **price-only** CoinGecko / market copy is suppressed so the chart stays usable.
- **`pauseHomeErrorKind`** — Maps `useHolzen` user-facing strings to `network` / `ai` / `generic` / `persist` so i18n titles match real failures (including “Could not reach Holzen” without substring `fetch`).

Zen and the inline pause card share this contract so reflection failures are not hidden behind a healthy cached market strip.

## Navigation to Pause

From the pause card, “Pause with this” navigates to `/pause` with [`PauseSessionLocationState`](../../src/lib/router-location-state.ts): reflection text, context, instance id, companions, prefs, severity. See [phase-2 manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md) for the producer/consumer contract.

## Analytics

PostHog events such as `home.optional_widget_toggled`, `home.customize_opened`, `home.hero_quote_viewed`, and market expand toggles are fired from this page. When adding events, update [`docs/ops/event-taxonomy.md`](../ops/event-taxonomy.md).

## Best practices for edits

- Prefer **small pure helpers** in `src/lib/` (with Vitest) over growing inline conditionals in `Home.tsx`.
- **i18n**: use `t('…')` for user-visible strings; avoid new hardcoded English in widget bodies.
- **localStorage**: wrap reads/writes in `try/catch` where private mode or quota can throw.
- **Effects with query params**: pair subscription refresh with **idempotent** toast keys when Sonner should dedupe.
- **Supabase counts**: handle `error` on `select(..., { count: 'exact', head: true })` so silent failures are logged (e.g. testimonial prompt).

## Related reading

- [Pause system](../systems/pause-system.md) — data model and lifecycle.
- [AI-powered pause](../systems/pause/ai-powered-pause-system.md) — edges and triggers.
- [Phase 2: manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md) — Home as producer of `/pause` state.
