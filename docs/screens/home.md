# Home (`/`)

**Pause-first shipped scope (2026-05):** widgets are **goal-why**, **market**, **your-pause**, and optional **practice stats** (Presence + Pauses row). Trial/lapsed gating via `getHomeSubscriptionGate` + `useSubscription` entitlement. Manifest: [active-surface.md](../ops/active-surface.md).

Authoritative orchestration: [`src/screens/home/HomeScreen.tsx`](../../src/screens/home/HomeScreen.tsx).

**Cross-screen patterns:** the refactor behind this page is generalized in [**React screen orchestration**](../fundamentals/react-screen-orchestration.md) — written for **React beginners** (vocabulary, Rules of Hooks examples, `memo` / `lazy` toolbox), a **step-by-step guided tour of `Home.tsx`**, plus the same patterns for edge handlers.

| Piece | File |
|-------|------|
| Dashboard shell | [`HomeDashboardLayout.tsx`](../../src/screens/home/components/HomeDashboardLayout.tsx) (`React.memo`) |
| Section switch + deps type | [`render-home-dashboard-section.tsx`](../../src/screens/home/components/render-home-dashboard-section.tsx) |
| Pull-to-refresh row | [`HomePullRefreshIndicator.tsx`](../../src/screens/home/components/HomePullRefreshIndicator.tsx) |
| Customize link button | [`HomeCustomizeLinkButton.tsx`](../../src/screens/home/components/HomeCustomizeLinkButton.tsx) |
| Zen mode (not MVP) | [`src/legacy/zen-mode/`](../../src/legacy/zen-mode/README.md) |
| Pause widget body | [`HomePauseWidgetBody.tsx`](../../src/screens/home/components/HomePauseWidgetBody.tsx) |
| Practice stat tiles (Presence + Pauses) | [`HomePracticeStatTiles.tsx`](../../src/screens/home/components/HomePracticeStatTiles.tsx) |
| Greeting row | [`HomeGreetingRow.tsx`](../../src/screens/home/components/HomeGreetingRow.tsx) |
| Pause error panel | [`HomePauseBlockingErrorPanel.tsx`](../../src/screens/home/components/HomePauseBlockingErrorPanel.tsx) |
| Context meta lines | [`HomePauseContextMeta.tsx`](../../src/screens/home/components/HomePauseContextMeta.tsx) |
| Expand chevrons | [`HomeExpandChevronButton.tsx`](../../src/screens/home/components/HomeExpandChevronButton.tsx) |
| Customize copy keys | [`home-customize-section-copy.ts`](../../src/lib/home-customize-section-copy.ts) |
| Pause error surfacing | [`pause-home-widget-error.ts`](../../src/features/pause/domain/home/pause-home-widget-error.ts) |
| Subscription / Zen gate flags (pure) | [`home-gate.ts`](../../src/features/subscription/application/home-gate.ts) (`getHomeSubscriptionGate` via [`public.ts`](../../src/features/subscription/public.ts)) |

Hooks (`src/screens/home/hooks/use-home-*.ts` / `use-home-*.tsx`): checkout welcome toast, completed pause count, outlet `pauseReady`, document title, hero quote analytics, pause arrival chime + prefetch, market display preferences (price hide, BTC mode, chart expand), **visible section ids** (`useHomeVisibleSections`), **customize sheet wiring** (`useHomeCustomizeBridge`), **market + goal/why header chevrons** (`useHomeMarketGoalHeaders`), **pause card projection** (`useHomePauseCardProjection`), **Today wiring** (`useHomeDashboardTodayWiring` composes `useHomeDashboardSectionDeps` + `useHomeDashboardSectionRenderers`; section deps default {@link HomeMarketWidgetFooter} when `marketFooter` is omitted), **dashboard layout props** (`useHomeDashboardLayoutProps` — stable object for `HomeDashboardLayout`), **pull full reload** (`useHomePullFullReload`). Pause navigation, widget projection, and pending-offer actions live in [`public-home.ts`](../../src/features/pause/public-home.ts) (`useHomePauseActions`, `useHomePauseWidgetProjection`, `useHomePendingPauseOfferActions`, …). App shell outlet typing: [`home-app-layout-outlet.ts`](../../src/screens/home/lib/home-app-layout-outlet.ts). Layout prop surface: exported **`HomeDashboardLayoutProps`** on [`HomeDashboardLayout.tsx`](../../src/screens/home/components/HomeDashboardLayout.tsx). Use **`HOME_WIDGET_DEFAULT_ORDER`** from optional-visibility for a stable `useWidgetLayout` default-order reference. Subscription booleans for Home come from **`getHomeSubscriptionGate`** in `features/subscription/application/home-gate.ts` (Vitest-covered).

