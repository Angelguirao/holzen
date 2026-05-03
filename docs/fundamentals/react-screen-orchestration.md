# React screen orchestration (Holzen)

This guide explains **how we structure big pages** in Holzen (starting from **`/` Home**) so they stay readable, correct, and reusable. It is written so **React beginners** can follow it; you can skip the [Quick React vocabulary](#quick-react-vocabulary) section if you already know those terms.

- **Concrete Home map:** [screens/home.md](../screens/home.md) (files, modes, widgets).  
- **This doc:** the **ideas** you can copy on other `src/pages/*` screens.

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

## Where Home fits

**[screens/home.md](../screens/home.md)** is the **worked example**: file list, modes, Zen vs dashboard, pause errors, analytics. Compare any new large page to that **shape** (thin page, fat hooks/libs).

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
- [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) — backlog ideas that overlap with this playbook.
