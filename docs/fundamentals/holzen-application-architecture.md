# Holzen application architecture (principles)

**Status:** accepted (pre-launch baseline, May 2026)  
**Audience:** engineers, reviewers, and automation working in this repository  
**Scope:** How we structure **client**, **edge**, and **contracts** around Postgres truth — philosophy, principles, inspirations, and rejected alternatives.

This document is the **constitution** for application structure. It does not replace subsystem behavior docs (`docs/systems/*`), operational runbooks (`docs/ops/*`), or the **authority** narrative in [client-server-architecture-holzen.md](client-server-architecture-holzen.md).

| Doc | Owns |
|-----|------|
| **This file** | Principles, bounded contexts, layers, use cases, inspirations, alternatives, anti-patterns |
| [client-server-architecture-holzen.md](client-server-architecture-holzen.md) | Truth vs projection, trust boundaries, Query vs UI state |
| [frontend-module-layout.md](frontend-module-layout.md) | Target repo tree, package graph, naming, CI boundary checks *(companion; create when restructure starts)* |
| [ops/active-surface.md](../ops/active-surface.md) | Shipped routes, edges, tables, events |
| [systems/pause-system.md](../systems/pause-system.md) | Pause lifecycle invariants and schema |

**Decision record:** When the monorepo / package layout is formally adopted, add or link an ADR under [docs/decisions/](../decisions/) (see [decisions/README.md](../decisions/README.md)).

---

## 1. Purpose

Holzen is a **policy-heavy** product: pause rituals, subscription gates, AI companions, and market context. The codebase must stay **safe under a hostile client**, **clear under AI-assisted edits**, and **cheap to extend** with new surfaces (web today; possibly more later).

This note answers:

- **Why** we organize code the way we do (not only where files sit today).
- **What** we optimize for long-term.
- **Which** external ideas we adopt — and which we deliberately skip.

It is **not**:

- A tutorial on React or Supabase (see [mental-models-for-contributors.md](mental-models-for-contributors.md)).
- The pause state machine or RPC catalog (see [systems/pause-system.md](../systems/pause-system.md)).
- A folder listing of the current `src/` tree (that changes; principles should not).

---

## 2. Product and technical constraints

These constraints are **inputs** to architecture, not afterthoughts.

| Constraint | Architectural consequence |
|------------|---------------------------|
| **Browser is untrusted** | Authorization and lifecycle **must** hold in Postgres (RLS), RPCs, and edge — not only in TypeScript. |
| **Pause-first shipped scope** | Active code matches [active-surface.md](../ops/active-surface.md); retired IA lives off the main branch path (git archive / tag), not as a second runtime in `src/`. |
| **Supabase as platform** | Auth, PostgREST, RPCs, storage, and Deno edge are **infrastructure**; Holzen policy sits **above** them in SQL and application steps. |
| **AI and third-party APIs** | Secrets and orchestration stay in **edge**; the SPA invokes named operations via `invokeEdge` with **`x-cid`**. |
| **Single web app today** | One primary deployable (`apps/web` or equivalent); design so **packages** can be shared if a second client appears. |
| **Pre-launch window** | Prefer **one correct structural baseline** over years of incremental folder drift. |

---

## 3. Core thesis

Five statements every change should respect:

1. **Server defines reality** — rows, policies, RPC outcomes, and edge side effects are authoritative.
2. **Client projects reality** — React renders state; TanStack Query caches **reads**; the UI must **reconcile** when the server disagrees.
3. **Intentions have names** — user-visible actions map to **use cases** (application layer), not anonymous logic in JSX or god hooks.
4. **Boundaries are enforced** — bounded contexts (features/packages) and **dependency direction** matter as much as naming.
5. **Contracts are explicit** — wire shapes at boundaries (edge bodies, critical RPC args, analytics payloads); **behavior** is not copy-pasted between runtimes.

