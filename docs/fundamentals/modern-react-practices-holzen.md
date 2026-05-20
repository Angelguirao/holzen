# Modern React practices (Holzen alignment)

**Status:** accepted (pre-launch baseline, May 2026)  
**Audience:** anyone structuring or reviewing Holzen’s React SPA  
**Scope:** What strong React teams do **today**, how that maps to **this repo** (transitional `src/` and **target** layout), and a **review checklist**.

This is the **React-layer companion** to [holzen-application-architecture.md](holzen-application-architecture.md) (bounded contexts, use cases, server truth). It does not replace [react-screen-orchestration.md](react-screen-orchestration.md) (concrete page patterns) or [client-server-architecture-holzen.md](client-server-architecture-holzen.md) (authority vs projection).

| Doc | Owns |
|-----|------|
| **This file** | Modern React norms + Holzen fit/gap matrix |
| [holzen-application-architecture.md](holzen-application-architecture.md) | Product domains, pause-centric packages, use cases |
| [frontend-module-layout.md](frontend-module-layout.md) | `apps/web`, `packages/*`, migration waves |
| [react-screen-orchestration.md](react-screen-orchestration.md) | Thin pages, hooks, memoization, Home/Pause tours |
| [navigating-the-codebase.md](navigating-the-codebase.md) §6.1 | TanStack Query vs `useEffect` + Supabase today |

---

## 1. What the industry converged on (2024–2026)

There is **no single** “React architecture standard,” but most strong teams align on:

| Principle | Plain meaning |
|-----------|----------------|
| **Feature / domain structure** | Code grouped by product area, not by technical kind at repo root |
| **Server state ≠ UI state** | Cached API data in Query/SWR; modals and selection in local state |
| **Colocation** | Hooks, types, and helpers live **next to the feature** that owns them |
| **Thin abstractions** | Reuse when repeated; don’t build frameworks inside the app |
| **Typed boundaries** | Schemas at wire/API edges (Zod, etc.), not “trust TS everywhere” |
| **Avoid premature global complexity** | No Redux-by-default, no microfrontends-by-default |
| **React as rendering** | UI composes; policy and persistence live server-side + named use cases |

The ecosystem moved **away from**:

- Massive Redux for all data
- Giant flat `components/`, `hooks/`, `utils/` dumping grounds
- Strict MVC on the client
- Heavy Clean Architecture ceremony **inside** the frontend (entities/repositories/interactors per table)
- “Everything reusable” shared folders
- Deep inheritance-style abstraction trees

**Deeper trend:** complexity should **emerge from product needs**, not from architecture ideology. Holzen’s [holzen-application-architecture.md](holzen-application-architecture.md) and [2026-05-17-modular-monolith-hexagonal-client ADR](../decisions/2026-05-17-modular-monolith-hexagonal-client.md) follow that direction — with **explicit use cases** at the application layer where ritual policy is non-trivial (pause), not enterprise indirection everywhere.

---

## 2. Eight practices (industry) → Holzen

### 2.1 Feature / domain-based structure

**Industry:** `features/<area>/` with `components/`, `hooks/`, `api/`, `types/` inside each feature.

**Holzen target:** `packages/<context>/` + `apps/web/src/screens/` — see [frontend-module-layout.md](frontend-module-layout.md). **Pause** is the large context; companions live **inside** pause, not a separate domain package.

**Holzen today:** `src/features/<context>/`, `src/screens/<route>/hooks/`, cross-cutting hooks in `src/app/hooks/` (install prompt, auto-trigger, language sync; **`src/hooks/` removed May 2026**), platform utilities in `src/lib/` (PostHog, Sentry, `invokeEdge`, routes), UI primitives in `src/components/ui/`.

| Check | Target | Today |
|-------|--------|-------|
| New ritual logic lands under pause feature module | ✅ required | ⚠️ converging — some use cases still at `application/use-cases/companion/` / `reflect/` (target `ritual/frame/` + `ritual/reflect/`) |
| Nav tabs are screens, not packages | ✅ | ⚠️ naming implied otherwise in old layout |
| Delete a feature = delete one folder/package | ✅ | ❌ cross-cutting imports |

