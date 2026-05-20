# React screen orchestration (Holzen)

This guide explains **how we structure big pages** in Holzen (starting from **`/` Home** and **`/pause` Pause**) so they stay readable, correct, and reusable. It is written so **React beginners** can follow it; you can skip the [Quick React vocabulary](#quick-react-vocabulary) section if you already know those terms.

**See also (full-stack boundaries):** [client-server-architecture-holzen.md](client-server-architecture-holzen.md) — where **business truth** lives (Postgres/RLS/edge) vs **page orchestration** here; TanStack Query vs UI-only state. **Industry React norms vs Holzen:** [modern-react-practices-holzen.md](modern-react-practices-holzen.md) (feature structure, colocation, scorecard).

- **Concrete Home map:** [screens/home.md](../screens/home.md) (files, modes, widgets).  
- **Concrete Pause map:** [screens/pause.md](../screens/pause.md) (gate, scaffold, brief vs deep ritual, RPC wiring).  
- **This doc:** the **ideas** you can copy on other `src/screens/*` routes.

---

## Quick React vocabulary

| Term | Plain meaning |
|------|----------------|
| **Component** | A function (or class) that returns **UI** (usually **JSX**: HTML-like syntax in JavaScript). |
| **Props** | **Inputs** passed into a component, like function arguments: `<Button label="Save" />`. |
| **State** | Data that **belongs to the component** and can change over time; when it changes, React **re-renders** that component (and usually its children). `useState` is the usual way to hold state. |
| **Render** | One pass where React **runs your component function** and figures out what should appear on screen. |
| **Hook** | A function whose name starts with **`use`** (`useState`, `useEffect`, `useHolzen`, …). Hooks let a component **subscribe to React features** (state, effects, context). **Custom hooks** are just functions you write that call other hooks — they bundle related logic. |
| **Effect** | Code that runs **after render** to talk to the outside world (fetch data, subscriptions). `useEffect` is the usual hook. |

**Orchestration** here means: the page component **does not do every job itself**. It **calls hooks**, **reads data**, and **hands results to smaller components** — like a conductor who does not play every instrument.

---

## What problem are we solving?

Very large page files tend to:

- mix **loading**, **errors**, **forms**, and **layout** in one place;
- repeat the same **dependency lists** for `useMemo` / `useCallback`;
- accidentally **break the Rules of Hooks** (see below);
- become hard to **test** and **review**.

**Screen orchestration** is the habit of keeping the **route component thin**: it **wires** things together; **named hooks and small modules** hold the real logic.

---

## The four big ideas (beginner-friendly)

### 1. The page is a conductor, not a junk drawer

- **Good:** `Home.tsx` mostly says *which* hooks run and *which* child components receive *which* props.  
- **Bad:** hundreds of lines of `if` / `switch` / inline calculations inside one return.

If the file feels like a “kitchen sink,” **extract**: move chunks into **`useHomeSomething`** hooks or **`src/lib/something.ts`** helpers.

### 2. Give behavior a name

When logic has a **name** (`useHomePauseActions`, `getHomeSubscriptionGate`), you can:

- **find** it later;
- **test** it (especially pure functions in `src/lib/` with Vitest);
- **reuse** it from another screen if it fits.

Anonymous logic buried in JSX is hard to test and easy to duplicate.

### 3. Put types and “truth” next to the data

Example: “can this user see Pro upsell?” is computed in **`getHomeSubscriptionGate`** (pure + tested), not copy-pasted in three JSX branches. **`trackedAssetId`** is normalized once in **`useHolzen`** so pages do not cast `as SomeType` everywhere.

**Rule of thumb:** if the same rule appears twice, **one function or hook** should own it.

### 4. Split heavy UI so the app stays fast and clear

- **`React.lazy` + `Suspense`:** load a **big chunk of UI only when needed** (e.g. Zen mode). The rest of the app does not pay the download cost up front.  
- **`React.memo`:** “**do not re-render this component** if its **props** are the same as last time.” Good for big presentational shells (e.g. dashboard layout).  
- **Stable props:** if the parent re-renders often, **memoize the props object** (`useHomeDashboardLayoutProps`) so memoized children are not fooled by “new object, same contents.”

---

## Rules of Hooks (why order matters)

React hooks **depend on call order**. Every render, React expects: “first `useState`, then `useEffect`, then …” in the **same order**. If you **return early** *before* some hooks run, the order **changes between renders** → bugs or React errors.

### Wrong: hooks after an early return

```tsx
function BadScreen() {
  const [data, setData] = useState(null);
  if (!data) return <Loading />; // early exit

  // Never runs on the first render — breaks hook order vs later renders
  const subscription = useSubscription();
  return <Main data={data} />;
}
```

### Right: hooks first, returns last

```tsx
function GoodScreen() {
  const subscription = useSubscription(); // always runs
  const [data, setData] = useState(null);

  if (!data) return <Loading />;
  return <Main data={data} />;
}
```

### Another pattern: child component

If you truly want “**no** subscription logic until data exists,” move the part that needs those hooks into a **child** that only mounts when ready:

```tsx
function Parent() {
  const [data, setData] = useState(null);
  if (!data) return <Loading />;
  return <SignedInMain data={data} />; // hooks inside SignedInMain always run when this mounts
}
```

Holzen **`Home`** keeps many hooks **above** `if (!profileLoaded)` so order never flips; that means **Zen mode still runs some “dashboard” hooks** even when Zen UI is showing — we accept that tradeoff and **memoize** the dashboard so work stays cheap. The [Home screen doc](../screens/home.md) describes that.

---

## Toolbox: what these APIs do (short)

| API | Beginner summary |
|-----|-------------------|
| **`useState`** | Holds one piece of state; changing it triggers a re-render. |
| **`useMemo`** | “Remember this **computed value** until one of these **dependencies** changes.” Cuts duplicate work and can stabilize **object/array** references for children. |
| **`useCallback`** | “Remember this **function** reference until dependencies change.” Useful when passing callbacks to **memoized** children. |
| **`useEffect`** | Runs code **after paint**; good for sync with APIs, timers, subscriptions. Not the first tool for *deriving* UI from props — prefer normal variables or `useMemo`. |
| **`React.memo(Component)`** | Wraps a component so it **skips re-render** if props are **shallow-equal** to last time. |
| **`React.lazy` + `Suspense`** | Load a component’s **JavaScript bundle later**; `Suspense` shows a fallback until it arrives. |

---

## Extraction heuristics (what goes where)

| If you notice… | Prefer… | In beginner terms |
|----------------|---------|-------------------|
| The same `useMemo` deps repeated for related UI | One hook returning **one bundle** (e.g. `useHomeDashboardTodayWiring`) | “One place updates when those inputs change.” |
| A big subtree re-renders when **unrelated** parent state changes | **`React.memo`** on the subtree + **stable props** | “Child ignores parent noise when its inputs did not change.” |
| A **rare** mode (Zen, admin modal) | **`lazy` + `Suspense`** | “Don’t load that code until we might need it.” |
| Rules from API / subscription booleans | **Pure `src/lib/` helpers + tests** | “Spreadsheet-style logic: same inputs → same outputs; easy to test.” |
| `useOutletContext` shapes | **Shared TypeScript type** in `src/lib/` or `src/types/` | “One type definition, many readers.” |
| New PostHog events | **Update** [event taxonomy](../ops/event-taxonomy.md) | “Analytics is part of the contract.” |

---

## Checklist for a new or growing screen

1. **Name the modes** (loading, logged-out, empty, main, error).  
2. **All hooks above any `return`** that depends on mode — or use a **child** for the signed-in tree.  
3. **Move stable rules** to `src/lib/` + tests when they stop changing every week.  
4. **Group related hooks** with clear names (`useSettingsForm`, `usePauseSession…`).  
5. **One layout component per major visual** (dashboard vs compact), with **typed props** exported.  
6. **Write `docs/screens/<name>.md`** with modes, main hooks, and odd tradeoffs.

---

## Anti-patterns (simple list)

- **40 props** copy-pasted into two branches → build **one props object** (maybe with `useMemo`) and spread it.  
- **`as MyType` everywhere** → fix the **hook or API layer** so the type is right once.  
- **Hardcoded English** where the rest of the screen uses **`t('key')`** → use i18n.  
- **`catch {}` that hides errors** → log and/or show something useful.

---

## Guided tour: reading `HomeScreen.tsx` (like a walkthrough)

Open [`src/screens/home/HomeScreen.tsx`](../../src/screens/home/HomeScreen.tsx) in the editor and follow **top to bottom**. The line numbers below match the file **at the time this tour was written**; if the file shifts, search for the hook or comment name.

**How to use this tour:** read one **step**, glance at the cited lines in `HomeScreen.tsx`, then read the **“What to notice”** bullet. You do not need to open every linked hook file on the first pass.

### Step 0 — Imports are the table of contents

```1:37:src/screens/home/HomeScreen.tsx
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
// ... many use-home-* hooks and layout components ...
import type { HomeAppLayoutOutletContext } from '@/screens/home/lib/home-app-layout-outlet';
```

**What to notice:** almost everything is **imported** from hooks, components, or `src/lib/`. The page file is not where the heavy logic lives — it **orchestrates** named modules.

---

### Step 1 — Router, auth, subscription, tiny global effects

```39:48:src/screens/home/HomeScreen.tsx
const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } =
    useSubscription();
  const [searchParams] = useSearchParams();
  useHomeCheckoutWelcomeToast(searchParams.get('subscribed'), refresh, t);
  useHomeDocumentTitle(true);
```

**What to notice:** standard **React Router** hooks (`useNavigate`, `useLocation`, `useSearchParams`) plus **subscription** state. `useHomeCheckoutWelcomeToast` and `useHomeDocumentTitle` are **side-effect hooks** (they do work when deps change); the page does not render their UI directly.

---

### Step 2 — `useHolzen`: the big “app context” for Home

```50:75:src/screens/home/HomeScreen.tsx
  const {
    btcData,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    lastPauseInstanceId,
    loading,
    error,
    newPauseArrival,
    clearNewPauseArrival,
    dismissMessage,
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    cooldownHours,
    firstName,
    currency,
    trackedAssetId,
    profileLoaded,
    refreshProfile,
  } = useHolzen();
```

**What to notice:** one custom hook returns **many fields** the rest of the page needs (pause message, profile, market, cooldowns). That keeps **`useHolzen`** as the owner of that domain; `Home` only **destructures** what it needs.

---

### Step 3 — Pure subscription flags (no hook)

```76:83:src/screens/home/HomeScreen.tsx
  const { subscriptionReady, hasAccess, showLimitUpsell, showPauseScheduling } = getHomeSubscriptionGate({
    subLoading,
    subscribed,
    monthlyRemaining,
    message,
    loading,
  });
```

**What to notice:** this is a **normal function call**, not a hook. Logic lives in [`src/lib/home-subscription-gate.ts`](../../src/lib/home-subscription-gate.ts) with tests. The page **derives** booleans from subscription + pause loading — easy to read, easy to test.

---

### Step 4 — Layout outlet + “always on” home behaviors

```94:99:src/screens/home/HomeScreen.tsx
  const outletCtx = useOutletContext<HomeAppLayoutOutletContext>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useDismissOutletPauseReady(pauseReady, hasOpenPause, dismissPauseReady);
  useHomeHeroQuoteViewed(profileLoaded, user?.id);
  usePauseArrivalAudio(newPauseArrival, lastPauseInstanceId, clearNewPauseArrival);
```

**What to notice:** **`useOutletContext`** reads data from a **parent route layout** ([`AppLayout`](../../src/app/components/AppLayout.tsx)). The typed shape lives in [`src/screens/home/lib/home-app-layout-outlet.ts`](../../src/screens/home/lib/home-app-layout-outlet.ts). `useDismissOutletPauseReady` is exported from `@/features/pause/public-hooks`. The following lines are small **effect-style** hooks (analytics, audio).

---

### Step 5 — Night card, market prefs, Zen flag, completed pause count

```102:116:src/screens/home/HomeScreen.tsx
  const { reflection: nightReflection, dismiss: dismissNight } = useNightReflection();

  const {
    priceHidden,
    btcMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleBtcMode,
    toggleMarketChartExpanded,
  } = useHomeMarketDisplayPreferences();
  const unitBasisModeSupported = trackedAssetId === 'bitcoin';
  const { zenMode, setZenModePersist } = useHomeZenMode(pathname);
  const completedPauseCount = useHomeCompletedPauseCount(user);
```

**What to notice:** each line group is **one concern**. `unitBasisModeSupported` is a **simple derived boolean** from `trackedAssetId` (no hook needed). `pathname` only exists to drive Zen mode persistence tied to the route. Reflection copy for the pause widget comes from **`useHolzen`** (`message`) and **`pause_ai_artifacts`** after **Reflect** — there is no Home “pinned preview” inset anymore.

---

### Step 6 — Parsed preview text for pause cards

```116:116:src/screens/home/HomeScreen.tsx
  const pauseContextHomePreview = useHomePauseContextPreviews(context);
```

**What to notice:** [`useHomePauseContextPreviews`](../../src/screens/home/hooks/use-home-pause-context-previews.ts) wraps a **`useMemo`** parser so `Home` does not repeat `parsePauseContextForHomePreview` boilerplate for the open-pause **context** line only.

---

### Step 7 — Only local UI state left on the page

```113:113:src/screens/home/HomeScreen.tsx
  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);
```

**What to notice:** this is the rare **`useState` in `Home`** — a small piece of UI state that did not deserve its own hook yet. Everything else is custom hooks or props from `useHolzen`.

---

### Step 8 — Widget order, visibility, derived section lists

```115:123:src/screens/home/HomeScreen.tsx
  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(HOME_WIDGET_DEFAULT_ORDER);
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } = useHomeOptionalVisibility();

  const { visibleOrderedSectionIds, todaySectionIds, showJourneyStatTiles } = useHomeVisibleSections({
    order,
    sectionVisible,
    subscribed,
    hasNightReflection: !!nightReflection,
  });
```

**What to notice:** **`HOME_WIDGET_DEFAULT_ORDER`** is a **stable default** from optional-visibility settings so `useWidgetLayout` does not see a new array every render. [`useHomeVisibleSections`](../../src/screens/home/hooks/use-home-visible-sections.ts) turns order + toggles into **what to render**.

---

### Step 9 — Customize sheet wiring (state + analytics inside the hook)

```125:136:src/screens/home/HomeScreen.tsx
  const { customizeSheet, onOpenCustomize } = useHomeCustomizeBridge({
    t,
    order,
    reorder,
    sectionVisible,
    setVisible,
    resetLayout,
    resetSectionVisibility,
    setZenModePersist,
    zenMode,
    subscribed,
  });
```

**What to notice:** the hook returns a **ready-made `customizeSheet` object** for the layout component and an **`onOpenCustomize`** handler. PostHog events for customize live **inside** [`useHomeCustomizeBridge`](../../src/screens/home/hooks/use-home-customize-bridge.tsx), not scattered in JSX.

---

### Step 10 — Market / goal-why header chrome

```138:143:src/screens/home/HomeScreen.tsx
  const { goalWhyExpanded, goalWhyHeaderRight, marketHeaderRight } = useHomeMarketGoalHeaders({
    t,
    marketChartExpanded,
    marketChartExpandBlocked,
    toggleMarketChartExpanded,
  });
```

**What to notice:** expand/collapse **state** and the **chevron buttons** are bundled together so the big “Today” wiring below receives **ready-made React nodes** for headers.

---

### Step 11 — Pause actions (navigation + checkout + cooldown)

```146:160:src/screens/home/HomeScreen.tsx
  const pauseActions = useHomePauseActions({
    message,
    context,
    lastPauseInstanceId,
    openPauseState,
    companions,
    companionPrefs,
    severity,
    navigate,
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout,
    dismissAnalyticsSurface: zenMode ? 'home_zen_reflection' : 'home_your_pause_widget',
  });
```

**What to notice:** [`useHomePauseActions`](../../src/screens/home/hooks/use-home-pause-actions.ts) returns **stable callbacks** used by Zen, the pause card, etc. `pauseProjection` (next step) **consumes** those callbacks — order in the file follows **data flow** (define actions, then pass them into UI projection).

---

### Step 12 — Pause card body + snooze

```166:191:src/screens/home/HomeScreen.tsx
  const pauseProjection = useHomePauseCardProjection({
    subscriptionReady,
    hasAccess,
    subLoading,
    subscribed,
    monthlyRemaining,
    checkoutLoading,
    hasOpenPause,
    openPauseState,
    pauseContextHomePreview,
    loading,
    error,
    btcData,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
    onNavigatePauseFromPendingBanner: pauseActions.handleNavigatePauseWithThisFromPendingBanner,
    onDismissOpenPause: pauseActions.handleDismiss,
    onNeedPause: pauseActions.handleNeedAPause,
    onStartCheckoutPro: pauseActions.startProCheckout,
  });
```

**What to notice:** this hook **assembles JSX subtrees** (`pauseCardBody`, `pauseSectionHeaderRight`, …) with **`useMemo`** inside the hook file. `Home` stays declarative: “here is the data and the callbacks.”

---

### Step 13 — Pull-to-refresh

```185:185:src/screens/home/HomeScreen.tsx
  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = useHomePullFullReload();
```

**What to notice:** [`useHomePullFullReload`](../../src/screens/home/hooks/use-home-pull-full-reload.ts) bundles **`usePullToRefresh`** + “reload the page” in one line here.

---

### Step 14 — “Today” section wiring (deps + renderers)

```187:215:src/screens/home/HomeScreen.tsx
  const { renderSection, goalWhyBlock } = useHomeDashboardTodayWiring(
    {
      t,
      goalWhyHoldSummary,
      setGoalWhyHoldSummary,
      goalWhyHeaderRight,
      goalWhyExpanded,
      error,
      marketHeaderRight,
      btcData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      btcMode,
      toggleBtcMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody: pauseProjection.pauseCardBody,
      pauseSectionHeaderRight: pauseProjection.pauseSectionHeaderRight,
      nightReflection,
      dismissNight,
      subscribed,
      collapsed,
      toggleCollapsed,
    },
    visibleOrderedSectionIds,
  );
```

**What to notice:** one hook ([`useHomeDashboardTodayWiring`](../../src/screens/home/hooks/use-home-dashboard-today-wiring.ts)) hides the **`useHomeDashboardSectionDeps` + `useHomeDashboardSectionRenderers`** pair. The big object is the **dependency bundle** for [`render-home-dashboard-section`](../../src/screens/home/components/render-home-dashboard-section.tsx).

---

### Step 15 — Zen props (memo object, spread later)

```217:241:src/screens/home/HomeScreen.tsx
  const zenRouteProps = useHomeZenModeRouteProps({
    message,
    context,
    companions,
    companionPrefs,
    severity,
    lastPauseInstanceId,
    loading,
    error,
    btcData,
    onDismiss: pauseActions.handleDismiss,
    onNeedPause: pauseActions.handleNeedAPause,
    onManualTrigger: manualTrigger,
    subscriptionReady,
    hasAccess,
    showLimitUpsell,
    showPauseScheduling,
    onPauseWithThis: pauseActions.handleNavigatePauseWithThis,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    checkoutLoading,
    onStartCheckoutPro: pauseActions.startProCheckout,
  });
```

**What to notice:** [`useHomeZenModeRouteProps`](../../src/screens/home/hooks/use-home-zen-route-props.ts) memoizes a **typed props object** for [`HomeZenModeRoute`](../../src/screens/home/components/HomeZenModeRoute.tsx). That keeps the Zen JSX line short: `{...zenRouteProps}`.

---

### Step 16 — Dashboard layout props (stable object for `React.memo`)

```243:256:src/screens/home/HomeScreen.tsx
  const dashboardLayout = useHomeDashboardLayoutProps({
    pullHandlers,
    pullDistance,
    pullRefreshing,
    userId: user?.id,
    firstName,
    todaySectionIds,
    showJourneyStatTiles,
    goalWhyBlock,
    renderSection,
    onOpenCustomize,
    customize: customizeSheet,
    completedPauseCount,
  });
```

**What to notice:** [`useHomeDashboardLayoutProps`](../../src/screens/home/hooks/use-home-dashboard-layout-props.ts) exists so [`HomeDashboardLayout`](../../src/screens/home/components/HomeDashboardLayout.tsx) (wrapped in **`React.memo`**) gets **referentially stable props** when nothing relevant changed.

---

### Step 17 — Finally: early returns (modes)

```258:270:src/screens/home/HomeScreen.tsx
  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (zenMode) {
    return <HomeZenModeRoute {...zenRouteProps} />;
  }

  return <HomeDashboardLayout {...dashboardLayout} />;
```

**What to notice:** **every hook above ran already**, no matter which branch you hit. That is the **Rules of Hooks** pattern this doc explained earlier. The three returns are just **different screens** for different states.

---

### Step 18 — Where to go next

- Walk **`useHomeDashboardTodayWiring`** → **`useHomeDashboardSectionDeps`** → **`renderHomeDashboardSection`** to see how one **section id** becomes a card.  
- Open [`HomeZenModeRoute`](../../src/screens/home/components/HomeZenModeRoute.tsx) to see **`lazy` + `Suspense`** around Zen.  
- Keep [`screens/home.md`](../screens/home.md) open for product modes and file map.  
- For **`/pause`**, keep [`screens/pause.md`](../screens/pause.md) open next to [`PauseSession.tsx`](../../src/screens/pause/PauseSessionScreen.tsx).

---

## Where Home fits

**[screens/home.md](../screens/home.md)** is the **first worked example**: file list, modes, Zen vs dashboard, pause errors, analytics. **[screens/pause.md](../screens/pause.md)** is the **second** (full-screen ritual: gate, depth picker, brief vs deep). Compare any new large screen to that **shape** (thin screen module, fat hooks/libs). **This guided tour** is the line-by-line companion to [`src/screens/home/HomeScreen.tsx`](../../src/screens/home/HomeScreen.tsx).

### Does `Home.tsx` follow this guide *completely*?

**No guide should be read as a 100% literal checklist** — it is a playbook with **options**. Home matches the **spirit** and most **rules**; the gaps are either **documented tradeoffs** or **diminishing returns**.

| Guide theme | On Home? | Notes |
|-------------|----------|--------|
| **Rules of Hooks** (no hooks after conditional returns) | **Yes** | All hooks run before `if (!profileLoaded)` / onboarding / Zen / dashboard returns. |
| **Conductor page** (no giant `switch` / logic in JSX) | **Yes** | The bottom of the file is almost only **returns**; wiring lives in hooks and `getHomeSubscriptionGate`. |
| **Named behavior + tests** | **Yes** for gates | `getHomeSubscriptionGate` + Vitest; other hooks are named and colocated under `use-home-*`. |
| **Types at source** | **Yes** for `trackedAssetId` | Normalized in `useHolzen`; Home does not cast. |
| **`React.lazy` + `Suspense` for rare UI** | **Yes** (by delegation) | Lazy Zen lives in [`HomeZenModeRoute`](../../src/screens/home/components/HomeZenModeRoute.tsx); `Home` imports that boundary, not `ZenModeHome` directly. Same idea, split file. |
| **`React.memo` + stable props for heavy shell** | **Yes** | `HomeDashboardLayout` is memoized; `useHomeDashboardLayoutProps` stabilizes the prop object. |
| **Child-only-signed-in pattern** | **Not used** | The guide’s **alternative** is a child that mounts only when `profileLoaded` — Home instead keeps **all signed-in hooks in the parent** so order never flips. That is the **first “correct” pattern** in [Rules of Hooks](#rules-of-hooks-why-order-matters), not the child pattern. **Tradeoff:** Zen and loading paths still **execute** dashboard-related hooks; memoization keeps the cost bounded. Same tradeoff is described in [screens/home.md](../screens/home.md) under “Rendering and hooks”. |
| **“Thin” = low line count** | **Partial** | `Home.tsx` is still **many lines** because listing ~15+ hooks is verbose. **Thin** here means **no business kitchen sink** — not “20 lines total.” Further collapsing into one mega-hook would save lines but **hurt** navigation and grep-ability (arguably *against* the spirit of named hooks). |

**Bottom line:** Home is a **reference implementation** for the parts of the guide that matter most for correctness and reviewability (hooks order, extraction, pure gates, memo boundaries). It **does not** use every optional pattern (e.g. signed-in-only child), and that is **intentional and documented**, not an oversight.

### Where Pause fits

**[screens/pause.md](../screens/pause.md)** maps [`PauseSession.tsx`](../../src/screens/pause/PauseSessionScreen.tsx): same **conductor** idea as Home (hooks first, returns at the bottom), but for a **single vertical** (volatility ritual) instead of a dashboard. Canonical **data** and RPC contracts stay in [systems/pause-system.md](../systems/pause-system.md) — especially **section 10** — while `pause.md` is the **UI + file** index for this route.

---

## Non-React parallels (edge / server handlers)

No hooks in Deno edge functions — but the **ideas** match:

| Screen idea | Edge analogue |
|-------------|----------------|
| Thin page | Thin **`index.ts`**: parse → call helpers → respond. |
| Named logic | **`_shared/*.ts`** modules + tests. |
| Types at source | **`EdgeError` codes**, typed bodies — not `any`. |
| Boundaries | **One job per function**; wrap HTTP handlers with **`withRequestLogging`**. |

**Read next:** [ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md), [ops/logging-strategy.md](../ops/logging-strategy.md). Deploy order: [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md).

---

## Related reading

- [refactoring-strategy.md](refactoring-strategy.md) — incremental refactors and full-stack touchpoints.  
- [navigating-the-codebase.md](navigating-the-codebase.md) — routing, auth, hooks at app level.  
- [screens/pause.md](../screens/pause.md) — **`/pause`** route: gate, scaffold, hooks + lib file map (orchestration).  
- [systems/pause-system.md](../systems/pause-system.md) — **`/pause`** ritual **data model**, RPCs, **`v_pause_full`** / archive views (companion to thin **`PauseSession.tsx`**).  
- [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) — backlog ideas that overlap with this playbook.