## Purpose

Home is the signed-in landing surface after onboarding: hero quote, optional install CTA, customizable widgets (**market**, **your-pause**, **goal-why** in pause-first scope), subscription gates, and checkout return handling. It coordinates several hooks and must stay coherent with [`CheckoutConfirmation`](../../src/features/subscription/presentation/CheckoutConfirmation.tsx) (mounted from `AppLayout`) for Stripe return URLs.

## Major dependencies

| Area | Source | Notes |
|------|--------|--------|
| Open pause + market context | [`HolzenProvider`](../../src/app/components/HolzenProvider.tsx) (`useHolzenHomeContextState` from [`public-home.ts`](../../src/features/pause/public-home.ts)) | `lastPauseInstanceId` / `hasOpenPause`, `context` (market line from `context_snapshot`), `message` only when a `reflection_text` artifact exists (post-Reflect or silent stub), `loading`, `error`, `btcData`, `manualTrigger`, cooldown helpers, companions; **`trackedAssetId`** is re-exported as `normalizeTrackedAssetId(profile.trackedAssetId)` (`TrackedAssetId`) |
| Home pause widget hooks | [`public-home.ts`](../../src/features/pause/public-home.ts) | `screens/home/*` import pending-offer, completed count, dismiss-outlet, home pause actions, context previews, and card projection from `public-home` — not `public-hooks` (bulk-hold stripped May 2026) |
| Subscription / Pro | [`useSubscription`](../../src/features/subscription/public-hooks) | `subscribed`, `monthlyRemaining`, `startCheckout`, `refresh` |
| Layout + DnD order | [`useWidgetLayout`](../../src/screens/home/components/HomeWidget.tsx) | Section order persisted per user expectations |
| Section visibility (Customize) | [`useHomeOptionalVisibility`](../../src/screens/home/hooks/use-home-optional-visibility.ts) | Toggles for legacy section ids still in storage keys — see **Layout section ids** below |
| Shell | [`AppLayout`](../../src/app/components/AppLayout.tsx) outlet context | `pauseReady` / `dismissPauseReady` — refresh path when server pushes a pause |
| Checkout UX | [`CheckoutConfirmation`](../../src/features/subscription/presentation/CheckoutConfirmation.tsx) | Owns stripping `?subscribed=true` / credits params and the confirmation dialog; Home may still run a lightweight refresh + welcome toast with a **stable Sonner id** so dev Strict Mode does not duplicate toasts |

## Rendering and hooks

`HomeScreen.tsx` calls **all** hooks (subscription gate, Today wiring, dashboard layout props, and so on) **before** the `profileLoaded` / `hasOnboarded` returns. That matches the **Rules of Hooks**. `HomeDashboardLayout` is **`React.memo`**, and `useHomeDashboardLayoutProps` memoizes props for stable child updates.

## User-visible modes

1. **Loading** — `!profileLoaded` → `AuthLoading`.
2. **Onboarding** — `!hasOnboarded` → `Onboarding`.
3. **Hold dashboard** — Greeting row (`Hello, {name}` + Customize), pull-to-refresh, widget stack (**goal-why**, **market**, **your-pause**, optional **Presence / Pauses** stats), customize sheet, testimonial prompt.

**Zen mode** (minimal reflection Home, `holzen_zen_mode`) is **not MVP** — see [`src/legacy/zen-mode/`](../../src/legacy/zen-mode/README.md).

## Layout section ids (pause-first)

Shipped widgets render **`goal-why`**, **`market`**, **`your-pause`**, and (when enabled in Customize) **`journey-pulse`** → [`HomePracticeStatTiles`](../../src/screens/home/components/HomePracticeStatTiles.tsx) ([`render-home-dashboard-section.tsx`](../../src/screens/home/components/render-home-dashboard-section.tsx)). Legacy ids **`quick-capture`** and **`night`** may still appear in persisted layout order / Customize storage ([`home-section-visibility-constants.ts`](../../src/screens/home/lib/home-section-visibility-constants.ts)) but **`renderHomeDashboardSection` returns `null`** for them — no UI.