---

### 2.2 Colocation over centralization

**Industry:** `features/billing/utils/formatInvoiceDate.ts` unless truly shared.

**Holzen:** Colocate under `packages/pause/`, `packages/user/`, etc. **Shared** only for: `ui/`, `invoke-edge`, `posthog`, `cid`, design tokens — `packages/infrastructure` + `shared-kernel`.

| Check | Target | Today |
|-------|--------|-------|
| Feature-specific hook not in root `hooks/` | ✅ | ✅ `features/*/public-hooks` + screen hooks |
| “Shared” justified in PR (2+ consumers) | ✅ | ⚠️ root `components/` clutter |
| Archive/journey queries with pause reads | ✅ | ⚠️ mostly in `features/pause/infrastructure/queries/` (group under `archive/` still open) |

---

### 2.3 Separate server state from client state

**Industry:** TanStack Query / SWR for server data; `useState` for UI.

**Holzen:** Documented in [client-server-architecture-holzen.md](client-server-architecture-holzen.md) and [navigating-the-codebase.md](navigating-the-codebase.md) §6.1.

| Data kind | Holzen pattern |
|-----------|----------------|
| Profiles, subscription, blog, many lists | `useQuery` / `queryOptions` |
| Pause orchestration, `useHolzen` / `useCompanionData` | Often `useEffect` + Supabase (migrate opportunistically); `useHolzen` split across pause `presentation/` conductors |
| Modal open, step UI, form drafts | `useState` / session storage |
| **Forbidden** | Same entity in Query **and** a global client store |

| Check | Target | Today |
|-------|--------|-------|
| New **shared** server read uses Query | ✅ | ⚠️ mixed |
| No second source of truth beside Query cache | ✅ | ⚠️ watch god hooks |
| Invalidate/patch cache after mutations | ✅ | ✅ in newer paths (`useSubscription` via `@/features/subscription/public-hooks`, pause invalidation helpers) |

---

### 2.4 Simple local state first

**Industry:** `useState` → lift → context → external store last.

**Holzen:** No mandated Zustand/Redux. `AuthProvider` + Query are enough for shipped scope.

| Check | Target | Today |
|-------|--------|-------|
| Modal / tab / picker state local | ✅ | ✅ mostly |
| Context only for cross-tree concerns (auth, i18n) | ✅ | ✅ |
| New global store requires ADR | ✅ | N/A (none) |

---

### 2.5 Thin components + custom hooks (and use cases)

**Industry:**

```tsx
function ProjectPage() {
  const { project, updateProject } = useProject()
  return <ProjectView project={project} />
}
```

**Holzen:** Same **presentation** pattern; **application** layer adds **use cases** for pause (see [holzen-application-architecture.md](holzen-application-architecture.md) §8):

```tsx
// target shape
function PauseSessionScreen() {
  const actions = usePauseSessionActions() // thin: wires use cases + UI state
  return <PauseSessionView {...actions} />
}
```

Hooks should **not** grow unbounded RPC + navigation + analytics; extract **use cases** when >~80–150 lines or reused.

| Check | Target | Today |
|-------|--------|-------|
| Page/screen mostly composes | ✅ per [react-screen-orchestration.md](react-screen-orchestration.md) | ⚠️ some large pages |
| God hook split (use case or sub-hook) | ✅ | ⚠️ `useHolzen` producer split shipped; `use-companion-data` still converging toward `ritual/frame/` use cases |
| No `supabase.from` in `.tsx` | ✅ | ⚠️ audit on touch |

---

### 2.6 Types + runtime validation at boundaries

**Industry:** Zod at API, forms, env; DB → API → schema → client.

**Holzen:** `gen:types` for Postgres; **target** `packages/contracts` for edge/RPC; forms often Zod via react-hook-form.

| Check | Target | Today |
|-------|--------|-------|
| Edge/RPC shapes in `contracts` when touched | ✅ | ⚠️ partial / informal |
| Forms use schema validation | ✅ | ✅ common pattern |
| Types not exported from `.tsx` for `lib/` consumers | ✅ | ❌ known leaks (e.g. companion types) |

