# Home (`/`)

Authoritative orchestration: [`src/pages/Home.tsx`](../../src/pages/Home.tsx). Zen-only UI lives in [`ZenModeHome.tsx`](../../src/components/home/ZenModeHome.tsx); shared pause error chrome in [`HomePauseBlockingErrorPanel.tsx`](../../src/components/home/HomePauseBlockingErrorPanel.tsx). Small hooks under `src/hooks/use-home-*.ts` isolate checkout toast, zen `localStorage`, pinned preview fetch, and completed-pause count. Pure rules + i18n string mapping: [`home-pause-widget-error.ts`](../../src/lib/home-pause-widget-error.ts).

## Purpose

Home is the signed-in landing surface after onboarding: hero quote, optional install CTA, customizable widgets (market, pause, goal/why, quick capture, journey pulse, evening reflection), subscription gates, and checkout return handling. It coordinates several hooks and must stay coherent with [`CheckoutConfirmation`](../../src/components/CheckoutConfirmation.tsx) for Stripe return URLs.

## Major dependencies

| Area | Source | Notes |
|------|--------|--------|
| Profile + reflection + BTC context | [`useHolzen`](../../src/hooks/use-holzen.ts) | `message`, `loading`, `error`, `btcData`, `manualTrigger`, cooldown helpers, companions |
| Subscription / Pro | [`useSubscription`](../../src/hooks/use-subscription.ts) | `subscribed`, `monthlyRemaining`, `startCheckout`, `refresh` |
| Layout + DnD order | [`useWidgetLayout`](../../src/components/HomeWidget.tsx) | Section order persisted per user expectations |
| Optional widgets | [`useHomeOptionalVisibility`](../../src/hooks/use-home-optional-visibility.ts) | Toggles + `JOURNEY_STAT_TILES_VISIBILITY_ID` |
| Shell | [`AppLayout`](../../src/components/AppLayout.tsx) outlet context | `pauseReady` / `dismissPauseReady` — refresh path when server pushes a pause |
| Checkout UX | [`CheckoutConfirmation`](../../src/components/CheckoutConfirmation.tsx) | Owns stripping `?subscribed=true` / credits params and the confirmation dialog; Home may still run a lightweight refresh + welcome toast with a **stable Sonner id** so dev Strict Mode does not duplicate toasts |

## User-visible modes

1. **Loading** — `!profileLoaded` → `AuthLoading`.
2. **Onboarding** — `!hasOnboarded` → `Onboarding`.
3. **Zen mode** — `localStorage.holzen_zen_mode`; one-time migration cleared a stale default (`holzen_zen_mode_reset_v1`). Zen shows reflection, loading, **blocking errors** (persist, AI, connectivity — not price-only when cached market data exists), subscription skeleton, or empty flow. Cross-tab: `storage` listener syncs zen flag.
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