## Goal-why anchor card (Your whys)

Wireframe: [546:8945](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=546-8945). Rendered **above** the draggable widget stack via `goalWhyBlock` in [`HomeDashboardLayout`](../../src/screens/home/components/HomeDashboardLayout.tsx) (not a `HomeSectionCard` — no expand chevron).

| Surface | Content |
|---------|---------|
| **Home** | [`HomeGoalWhyCard`](../../src/screens/home/components/HomeGoalWhyCard.tsx) — quoted `profiles.mantra` (optional) + motivation line; **Add your anchor** when empty; pencil opens in-place edit sheet |
| **Settings → You** | Full editors for motivations grid + mantra textarea |
| **Hold goal / commitment** | **Not on active Home** — [`src/legacy/hold-goal/`](../../src/legacy/hold-goal/README.md) (investment-strategy scope) |

Future depth (rational thesis, versioned whys): [backlog/home-why-thesis-evolution.md](../backlog/home-why-thesis-evolution.md).

## Practice stats row (Presence + Pauses)

Wireframe structure: two equal tiles after **Your pause** — **Presence** (lifetime practice XP) and **Pauses** (completed pause count).

| Tile | Source | Hook / query |
|------|--------|----------------|
| **Pauses** | Exact count, `pause_instances.state = completed` | [`useHomePracticeStats`](../../src/features/pause/presentation/home/use-home-practice-stats.ts) |
| **Presence** | `get_practice_summary` / profile roll-ups ([stats-system.md](../systems/stats-system.md) § Pause-first MVP) | [`useHomePracticeStats`](../../src/features/pause/presentation/home/use-home-practice-stats.ts) |

Customize id remains **`journey-pulse`** (historical); default visibility **on**. Tiles are a **read-only glimpse** (not links) — full breakdowns on Journey ([journey-practice-stats-evolution.md](../backlog/journey-practice-stats-evolution.md)).

## Market widget footer (Figma 559:26565)

**Product logic (what belongs on Home vs Your pause):** [backlog/home-market-logical-surface.md](../backlog/home-market-logical-surface.md).

**Collapsed market card** ([251:17255](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=251-17255)): pair label, fiat price, toolbar (BTC mode + hide), then footer — **no** 24h % or Fear/Greed in the Market body. Header chevron expand reveals 24h/F&G + 7-day chart in [`MarketStatus`](../../src/screens/home/components/MarketStatus.tsx). **Unit-basis mode** ([533:36421](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=533-36421)): tagline *Price is noise. Value is constant.* then `1 BTC = 1 BTC`, coin + hide toolbar (hide **disabled**, not removed). Accordion disabled. **Fiat hide:** pair label and price become `••••` / `••••••`; BTC-mode icon stays visible but disabled until price is shown again. Compact move + sentiment for the open pause lives in **Your pause** via [`HomePauseWidgetMarketRow`](../../src/screens/home/components/HomePauseWidgetMarketRow.tsx).

[`HomeMarketWidgetFooter`](../../src/screens/home/components/HomeMarketWidgetFooter.tsx) sits under the BTC price: **within / beyond your range** (left) and **% of users paused today** (UTC day, right; hides at 0). Live **“pausing now”** UI archived in [`src/legacy/holzen-pausing-now/`](../../src/legacy/holzen-pausing-now/README.md). Data: `get_holzen_number()` → `holzen_community_stats` (`id = live`), warmed on Home mount via parallel `holzen-number` + `market-quote` prefetch (`useHomePrefetch`), invalidated on own pause lifecycle + **`holzen_community_stats` Realtime** (no polling).

**Layout:** Footer uses a **column stack** at tier S; at tier **M+** (`@[400px]/shell`) range and community stats sit in one row — see [client-src-layout.md](../fundamentals/client-src-layout.md) § Shell width.

## Pause widget error surfacing

Logic lives in [`src/features/pause/domain/home/pause-home-widget-error.ts`](../../src/features/pause/domain/home/pause-home-widget-error.ts):