---

### 2.7 React Server Components (framework trend)

**Industry:** Next.js App Router — fetch on server, smaller client bundles.

**Holzen choice:** **Vite SPA** for shipped product (Lovable publish, PWA, authenticated app). **Not aligned with RSC today** — intentional.

| Topic | Holzen |
|-------|--------|
| RSC / Server Actions | **Out of scope** unless [spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md) revisits SSR/SEO |
| “Fetch on server when possible” | Achieved via **Supabase + edge**, not RSC |
| Client components interactive-only | **Entire app is client** — keep bundles lean via `React.lazy` ([react-screen-orchestration.md](react-screen-orchestration.md)) |

**Do not** block the monorepo migration on Next.js; **do** keep pause routes code-split.

---

### 2.8 Modular monolith frontend

**Industry:** `app/`, `features/`, `shared/`, `infra/` — explicit boundaries, one deployable.

**Holzen target:** `apps/web` + `packages/*` + `packages/infrastructure` — matches [frontend-module-layout.md](frontend-module-layout.md).

| Check | Target | Today |
|-------|--------|-------|
| One web deployable | ✅ | ✅ |
| Package graph enforced (CI) | ✅ planned | ❌ |
| Shared design system (`ui/`) | ✅ | ✅ `components/ui/` |

---

## 3. What modern React usually considers overengineering

| Pattern | Holzen stance |
|---------|----------------|
| Full Clean Architecture in UI (entity/repo/gateway per table) | **Reject** as default; **use cases + ports** only where pause/subscription need testable policy |
| Redux for all server data | **Reject** — Query |
| Microfrontends | **Reject** pre-launch |
| `@holzen/companion` as peer of pause | **Reject** — companions inside pause |
| Package per bottom-nav tab | **Reject** — screens in `apps/web` |
| Abstract “reusable” hooks with no second consumer | **Reject** — colocate first |

---

## 4. Holzen alignment summary (scorecard)

Use in PR description or pre-launch audits. **Target** = after [frontend-module-layout.md](frontend-module-layout.md) migration; **Today** = current `src/` on `main` / `feature/mvpPauseCleanup`.

| Practice | Target alignment | Today (transitional) | Primary doc |
|----------|------------------|----------------------|-------------|
| Domain / feature structure | **Strong** | Weak (flat layers) | [frontend-module-layout.md](frontend-module-layout.md) |
| Colocation | **Strong** | Weak | Same |
| Server vs UI state | **Strong** (rules clear) | **Partial** (Query + effects mix) | [client-server-architecture-holzen.md](client-server-architecture-holzen.md) |
| Local state first | **Strong** | **Strong** | This doc §2.4 |
| Thin UI + hooks/use cases | **Strong** (pause) | **Partial** (god hooks) | [react-screen-orchestration.md](react-screen-orchestration.md) |
| Typed boundaries | **Strong** (contracts package) | **Partial** | [holzen-application-architecture.md](holzen-application-architecture.md) P8 |
| RSC / Next | **N/A (SPA)** | N/A | ADR + backlog |
| Modular monolith | **Strong** | **Planned** | [2026-05-17 ADR](../decisions/2026-05-17-modular-monolith-hexagonal-client.md) |
| Server authority (not React rules) | **Strong** | **Strong** | [client-server-architecture-holzen.md](client-server-architecture-holzen.md) |

**Overall:** Product and **server** architecture are ahead of **client folder** architecture. Pre-launch work should **close the gap** without adopting frontend patterns Holzen explicitly rejects (§3).

---

## 5. Target folder shape (React lens)

Mapped to industry vocabulary:

```text
apps/web/                    # “app/” — routes, providers, screens (composition)
packages/pause/              # “features/pause” — domain + use cases + ports
packages/subscription/
packages/user/
packages/infrastructure/     # “infra/” — supabase client, invokeEdge, adapters
packages/contracts/          # Zod at boundaries
packages/shared-kernel/      # minimal shared types
  presentation/ui/           # design system (today: src/components/ui)
```

