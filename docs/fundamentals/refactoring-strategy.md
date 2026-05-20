# Refactoring strategy (React pages & hooks — plus full-stack touchpoints)

**Pre-launch baseline:** Structural principles, bounded contexts, and target monorepo layout live in [holzen-application-architecture.md](holzen-application-architecture.md). Modern React alignment (feature folders, Query, colocation scorecard): [modern-react-practices-holzen.md](modern-react-practices-holzen.md). Use **this** doc for **incremental** extractions inside the current tree until that restructure lands.

This document is the **canonical description** of how Holzen approaches **incremental** refactors on the **client**: splitting large pages and heavy hooks. **Backend work** (Postgres, RLS, edge functions) uses the **same incremental spirit** but different mechanics—see [§ Full-stack and backend-adjacent refactors](#full-stack-and-backend-adjacent-refactors) below.

It complements:

- **[`docs/fundamentals/naming-conventions-holzen.md`](naming-conventions-holzen.md)** — file/export names for features, screens, `public*` barrels, and migration branches.
- **[`docs/fundamentals/react-screen-orchestration.md`](react-screen-orchestration.md)** — **reusable playbook** for any large screen: conductor pattern, Rules of Hooks + early returns, lazy branches, memoized props, pure gates + tests (distilled from Home).
- **[`docs/reviews/react-spa-review-template.md`](../reviews/react-spa-review-template.md)** — flow-first **review** checklist (PR + audit); use before deciding *what* to extract (includes Supabase / edge context).
- **[`docs/backlog/react-page-and-hook-splitting.md`](../backlog/react-page-and-hook-splitting.md)** — living checklist of **slices shipped** and remaining opportunities.
- **[`docs/fundamentals/navigating-the-codebase.md`](navigating-the-codebase.md)** — where state and data patterns live today.
- **[`docs/fundamentals/mental-models-for-contributors.md`](mental-models-for-contributors.md)** — SPA / hooks mental model.
- **[`docs/fundamentals/client-server-architecture-holzen.md`](client-server-architecture-holzen.md)** — truth vs projection; how vertical slices (`UI` → `src/lib` → I/O) align with **server authority**.
- **[`AGENTS.md`](../../AGENTS.md)** — repo conventions and ESLint baseline.

---

## Is the direction “correct”?

**Yes, for this codebase.** The backlog explicitly rejects a **big-bang** rewrite in favor of **small, behavior-preserving extractions**. What has been shipped (Home chrome, PauseSession storage/scaffold, `use-holzen` pure helpers, `use-companion-data` in `features/pause/presentation/` with use cases under `application/use-cases/companion/` → target `ritual/frame/`) matches that contract:

| Principle | How we’re applying it |
|-----------|------------------------|
| **One vertical slice per change set** | Each bullet in the backlog table is an independently reviewable extraction, not a tree-wide rename. |
| **Preserve product behavior** | Moves are structural (file boundaries), not semantic rewrites of pause / orchestrate / BTC flows. |
| **Hooks as orchestrators, feature modules as mechanics** | Custom hooks coordinate **when** things run and **what** gets set in React state; **pure logic** belongs in `features/<ctx>/domain/` or `application/use-cases/`; **route-specific UI rules** in `screens/<route>/lib/`; **`src/lib/`** only for cross-cutting platform utilities (PostHog, Sentry, `invokeEdge`, routes). **Do not** add new `@/lib/<context>-*` shims — see [architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc). |
| **Colocate UI by route** | Pause/Home pieces live under `src/screens/<route>/components/`, not root `src/components/<feature>/` or a generic `widgets/` dump. |

That is **appropriate** for a shipping product with a small surface area of “god” modules: you get **reviewability and test hooks** without destabilizing the app.

**Default migration priority:** **pause** (`features/pause`, `screens/pause`, companion routes) until that area is clean at the current slice tier — layout target: [systems/pause-client-architecture.md](../systems/pause-client-architecture.md). Other contexts follow the same module skeleton (§9 of that doc). Agent workflow: [.cursor/rules/architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc).

---

## Strategy we are following (and why)

### 1. **Extract presentational UI first**

**What:** Move self-contained JSX (chrome, gates, scaffolds, widgets) into `src/screens/<route>/components/` (or `src/app/components/` when cross-route).

**Why:** Lowest risk—no change to data flow if props stay the same. Improves scanability of `HomeScreen.tsx` / `PauseSessionScreen.tsx`. Placement rules: [client-src-layout.md](client-src-layout.md).

### 2. **Extract pure logic to the owning feature (not new `src/lib/<context>-*` shims)**

**What:** Functions with clear inputs/outputs (cooldown math, severity from BTC %, persistence error copy, quarter-hour timing, orchestrate slot application) live in **`features/<ctx>/domain/`** or **`application/use-cases/`** (or **`screens/<route>/lib/`** for route-only UI rules); the hook **imports** them.

**Why:**

- Pure helpers are **easy to unit test** without mounting React.
- Avoids an explosion of tiny hooks that each need mock providers.
- Keeps **one place** that owns subscription to profile/BTC/reflection lifecycle (`use-holzen`) while still shrinking the file.
- Matches the migration north star: **no new** `@/lib/pause-*` / `@/lib/companion-*` — peel existing shims toward `features/pause/public*`.

**Legacy note:** Historical extractions landed in `src/lib/`; new work should **not** extend that pattern. Cross-cutting only: observability, Query client ref, feature flags, generic hooks in `src/lib/` or `src/app/hooks/`.

This aligns with **navigating-the-codebase §6.1**: not every concern needs `useQuery`; orchestration-heavy hooks may stay `useEffect`-driven while domain/use-case modules hold the testable core.

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
| **Typed module boundaries** | Favored — `features/<ctx>/domain/` and `application/use-cases/` with explicit exports; avoid `any` in new surfaces. |
| **Colocation** | Favored — feature components near route; pause vs home vs archive stay distinct under `screens/`. |
| **Testability** | Pure domain/use-case modules first; component tests where ROI is high. |
| **ESLint / AGENTS** | Don’t widen debt in touched files; fix or narrow scope if a file is opened. |

---

## Architectural decisions (structural preferences)

1. **Hooks as orchestrators, feature modules as mechanics**  
   Custom hooks coordinate **when** things run and **what** gets set in React state; **`features/<ctx>/`** holds domain + use cases; **`screens/<route>/lib/`** holds route UI rules; **`src/lib/`** holds cross-cutting platform utilities only (not new bounded-context shims).

2. **Feature folders over generic layers**  
   Prefer `screens/<route>/components/`, `features/pause/application/use-cases/`, and **`public*`** barrels over a flat `components/shared` or growing `@/lib/<context>-*`.

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
| **Design system / IA** | [DESIGN.md](../../DESIGN.md), [design/nox/README.md](../design/nox/README.md), [ops/active-surface.md](../ops/active-surface.md) (shipped routes), [design/information-architecture.md](../design/information-architecture.md) (full-IA reference) |
| **Accessibility** | Acceptance criteria on changed UI; systemic passes (e.g. [backlog/lighthouse-a11y-home.md](../backlog/lighthouse-a11y-home.md)) |
| **i18n** | Match existing `useTranslation` / key patterns in the same feature |
| **Analytics & flags** | [ops/event-taxonomy.md](../ops/event-taxonomy.md), [ops/feature-flags.md](../ops/feature-flags.md) when moving or renaming instrumented UI |
| **Routing & guards** | [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md), `src/App.tsx` |
| **Pause V2 lifecycle, archive views, step payloads** | [systems/pause-system.md](../systems/pause-system.md) (§3–9); archive lists: **`usePauseArchiveList`** → **`v_pause_archive_pauses`** / **`v_pause_archive_echoes`** |
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