TypeScript types are a **shared language**, not a second place to hide business rules ([client-server-architecture-holzen.md](client-server-architecture-holzen.md)).

---

## 4. Principles (normative)

### P1 — Authority on the server

Any rule that **must never** be bypassed — pause engage, step logging, billing, row visibility — lives in **migrations (constraints, RLS, triggers)**, **SECURITY DEFINER RPCs** where appropriate, or **edge** with validated callers.

**Therefore:** Client code may **preview** outcomes (hide buttons, show copy) but never **assume** success without server confirmation.

### P2 — Use cases express application intent

An **application use case** is one coherent action: *log pause step*, *ensure trial*, *hydrate pause session*, *orchestrate companions*. It orchestrates **ports** (interfaces) and returns a **result** the UI can interpret.

**Therefore:** React hooks and route screens **call use cases**; they do not embed Supabase chains or edge `fetch` inline in components.

### P3 — Domain vocabulary is shared and testable

**Domain** holds entities, value objects, transitions, and **client-advisory** rules (formatting, “should we show upgrade?”). Vocabulary aligns with `docs/systems/*` (e.g. pause instance, `opening_message`, entitlement).

**Therefore:** Domain modules have **no** imports from React, Supabase, or `window`.

### P4 — Infrastructure is behind ports

**Ports** describe what application code needs from the world (`PauseRepository`, `ReflectGenerator`, `SubscriptionReader`). **Adapters** implement them (Supabase client, `invokeEdge`, `localStorage`).

**Therefore:** Unit tests use **fake adapters**; swapping IO does not rewrite use cases.

### P5 — Presentation is thin

**Presentation** (React screens, components, thin hooks) maps user events → use cases → loading/error/success UI. [react-screen-orchestration.md](react-screen-orchestration.md) applies here: conductors, not junk drawers.

**Therefore:** No `supabase.from` in `.tsx` files; no business branching buried in `className` conditionals.

### P6 — Reads and writes are consciously separated (CQRS-lite)

**Commands** mutate state through use cases → RPC/edge → **invalidate** or patch Query cache. **Queries** load projections via TanStack Query (`queryOptions` factories in infrastructure).

**Therefore:** Avoid a second global store mirroring API rows; avoid `useEffect`+Supabase for data that multiple routes share unless migration is in progress.

### P7 — Bounded contexts do not reach into each other’s guts

Contexts such as **pause**, **subscription**, **companion**, **archive**, **settings**, **market** expose a **small public API** (`public.ts` or package `exports`). Internal folders are private.

**Therefore:** Cross-context imports go through **published** symbols only; CI checks package/graph boundaries when available.

### P8 — Contracts at the wire

Edge inputs/outputs and critical RPC payloads are defined in a **contracts** package (Zod or equivalent), validated at the adapter boundary, and kept aligned with Bruno/HTTP review where applicable.

**Therefore:** Do not rely on tribal knowledge of JSON shapes; regenerate or tighten `Database` types after migrations ([deployment-sync-guide.md](../ops/deployment-sync-guide.md)).

### P9 — Observability is part of the boundary

User actions that hit the network carry **`x-cid`**; errors flow through shared logging/Sentry helpers ([ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md), [ops/logging-strategy.md](../ops/logging-strategy.md)).

**Therefore:** New entrypoints use existing wrappers (`withRequestLogging`, `invokeEdge`) — not ad-hoc `fetch`.

### P10 — Structure may change; principles do not

Folder names and monorepo layout are **implementation** of this document. Amending principles requires team agreement; moving files requires a migration plan and updated [frontend-module-layout.md](frontend-module-layout.md).

---

## 5. Qualities we optimize for

