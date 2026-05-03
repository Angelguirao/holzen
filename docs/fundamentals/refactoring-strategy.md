# Refactoring strategy (React pages & hooks — plus full-stack touchpoints)

This document is the **canonical description** of how Holzen approaches **incremental** refactors on the **client**: splitting large pages and heavy hooks. **Backend work** (Postgres, RLS, edge functions) uses the **same incremental spirit** but different mechanics—see [§ Full-stack and backend-adjacent refactors](#full-stack-and-backend-adjacent-refactors) below.

It complements:

- **[`docs/fundamentals/react-screen-orchestration.md`](react-screen-orchestration.md)** — **reusable playbook** for any large screen: conductor pattern, Rules of Hooks + early returns, lazy branches, memoized props, pure gates + tests (distilled from Home).
- **[`docs/reviews/react-spa-review-template.md`](../reviews/react-spa-review-template.md)** — flow-first **review** checklist (PR + audit); use before deciding *what* to extract (includes Supabase / edge context).
- **[`docs/backlog/react-page-and-hook-splitting.md`](../backlog/react-page-and-hook-splitting.md)** — living checklist of **slices shipped** and remaining opportunities.
- **[`docs/fundamentals/navigating-the-codebase.md`](navigating-the-codebase.md)** — where state and data patterns live today.
- **[`docs/fundamentals/mental-models-for-contributors.md`](mental-models-for-contributors.md)** — SPA / hooks mental model.
- **[`AGENTS.md`](../../AGENTS.md)** — repo conventions and ESLint baseline.

---

## Is the direction “correct”?

**Yes, for this codebase.** The backlog explicitly rejects a **big-bang** rewrite in favor of **small, behavior-preserving extractions**. What has been shipped (Home chrome, PauseSession storage/scaffold, `use-holzen` pure helpers, `use-companion-data` + `src/lib/companion-*`) matches that contract:

| Principle | How we’re applying it |
|-----------|------------------------|
| **One vertical slice per change set** | Each bullet in the backlog table is an independently reviewable extraction, not a tree-wide rename. |
| **Preserve product behavior** | Moves are structural (file boundaries), not semantic rewrites of pause / orchestrate / BTC flows. |
| **Narrow hooks, don’t micro-fragment** | `use-holzen` and `use-companion-data` still **own orchestration and React state**; helpers are **pure or I/O-shaped** modules in `src/lib/`. |
| **Colocate UI by feature** | Pause/Home pieces live under `src/components/home/` or `pause/` (or existing feature folders), not a generic `widgets/` dump. |

That is **appropriate** for a shipping product with a small surface area of “god” modules: you get **reviewability and test hooks** without destabilizing the app.

---

## Strategy we are following (and why)

### 1. **Extract presentational UI first**

**What:** Move self-contained JSX (chrome, gates, scaffolds, widgets) into components under `src/components/<feature>/`.

**Why:** Lowest risk—no change to data flow if props stay the same. Improves scanability of `Home.tsx` / `PauseSession.tsx` and matches patterns already used elsewhere (`pause/Pause*`).

### 2. **Extract pure logic to `src/lib/` (not new hooks by default)**

**What:** Functions with clear inputs/outputs (cooldown math, severity from BTC %, persistence error copy, quarter-hour timing, orchestrate slot application) live in small modules; the hook **imports** them.

**Why:**

- Pure helpers are **easy to unit test** without mounting React.
- Avoids an explosion of tiny hooks that each need mock providers.
- Keeps **one place** that owns subscription to profile/BTC/reflection lifecycle (`use-holzen`) while still shrinking the file.

This aligns with **navigating-the-codebase §6.1**: not every concern needs `useQuery`; orchestration-heavy hooks may stay `useEffect`-driven while libs hold the testable core.

### 3. **Extract “glue” that crosses HTTP/storage boundaries**

**What:** e.g. `pause-session-storage.ts`, `companion-orchestrate-slot-apply.ts`, reflection companion cache parsing.

**Why:** Isolates **side effects and serialization** from UI and from the main hook loop, so bugs are easier to localize (storage vs orchestrate vs render).

### 4. **Defer “split `use-holzen` into three hooks” until the API is painful**

**What:** The backlog **does not** require splitting `useHolzen()` into `useBtc`, `useReflection`, etc. immediately.

**Why:** Child hooks that share lots of **tightly coupled state** often trade one large file for **prop drilling or context churn**. Clear **lib** boundaries give most of the benefit first; a future hook split can follow **real** caller needs (e.g. two routes needing only BTC).

---

## Best practices (what we’re favoring)

| Practice | Status |
|----------|--------|
| **Incremental PRs** | Favored — one slice per PR when possible. |
| **Behavior parity** | Required — refactors should not change user-visible flows without an explicit product ticket. |
| **Typed module boundaries** | Favored — `src/lib/*.ts` with explicit exports; avoid `any` in new surfaces. |
| **Colocation** | Favored — feature components near feature; pause vs home vs library stay distinct. |
| **Testability** | Pure `src/lib` first; component tests where ROI is high. |
| **ESLint / AGENTS** | Don’t widen debt in touched files; fix or narrow scope if a file is opened. |

---

## Architectural decisions (structural preferences)

1. **Hooks as orchestrators, `lib` as mechanics**  
   Custom hooks coordinate **when** things run and **what** gets set in React state; `src/lib` holds **how** to compute or format, and **adapters** to Supabase/orchestrate.

2. **Feature folders over generic layers**  
   Prefer `components/home/`, `components/pause/`, `lib/companion-*` over a flat `components/shared` for everything.

3. **Route-level code splitting is orthogonal**  
   [`route-level-code-splitting.md`](../backlog/route-level-code-splitting.md) controls **when** chunks load (`React.lazy`). This strategy controls **how fat** each chunk is inside a route—both can apply together.

4. **Backlog as source of truth for “what’s next”**  
   When you ship a slice, add a row to **`react-page-and-hook-splitting.md`** so the team sees cumulative progress and avoids duplicate work.

---

## Anti-patterns (explicitly out of scope)

- **Tree-wide renames** or “cleanup” unrelated to the slice you’re touching.
- **Splitting a hook** into many hooks **without** a stable consumer API—creates churn for marginal gain.
- **Moving business rules** into components—keep decisions in hooks or `lib`, views stay thin.

---

## Frontend: scope of this strategy

This document is **comprehensive for structural client refactors**: extraction order (UI → pure `lib` → glue), hook vs `src/lib` boundaries, colocation, and explicit anti-patterns. It is **not** a full playbook for every frontend concern—pair refactors with the right doc when you touch that surface:

| Concern | Where to look |
|---------|----------------|
| **Design system / IA** | [DESIGN.md](../../DESIGN.md), [design/nox/README.md](../design/nox/README.md), [design/information-architecture.md](../design/information-architecture.md) |
| **Accessibility** | Acceptance criteria on changed UI; systemic passes (e.g. [backlog/lighthouse-a11y-home.md](../backlog/lighthouse-a11y-home.md)) |
| **i18n** | Match existing `useTranslation` / key patterns in the same feature |
| **Analytics & flags** | [ops/event-taxonomy.md](../ops/event-taxonomy.md), [ops/feature-flags.md](../ops/feature-flags.md) when moving or renaming instrumented UI |
| **Routing & guards** | [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md), `src/App.tsx` |
| **Runtime / E2E QA** | [browser-360-mcp-playbook.md](browser-360-mcp-playbook.md), [e2e-browser-automation.md](../backlog/e2e-browser-automation.md) |
| **Bundle / lazy routes** | [route-level-code-splitting.md](../backlog/route-level-code-splitting.md) (already linked above) |

---

## Full-stack and backend-adjacent refactors

The React-focused sections above do **not** imply that all refactors are UI-only. Many “refactors” are really **contract changes**: API shapes, RLS visibility, edge handler structure. Treat those as **ordered, reversible steps** (schema ↔ client ↔ types), not as drive-by edits.

| Area | What “incremental refactor” usually means | Canonical docs |
|------|-------------------------------------------|------------------|
| **SQL / RLS / views** | One migration (or small series) per concern; respect `search_path`, `SECURITY DEFINER` rules, view column safety | [ops/migration-security-conventions.md](../ops/migration-security-conventions.md), [ops/migration-view-safety.md](../ops/migration-view-safety.md) |
| **Edge functions** | Extract shared logic into `supabase/functions/_shared/`; keep HTTP entrypoints thin; preserve `withRequestLogging` | [AGENTS.md](../../AGENTS.md), [ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md); `npm run check:edge` / `check:edge-logging` when you touch edges |
| **Client after schema** | Regenerate or cast types (`npm run gen:types`, `as unknown as T` until caught up) | [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md) |
| **Security / authz baselines** | Prefer phased review docs before large policy reshuffles | [reviews/phase-6-rls-authz-security-model.md](../reviews/phase-6-rls-authz-security-model.md) through [phase-8-rls-hardening-service-role-policies.md](../reviews/phase-8-rls-hardening-service-role-policies.md) |

**Principle (same as frontend):** one **vertical slice** or one **clear layer** per PR—e.g. “extract helper used by two edges” or “add column + RLS + read path in client,” not “rewrite all policies” in a single change unless you have a dedicated migration plan.

**Living backlog:** UI extraction progress lives in [`react-page-and-hook-splitting.md`](../backlog/react-page-and-hook-splitting.md). **SQL/edge** refactors usually deserve their own backlog row or ADR when they change production contracts; do not fold them silently into a React-only ticket.

---

## When you’re done reading this

- For **what’s already done**, see the progress table in [`react-page-and-hook-splitting.md`](../backlog/react-page-and-hook-splitting.md).
- For **where code lives**, see [`navigating-the-codebase.md`](navigating-the-codebase.md) §6–8.
- For **automation conventions**, see [`AGENTS.md`](../../AGENTS.md).
- For **ship order** when migrations or edges change, see [`docs/ops/deployment-sync-guide.md`](../ops/deployment-sync-guide.md).
- For **flow-first review** before refactors, see [`docs/reviews/react-spa-review-template.md`](../reviews/react-spa-review-template.md) and [`docs/reviews/end-to-end-review-master-checklist.md`](../reviews/end-to-end-review-master-checklist.md).