- **`shouldSurfacePauseWidgetError`** — Persist errors always block; without `btcData`, any error blocks; with cached prices, **price-only** CoinGecko / market copy is suppressed so the chart stays usable.
- **`pauseHomeErrorKind`** — Maps `useHolzen` user-facing strings to `network` / `ai` / `generic` / `persist` so i18n titles match real failures (including “Could not reach Holzen” without substring `fetch`).

Zen and the inline pause card share this contract so reflection failures are not hidden behind a healthy cached market strip.

## Your pause widget (`HomePauseWidgetSurface`)

Home maps **`v_pause_full.state`** to widget surfaces via [`resolveHomePauseWidgetSurface`](../../src/features/pause/domain/home/home-pause-widget-surface.ts). **`active` → `open_pre_reflect`**; **`engaged` → `open_engaged` / `open_engaged_pending_offer`**. See **[home-pause-widget-projection.md](../systems/home-pause-widget-projection.md)**.

| Surface | When | Header / CTA |
|--------|------|----------------|
| `idle_collapsed` / `idle_expanded` | Idle, no open pause | YOUR PAUSE + moon; expanded → two-tone copy + Nox **Let's pause** |
| `open_pre_reflect` | `state = active` (manual, cron, mid-ritual pre-Reflect, or returning user) | Title **Your pause**; opening + **Let's pause** |
| `open_engaged` | `state = engaged` (deep + `reflection_step`) | **Continue your pause** + Continue / Discard; countdown after market context shift (`calm_settled_at` or `pending_offered_at` + 12h); calm-waters body when quote within thresholds |
| `open_engaged_pending_offer` | `open_engaged` + pending offer | Section **Continue your pause**; inner **New pause available** + **Pause with new context** (adopt → depth picker on `/pause`) |
| `manual_cooldown_*` | No open pause, manual cooldown active | Title **Your pause**; expanded cooldown copy + optional **Revisit your archive** (`manual_cooldown_first_pause_*` when no archive yet) |
| `idle_expanded` (post-manual) | Manual cooldown elapsed, `localStorage` idle flag | Auto-expanded idle copy — no market mention |

Opening preview: deterministic i18n templates pre-Reflect (`home.pauseOpening.*`); post-Reflect uses `reflection_text`. Market block: compact BTC/F&G + Updated HH:mm from [`formatHomePauseMarketBlock`](../../src/features/pause/domain/home/format-home-pause-market-block.ts).

**Manual QA:** [home-pause-widget-projection.md § Manual QA checklist](../systems/home-pause-widget-projection.md#manual-qa-checklist).

## Navigation to Pause

From the pause card, **Let's pause** (`open_pre_reflect` or `idle_expanded`) navigates to `/pause` with [`PauseSessionLocationState`](../../src/lib/router-location-state.ts): reflection text, context, instance id, companions, prefs, severity. See [phase-2 manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md) for the producer/consumer contract.

## Analytics

PostHog events such as `home.optional_widget_toggled`, `home.customize_opened`, `home.hero_quote_viewed`, and market expand toggles are fired from this page. When adding events, update [`docs/ops/event-taxonomy.md`](../ops/event-taxonomy.md).

## Best practices for edits

- Prefer **small pure helpers** in the owning **`features/<ctx>/`** module or **`screens/home/lib/`** (with Vitest) over growing inline conditionals in `Home.tsx`. **Transitional:** some helpers still live in `src/lib/home-*` — peel toward `features/market` / `features/subscription` / screen `lib/` on touch; do not add new `@/lib/<context>-*` shims ([architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc)).
- **i18n**: use `t('…')` for user-visible strings; avoid new hardcoded English in widget bodies.
- **localStorage**: wrap reads/writes in `try/catch` where private mode or quota can throw.
- **Effects with query params**: pair subscription refresh with **idempotent** toast keys when Sonner should dedupe.
- **Supabase counts**: handle `error` on `select(..., { count: 'exact', head: true })` so silent failures are logged (e.g. testimonial prompt).

## Related reading

- [Pause system](../systems/pause-system.md) — data model and lifecycle.
- [AI-powered pause](../systems/pause/ai-powered-pause-system.md) — edges and triggers.
- [Phase 2: manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md) — Home as producer of `/pause` state.