| Quality | Meaning in Holzen |
|---------|-------------------|
| **Correctness** | Server rejects illegal transitions; client never lies about success. |
| **Security** | RLS + RPC + edge validation; no secrets in `VITE_*`. |
| **Changeability** | Pause work does not require editing subscription adapters. |
| **Testability** | Domain + application tested without jsdom; integration tests for critical flows. |
| **Clarity for humans and agents** | Predictable place for each concern; import rules fail CI when violated. |
| **Operability** | Correlation, audit on sensitive actions, shipped surface documented in one manifest. |

We **do not** optimize for: minimal file count, pattern purity, or matching every diagram in *Clean Architecture*.

---

## 6. Conceptual model

### 6.1 Layers (client)

Dependency direction: **presentation → application → domain**; **application → ports**; **infrastructure implements ports**.

```text
┌─────────────────────────────────────────────────────────┐
│  presentation — screens, components, thin hooks         │
└───────────────────────────┬─────────────────────────────┘
                            │ calls
┌───────────────────────────▼─────────────────────────────┐
│  application — use cases (logPauseStep, decidePauseStep) │
└───────────────────────────┬─────────────────────────────┘
                            │ uses
┌───────────────────────────▼─────────────────────────────┐
│  domain — types, transitions, advisory rules             │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ implements
┌───────────────────────────┴─────────────────────────────┐
│  infrastructure — Supabase adapters, invokeEdge, storage  │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Layers (server)

| Layer | Role | Typical location |
|-------|------|------------------|
| **Domain (truth)** | Invariants, RLS, constraints | `supabase/migrations/` |
| **Application** | One HTTP/cron action: validate → orchestrate | `supabase/functions/_shared/<context>/` steps; thin `index.ts` |
| **Infrastructure** | HTTP, Stripe, AI, email, logging | `withRequestLogging`, provider clients |

Edge **application** steps should be nameable parallels of client use cases where the same product action exists (e.g. reflect generation).

### 6.3 End-to-end flow

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Presentation
  participant UC as Use case
  participant AD as Adapter
  participant S as Postgres / Edge

  U->>UI: tap / submit
  UI->>UC: execute(intent, input)
  UC->>AD: port call
  AD->>S: RPC or invokeEdge
  S-->>AD: result or error
  AD-->>UC: typed outcome
  UC-->>UI: Result
  UI->>UI: invalidate Query / toast / navigate
```

**Symmetric:** both client and server have orchestration and IO.  
**Asymmetric:** only **S** can enforce policy ([client-server-architecture-holzen.md](client-server-architecture-holzen.md) — *structural symmetry, semantic asymmetry*).

---

## 7. Bounded contexts (product modules)

Align code with **what the product does**, not with technical layers at the repo root.

| Context | Responsibility | System doc (behavior) |
|---------|----------------|------------------------|
| **pause** | Ritual session, steps, artifacts, terminal states | [pause-system.md](../systems/pause-system.md) |
| **companion** | Orchestration, slots, grounding enrichment UX | [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) |
| **subscription** | Entitlement, Stripe, trial, paywall | auth/billing docs + active-surface |
| **market** | BTC context, thresholds, display preferences | navigating-the-codebase, hooks around `btc.ts` |
| **home** | Dashboard composition, pause card, onboarding entry | [screens/home.md](../screens/home.md) |
| **archive** | Past pauses, collections | active-surface |
| **journey** | Overview, streaks (shipped scope) | active-surface |
| **settings** | Profile prefs, signals, quiet windows | settings screens |
| **auth** | Session, sign-in/out | [auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md) |
| **admin** | Internal ops (non-user-facing) | admin components + edges in manifest |

**Shared kernel** (tiny): `Result`, branded IDs, shared errors — only if truly cross-cutting.

Contexts map to **`packages/<context>`** in the target monorepo (see §9), not to a flat `src/hooks` or `src/lib`.

---

## 8. Inspirations — what we take and what we skip