**Inside `packages/pause`** (colocation — **today:** same interior under `src/features/pause/`; on-disk vs target in [pause-client-architecture.md](../systems/pause-client-architecture.md) §10):

```text
application/use-cases/ritual/reflect/   # reflect use cases (Phase A complete May 2026)
application/use-cases/ritual/frame/     # target — companion still at application/use-cases/companion/ until Phase A
presentation/   OR   apps/web/src/screens/pause/
```

Pick **one** presentation rule — [pause-client-architecture.md](../systems/pause-client-architecture.md) §3 (canonical) and [frontend-module-layout.md](frontend-module-layout.md) §3 (north-star packages).

---

## 6. PR review checklist (modern React)

Add to [react-spa-review-template.md](../reviews/react-spa-review-template.md) flow when touching UI:

- [ ] **Feature ownership:** change lives in the right package/screen, not a random root `lib/` file.
- [ ] **Colocation:** no new root-level hook unless shared infra.
- [ ] **Server state:** new shared fetch uses TanStack Query with a stable key; mutation invalidates.
- [ ] **UI state:** modal/selection local; not duplicated in Query.
- [ ] **Thin UI:** no business branching in JSX; use case or pure `domain/` helper.
- [ ] **No IO in components:** no direct `supabase` / `invoke` in `.tsx`.
- [ ] **Boundary types:** wire changes update `contracts` or generated types.
- [ ] **Pause ritual:** step/RPC changes align with [pause-system.md](../systems/pause-system.md).
- [ ] **Bundle:** heavy routes lazy-loaded where applicable.
- [ ] **Not overengineering:** no new package/context/store without justification in PR text.

---

## 7. Migration: modern React without losing Holzen rules

Order that satisfies **both** this doc and [frontend-module-layout.md](frontend-module-layout.md):

1. **Screens** — `apps/web/src/screens/*` (Home, Archive, Pause, …).
2. **`packages/pause`** (today: `src/features/pause/`) — domain + use cases first; reflect + frame **target** `application/use-cases/ritual/reflect/` and `ritual/frame/` — on disk still `application/use-cases/companion/` (orchestration hub) until Phase A companion slices finish ([pause-client-architecture.md](../systems/pause-client-architecture.md) §3, §10).
3. **`packages/infrastructure`** — adapters; Query `queryOptions` factories move here.
4. **Thin hooks** — screens call use cases. **Home/settings:** orchestration in `screens/<route>/hooks/` where screen-local. **Pause:** conductors in `features/pause/presentation/` per [pause-client-architecture.md](../systems/pause-client-architecture.md) §3.2 (no `screens/pause/hooks/`).
5. **`contracts`** — when touching edge/RPC JSON.
6. **CI** — `check:package-boundaries` / `check:feature-imports`.

**Do not** “modernize” by adding Redux, RSC, or splitting companion into a fake domain.

---

## 8. Related reading

| Topic | Doc |
|-------|-----|
| Page conductor pattern | [react-screen-orchestration.md](react-screen-orchestration.md) |
| Query vs effects | [navigating-the-codebase.md](navigating-the-codebase.md) §6.1, [data-fetching-conventions.md](../backlog/data-fetching-conventions.md) |
| Use cases vs hooks | [holzen-application-architecture.md](holzen-application-architecture.md) §4, §8 |
| Incremental extractions (old tree) | [refactoring-strategy.md](refactoring-strategy.md) |
| Flow-first PR review | [react-spa-review-template.md](../reviews/react-spa-review-template.md) |
| Optional SSR/framework | [spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md) |

---

## 9. Summary

Modern React favors **feature cohesion**, **Query for server state**, **local UI state**, **colocation**, and **thin UI** — with complexity driven by product needs. Holzen **agrees** on direction and adds **server truth**, **pause-centric modules**, and **use cases** where the ritual demands testable policy. The main **gap** is transitional flat `src/`; closing it is what the monorepo migration is for — not adopting every frontend pattern (RSC, heavy CA, global stores) the industry has moved past.