| Idea | Reference | We take | We skip |
|------|-----------|---------|---------|
| **Clean Architecture** | Robert C. Martin | Dependency rule; use cases as application boundary; framework at the edge | Heavy “entity” layering everywhere; framework-agnostic UI for its own sake |
| **Hexagonal (ports & adapters)** | Alistair Cockburn | Ports in application; adapters in infrastructure; test without IO | Ceremony diagrams; adapter per table |
| **Domain-Driven Design** | Evans; Vernon (tactical) | Bounded contexts, ubiquitous language, align with `docs/systems/` | Full aggregate/event-sourcing stack pre-launch |
| **CQRS (lite)** | Fowler et al. | Separate command paths (use cases) from read models (Query) | Separate databases, event buses |
| **Modular monolith** | Newman et al. | Package boundaries inside one deployable | Premature microservices |
| **Feature-Sliced Design** | Community (FSD) | Strict import layers between slices | Renaming Holzen contexts to FSD’s `entities/features/widgets` taxonomy |
| **Contract-first APIs** | Industry practice | Zod (or similar) at edge + client boundary | Hand-maintained OpenAPI as default ([documentation-strategy.md](documentation-strategy.md)) |
| **Zero-trust client** | Security baseline | RLS + server validation | “Security through” TypeScript visibility |

External reading is **optional**; this table is the project’s **curated** stance.

---

## 9. Target repository shape (pre-launch baseline)

The **current** tree (`src/pages`, flat `src/hooks`, flat `src/lib`) is **transitional**. The **target** shape below implements these principles. Operational detail lives in [frontend-module-layout.md](frontend-module-layout.md) when that companion doc is added.

```text
apps/
  web/                          # Vite SPA: router, providers, composition only

packages/
  contracts/                    # Zod + types for wire boundaries
  shared-kernel/                # minimal shared types/helpers
  infrastructure/               # Supabase + invokeEdge adapter implementations
  pause/                        # domain + application + ports (+ tests)
  companion/
  subscription/
  market/
  archive/
  journey/
  settings/
  auth/
  …                             # other bounded contexts as needed

supabase/                       # authoritative domain (unchanged role)
docs/systems/                   # behavioral truth per context
```

**Dependency rules (enforced over time):**

- `apps/web` may import `packages/*` public APIs and `contracts`.
- `packages/<context>/application` imports `domain` + `ports` only — not Supabase, not React.
- `packages/infrastructure` implements `ports`; may import `contracts` and Supabase client.
- `packages/<context>A` must not import `packages/<context>B>` internals (only `public` exports).

Until the monorepo exists, approximate this with `src/features/<context>/{domain,application,infrastructure,presentation}` and the same dependency rules inside each feature.

---

## 10. Alternatives considered

| Alternative | Appeal | Why not the long-term default for Holzen |
|-------------|--------|------------------------------------------|
| **Flat `src/lib` + `src/hooks` with naming prefixes** | Zero migration cost | No compile-time boundaries; rots quickly; agents cross-import freely |
| **Feature folders only (no packages)** | Simpler than monorepo | Import rules are convention-only; harder to share with a second client |
| **Feature-Sliced Design verbatim** | Popular in React | Vocabulary mismatch; our contexts are product-shaped (pause, companion), not FSD layers |
| **Next.js / Remix instead of SPA** | SSR, colocated routes | Lovable publish path, PWA, mostly authenticated app — revisit only if SEO/SSR becomes launch-critical ([spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md)) |
| **All logic in edge functions** | Thin client | Poor offline UX, chatty network, still need client state machine projection |
| **All logic in client hooks** | Fast to ship | Fails P1; duplicate truth; untestable policy |
| **Microservices (pause service, billing service)** | Independent scale | Operational cost; Supabase already centralizes data |
| **Class per use case + DI framework** | OOP familiarity | Verbose for TS/React; **functions** + explicit ports are enough |
| **Global event bus between features** | Loose coupling | Hard to trace; YAGNI until proven need |
| **Keep `src/legacy/` on main** | Easy reference | Permanent confusion; use git tag / archive branch only |

---

## 11. Anti-patterns (review checklist)

Flag in PR review when you see:

- [ ] **Authoritative transition** implemented only in React (no RPC/RLS/edge backstop).
- [ ] **`supabase.from` or `functions.invoke` in a component** (presentation bypassing application).
- [ ] **God hook** (>~150 lines) mixing fetch, navigation, analytics, and policy — extract use case.
- [ ] **Types exported from `.tsx`** imported by `lib/` or other contexts — move to `domain/types` or `contracts`.
- [ ] **Deep import** across contexts (`@/features/pause/infrastructure/...` from settings).
- [ ] **Duplicate cache**: TanStack Query + global store for the same entity.
- [ ] **Optimistic UI** without rollback + invalidate on failure.
- [ ] **Fat edge `index.ts`** with no extracted steps or shared validation.
- [ ] **Behavior copied** into edge and client instead of shared **contract** + server truth.
- [ ] **Active import from `@/legacy/*`** (forbidden — [active-surface](../ops/active-surface.md)).

---

## 12. Testing strategy (aligned with layers)

| Layer | Test style |
|-------|------------|
| **domain** | Unit tests — pure functions, transitions, advisory gates |
| **application** | Unit tests — use cases with **in-memory fakes** of ports |
| **infrastructure** | Integration tests — optional; mock Supabase where heavy |
| **presentation** | Component tests for critical UX; flow tests for launch paths |
| **server SQL** | Migrations + RLS review; RPC tests where high risk |
| **edge** | Handler tests on extracted steps; Bruno smoke for HTTP |

Launch gate flows (documented in [end-to-end-review-master-checklist.md](../reviews/end-to-end-review-master-checklist.md)): auth → trial → Home → `/pause` ritual → companion surfaces → Archive → Journey → Settings → lapsed entitlement.

---

## 13. Relationship to other documentation

```text
holzen-application-architecture.md     ← you are here (principles)
        │
        ├── client-server-architecture-holzen.md   (authority / projection)
        ├── frontend-module-layout.md              (repo map — companion)
        ├── react-screen-orchestration.md          (React mechanics)
        ├── refactoring-strategy.md                (incremental moves; superseded for greenfield by §9)
        ├── docs/systems/*                         (per-context behavior)
        ├── ops/active-surface.md                  (shipped manifest)
        └── docs/decisions/*                       (dated forks, e.g. monorepo adoption)
```

When **behavior** of pause changes, update **`pause-system.md`**. When **why we structure code** changes, update **this file** and add an ADR if the decision is costly to reverse.

---

## 14. Evolution and governance

| Change type | Action |
|-------------|--------|
| New bounded context (e.g. new tab/product area) | Add `packages/<context>`, row in §7, system doc under `docs/systems/`, active-surface row |
| New edge or RPC | Contract schema, adapter, use case, manifest, Bruno if HTTP-reviewed |
| Principle amendment | PR discussion + edit this doc + ADR if structure-wide |
| Folder-only refactor | Update [frontend-module-layout.md](frontend-module-layout.md); no principle edit |

**Supersession:** [refactoring-strategy.md](refactoring-strategy.md) remains valid for **small extractions** inside the old tree until the monorepo migration completes; greenfield work should follow §9.

---

## 15. Summary

1. **Postgres, RLS, RPCs, and edge** own truth; the SPA **projects** it honestly.  
2. **Bounded contexts** and **use cases** name product intentions; **ports/adapters** isolate IO.  
3. **Contracts** align wire formats; **types** do not smuggle behavior across runtimes.  
4. **Presentation stays thin**; **domain stays pure**; **CI enforces boundaries** as the repo matures.  
5. **Pre-launch** is the window to match **structure to these principles** — not to preserve accidental layout.

**One-line mandate:** *Modular monolith on the client, authoritative core on Supabase, explicit contracts at the boundary, React only presents and composes.*
